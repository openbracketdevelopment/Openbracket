import { test, mock } from "node:test"
import assert from "node:assert/strict"
import { JSDOM } from "jsdom"
import { createElement, act, StrictMode } from "react"
import { createRoot } from "react-dom/client"
import ThemeToggle from "../components/theme-toggle"
import HeroVisual from "../components/hero-visual"
import { CrtAudio } from "../lib/crt-audio"
import PowerControl from "../components/crt/power-control"
import {
  useResumableTyping,
  useTexasClock,
} from "../components/crt/use-monitor"
import { themeBootstrap, themeStorageKey } from "../lib/theme"
import {
  advanceTyping,
  initialTypingState,
  terminalPhrases,
  terminalTiming,
  typingDelay,
} from "../lib/typewriter"

test("every phrase types, holds for three seconds, deletes, and advances in sequence", () => {
  let state = initialTypingState
  for (let index = 0; index <= terminalPhrases.length; index++) {
    const phrase = terminalPhrases[index % terminalPhrases.length]
    assert.equal(state.phase, "waiting")
    assert.equal(typingDelay(state), terminalTiming.gap)
    state = advanceTyping(state)
    for (let length = 1; length <= phrase.length; length++) {
      assert.equal(state.length, length)
      assert.equal(state.phase, "typing")
      assert.equal(typingDelay(state), 85)
      state = advanceTyping(state)
    }
    assert.equal(state.phase, "holding")
    assert.equal(typingDelay(state), 3000)
    state = advanceTyping(state)
    for (let length = phrase.length; length >= 0; length--) {
      assert.equal(state.phase, "deleting")
      assert.equal(state.length, length)
      assert.equal(typingDelay(state), 40)
      state = advanceTyping(state)
    }
    assert.equal(state.phrase, (index + 1) % terminalPhrases.length)
  }
})

function environment(systemDark = false, reduced = false) {
  const dom = new JSDOM('<html><body><div id="test"></div></body></html>', {
    url: "https://openbracket.test",
    runScripts: "outside-only",
    pretendToBeVisual: true,
  })
  const { window } = dom
  const preferences = new Map<string, EventTarget & { matches: boolean }>()
  window.matchMedia = ((query: string) => {
    if (!preferences.has(query))
      preferences.set(
        query,
        Object.assign(new window.EventTarget(), {
          matches: query.includes("reduced-motion") ? reduced : systemDark,
        }),
      )
    return preferences.get(query)
  }) as typeof window.matchMedia
  const globals = [
    "window",
    "document",
    "HTMLElement",
    "IntersectionObserver",
    "IS_REACT_ACT_ENVIRONMENT",
  ]
  const previous = globals.map(key =>
    Object.getOwnPropertyDescriptor(globalThis, key),
  )
  const observer = class {
    constructor(
      private callback: (entries: { isIntersecting: boolean }[]) => void,
    ) {}
    observe() {
      this.callback([{ isIntersecting: true }])
    }
    disconnect() {}
  }
  const values = [window, window.document, window.HTMLElement, observer, true]
  globals.forEach((key, i) =>
    Object.defineProperty(globalThis, key, {
      value: values[i],
      configurable: true,
      writable: true,
    }),
  )
  function preference(query: string, value: boolean) {
    const item = preferences.get(query)
    assert.ok(item)
    item.matches = value
    item.dispatchEvent(new window.Event("change"))
  }
  return {
    window,
    preference,
    cleanup() {
      globals.forEach((key, i) => {
        const descriptor = previous[i]
        if (descriptor) Object.defineProperty(globalThis, key, descriptor)
        else Reflect.deleteProperty(globalThis, key)
      })
      window.close()
    },
  }
}

test("bootstrap honors system, valid saved choices, invalid storage, and blocked storage before rendering", () => {
  const env = environment(true)
  try {
    env.window.eval(themeBootstrap)
    assert.equal(env.window.document.documentElement.dataset.theme, "dark")
    env.window.localStorage.setItem(themeStorageKey, "light")
    env.window.eval(themeBootstrap)
    assert.equal(env.window.document.documentElement.dataset.theme, "light")
    env.window.localStorage.setItem(themeStorageKey, "invalid")
    env.window.eval(themeBootstrap)
    assert.equal(
      env.window.document.documentElement.dataset.themePreference,
      "system",
    )
    Object.defineProperty(env.window, "localStorage", {
      get() {
        throw new Error("blocked")
      },
    })
    env.window.eval(themeBootstrap)
    assert.equal(env.window.document.documentElement.dataset.theme, "dark")
  } finally {
    env.cleanup()
  }
})

test("theme switch follows the system until explicit selection, persists it, and responds to another tab", () => {
  const env = environment(false)
  const root = createRoot(env.window.document.getElementById("test")!)
  try {
    env.window.eval(themeBootstrap)
    act(() =>
      root.render(
        createElement(
          "div",
          null,
          createElement(ThemeToggle),
          createElement(ThemeToggle),
        ),
      ),
    )
    const buttons =
      env.window.document.querySelectorAll<HTMLButtonElement>("button")
    const button = buttons[0]
    assert.equal(button.getAttribute("role"), "switch")
    assert.equal(button.getAttribute("aria-checked"), "false")
    act(() => env.preference("(prefers-color-scheme: dark)", true))
    assert.equal(button.getAttribute("aria-checked"), "true")
    act(() => button.click())
    assert.equal(env.window.localStorage.getItem(themeStorageKey), "light")
    assert.equal(
      buttons[1].getAttribute("aria-checked"),
      "false",
      "menu and header controls stay synchronized",
    )
    act(() => {
      env.preference("(prefers-color-scheme: dark)", false)
      env.preference("(prefers-color-scheme: dark)", true)
    })
    assert.equal(env.window.document.documentElement.dataset.theme, "light")
    env.window.eval(themeBootstrap)
    assert.equal(env.window.document.documentElement.dataset.theme, "light")
    act(() =>
      env.window.dispatchEvent(
        new env.window.StorageEvent("storage", {
          key: themeStorageKey,
          newValue: "dark",
        }),
      ),
    )
    assert.equal(button.getAttribute("aria-checked"), "true")
    act(() => buttons[1].click())
    assert.equal(button.getAttribute("aria-checked"), "false")
    assert.equal(buttons[1].getAttribute("aria-checked"), "false")
  } finally {
    act(() => root.unmount())
    env.cleanup()
  }
})

test("terminal uses one timer, solid editing cursor, blinking hold, survives theme changes and cleans up", () => {
  const env = environment()
  let id = 0
  const timers = new Map<number, { callback: () => void; delay: number }>()
  env.window.setTimeout = ((callback: () => void, delay: number) => {
    timers.set(++id, { callback, delay })
    return id
  }) as typeof env.window.setTimeout
  env.window.clearTimeout = (timerId: number) => {
    timers.delete(timerId)
  }
  const root = createRoot(env.window.document.getElementById("test")!)
  function tick() {
    const typingTimers = [...timers].filter(([, timer]) => timer.delay <= 3000)
    assert.equal(typingTimers.length, 1)
    const [key, timer] = typingTimers[0]
    timers.delete(key)
    act(() => timer.callback())
    return timer.delay
  }
  try {
    env.window.eval(themeBootstrap)
    act(() =>
      root.render(
        createElement(
          StrictMode,
          null,
          createElement(
            "div",
            null,
            createElement(ThemeToggle),
            createElement(HeroVisual),
          ),
        ),
      ),
    )
    const text = () =>
      env.window.document.querySelector(".terminal-typed")!.textContent
    const cursor = () =>
      env.window.document.querySelector(".terminal-typed .terminal-caret")!
    assert.equal(tick(), 550)
    assert.equal(text(), "h▋")
    assert.equal(cursor().getAttribute("data-blink"), "false")
    const monitor = env.window.document.querySelector(".monitor-assembly")
    const before = text()
    const timerIds = [...timers.keys()]
    act(() =>
      env.window.document
        .querySelector<HTMLButtonElement>(".theme-toggle")!
        .click(),
    )
    assert.equal(text(), before)
    assert.deepEqual([...timers.keys()], timerIds)
    assert.equal(
      env.window.document.querySelector(".monitor-assembly"),
      monitor,
    )
    for (let i = 1; i < terminalPhrases[0].length; i++) assert.equal(tick(), 85)
    tick()
    assert.equal(cursor().getAttribute("data-blink"), "true")
    assert.equal(tick(), 3000)
    assert.equal(cursor().getAttribute("data-blink"), "false")
    tick()
    assert.equal(text(), terminalPhrases[0].slice(0, -1) + "▋")
    act(() =>
      env.window.document
        .querySelector<HTMLButtonElement>(".art-controls button")!
        .click(),
    )
    assert.equal(
      [...timers.values()].filter(timer => timer.delay <= 3000).length,
      0,
    )
    act(() =>
      env.window.document
        .querySelector<HTMLButtonElement>(".art-controls button")!
        .click(),
    )
    assert.equal(timers.size, 2)
    Object.defineProperty(env.window.document, "hidden", {
      value: true,
      configurable: true,
    })
    act(() =>
      env.window.document.dispatchEvent(
        new env.window.Event("visibilitychange"),
      ),
    )
    assert.equal(timers.size, 0)
    Object.defineProperty(env.window.document, "hidden", {
      value: false,
      configurable: true,
    })
    act(() =>
      env.window.document.dispatchEvent(
        new env.window.Event("visibilitychange"),
      ),
    )
    assert.equal(timers.size, 2)
    act(() => env.preference("(prefers-reduced-motion: reduce)", true))
    assert.equal(
      [...timers.values()].filter(timer => timer.delay <= 3000).length,
      0,
    )
    assert.equal(text(), terminalPhrases[0] + "▋")
    assert.equal(cursor().getAttribute("data-blink"), "false")
    const play = env.window.document.querySelector<HTMLButtonElement>(
      ".art-controls button",
    )!
    assert.equal(play.disabled, false)
    assert.match(play.textContent!, /Play terminal/)
    act(() => play.click())
    assert.equal(tick(), 550)
    assert.equal(text(), "h▋")
    for (let i = 1; i < terminalPhrases[0].length; i++) tick()
    tick()
    assert.equal(tick(), 3000)
    for (let i = terminalPhrases[0].length; i >= 0; i--)
      assert.equal(tick(), 40)
    assert.equal(tick(), 550)
    assert.equal(text(), "h▋")
    assert.equal(tick(), 85)
    assert.equal(text(), "ho▋")
    assert.ok(
      env.window.document
        .querySelector(".sr-only")!
        .textContent!.includes("Have a project in mind?"),
    )
    assert.equal(
      env.window.document
        .querySelector(".crt-fallback")!
        .getAttribute("aria-hidden"),
      "true",
    )
  } finally {
    act(() => root.unmount())
    assert.equal(timers.size, 0)
    env.cleanup()
  }
})

test("power button activates once on key release, ignores repeats/busy state, and cancels on blur or pointer cancel", () => {
  const env = environment()
  const root = createRoot(env.window.document.getElementById("test")!)
  let activations = 0
  let pressed = false
  function render(phase: "ON" | "POWERING_OFF" = "ON") {
    act(() =>
      root.render(
        createElement(PowerControl, {
          phase,
          activate: () => {
            activations++
          },
          press: value => {
            pressed = value
          },
          highlight: () => {},
        }),
      ),
    )
  }
  try {
    render()
    const button = env.window.document.querySelector("button")!
    const key = (type: string, repeat = false) =>
      act(() =>
        button.dispatchEvent(
          new env.window.KeyboardEvent(type, {
            key: "Enter",
            repeat,
            bubbles: true,
          }),
        ),
      )
    key("keydown")
    assert.equal(pressed, true)
    key("keydown", true)
    assert.equal(activations, 0)
    key("keyup")
    assert.equal(pressed, false)
    assert.equal(activations, 1)
    key("keyup")
    assert.equal(activations, 1)
    act(() => button.focus())
    key("keydown")
    act(() => button.blur())
    key("keyup")
    assert.equal(activations, 1)
    act(() =>
      button.dispatchEvent(
        new env.window.MouseEvent("pointerdown", { button: 0, bubbles: true }),
      ),
    )
    assert.equal(pressed, true)
    act(() =>
      button.dispatchEvent(
        new env.window.Event("pointercancel", { bubbles: true }),
      ),
    )
    act(() => button.click())
    assert.equal(pressed, false)
    assert.equal(activations, 1)
    render("POWERING_OFF")
    key("keydown")
    key("keyup")
    act(() => button.click())
    assert.equal(activations, 1)
    assert.equal(button.getAttribute("aria-disabled"), "true")
  } finally {
    act(() => root.unmount())
    env.cleanup()
  }
})

test("typewriter preserves exact character and remaining delay across a power-length pause", () => {
  const env = environment()
  const previous = Object.getOwnPropertyDescriptor(performance, "now")
  let now = 0,
    id = 0
  Object.defineProperty(performance, "now", {
    configurable: true,
    value: () => now,
  })
  const timers = new Map<number, { callback: () => void; delay: number }>()
  env.window.setTimeout = ((callback: () => void, delay: number) => {
    timers.set(++id, { callback, delay })
    return id
  }) as typeof env.window.setTimeout
  env.window.clearTimeout = key => {
    if (key !== undefined) timers.delete(key)
  }
  function Terminal({ enabled }: { enabled: boolean }) {
    const { typing } = useResumableTyping(enabled)
    return createElement("span", null, JSON.stringify(typing))
  }
  const root = createRoot(env.window.document.getElementById("test")!)
  const render = (enabled: boolean) =>
    act(() => root.render(createElement(Terminal, { enabled })))
  const fire = () => {
    const [key, timer] = [...timers][0]
    timers.delete(key)
    now += timer.delay
    act(() => timer.callback())
    return timer.delay
  }
  try {
    render(true)
    assert.equal(fire(), 550)
    const character = env.window.document.querySelector("span")!.textContent
    now += 30
    render(false)
    assert.equal(timers.size, 0)
    now += 4000
    render(true)
    assert.equal(
      env.window.document.querySelector("span")!.textContent,
      character,
    )
    assert.equal(fire(), 55)
    // Complete the phrase and suspend midway through its three-second hold.
    while (
      !env.window.document
        .querySelector("span")!
        .textContent!.includes('"holding"')
    )
      fire()
    now += 1234
    render(false)
    now += 10000
    render(true)
    assert.equal(fire(), 1766)
    assert.match(
      env.window.document.querySelector("span")!.textContent!,
      /deleting/,
    )
    now += 15
    render(false)
    now += 4000
    render(true)
    assert.equal(fire(), 25, "deletion resumes its remaining character delay")
  } finally {
    act(() => root.unmount())
    if (previous) Object.defineProperty(performance, "now", previous)
    else Reflect.deleteProperty(performance, "now")
    env.cleanup()
  }
})

test("Texas clock schedules minute boundaries, suspends while hidden and refreshes on return", () => {
  const env = environment()
  let id = 0
  const timers = new Map<number, { callback: () => void; delay: number }>()
  env.window.setTimeout = ((callback: () => void, delay: number) => {
    timers.set(++id, { callback, delay })
    return id
  }) as typeof env.window.setTimeout
  env.window.clearTimeout = key => {
    if (key !== undefined) timers.delete(key)
  }
  const originalNow = Date.now
  let now = Date.parse("2026-07-15T15:42:30Z")
  Date.now = () => now
  function Clock() {
    const clock = useTexasClock()
    return createElement("span", null, clock?.label)
  }
  const root = createRoot(env.window.document.getElementById("test")!)
  try {
    act(() =>
      root.render(
        createElement("div", null, createElement(Clock), createElement(Clock)),
      ),
    )
    assert.match(env.window.document.body.textContent!, /10:42 AM CDT/)
    assert.equal([...timers.values()][0].delay, 30000)
    Object.defineProperty(env.window.document, "hidden", {
      configurable: true,
      value: true,
    })
    act(() =>
      env.window.document.dispatchEvent(
        new env.window.Event("visibilitychange"),
      ),
    )
    assert.equal(timers.size, 0)
    now += 180000
    Object.defineProperty(env.window.document, "hidden", {
      configurable: true,
      value: false,
    })
    act(() =>
      env.window.document.dispatchEvent(
        new env.window.Event("visibilitychange"),
      ),
    )
    assert.match(env.window.document.body.textContent!, /10:45 AM CDT/)
    assert.equal(timers.size, 1)
  } finally {
    act(() => root.unmount())
    assert.equal(timers.size, 0)
    Date.now = originalNow
    env.cleanup()
  }
})

test("hero power cycles preserve manual pause and reject repeated activations throughout boot", () => {
  const env = environment()
  let id = 0
  const timers = new Map<number, { callback: () => void; delay: number }>()
  env.window.setTimeout = ((callback: () => void, delay: number) => {
    timers.set(++id, { callback, delay })
    return id
  }) as typeof env.window.setTimeout
  env.window.clearTimeout = key => {
    if (key !== undefined) timers.delete(key)
  }
  const root = createRoot(env.window.document.getElementById("test")!)
  const step = (delay: number) => {
    const entry = [...timers].find(([, timer]) => timer.delay === delay)
    assert.ok(entry, `expected ${delay}ms timer`)
    timers.delete(entry[0])
    act(() => entry[1].callback())
  }
  try {
    act(() => root.render(createElement(HeroVisual)))
    step(550)
    const text =
      env.window.document.querySelector(".terminal-typed")!.textContent
    const pause = env.window.document.querySelector<HTMLButtonElement>(
      ".art-controls button",
    )!
    act(() => pause.click())
    const power = env.window.document.querySelector<HTMLButtonElement>(
      ".monitor-power-control",
    )!
    act(() => {
      power.click()
      power.click()
      power.click()
    })
    const assembly = env.window.document.querySelector(".monitor-assembly")!
    assert.equal(assembly.getAttribute("data-power"), "POWERING_OFF")
    step(540)
    assert.equal(assembly.getAttribute("data-power"), "OFF")
    act(() => power.click())
    step(850)
    assert.equal(assembly.getAttribute("data-power"), "BOOTING")
    for (let line = 1; line < 10; line++) {
      act(() => power.click())
      step(330)
    }
    step(1000)
    assert.equal(assembly.getAttribute("data-power"), "ON")
    assert.equal(
      env.window.document.querySelector(".terminal-typed")!.textContent,
      text,
    )
    assert.equal(pause.getAttribute("aria-pressed"), "true")
    assert.equal(
      [...timers.values()].filter(timer => timer.delay <= 3000).length,
      0,
    )
  } finally {
    act(() => root.unmount())
    assert.equal(timers.size, 0)
    env.cleanup()
  }
})

test("sound defaults on when permitted, follows typing events, and cues accepted power only once", async () => {
  const env = environment()
  const root = createRoot(env.window.document.getElementById("test")!)
  const clicks: string[] = []
  const cues: boolean[] = []
  const enable = mock.method(CrtAudio.prototype, "enable", async () => true)
  const click = mock.method(CrtAudio.prototype, "type", (character: string) => {
    clicks.push(character)
  })
  const powerCue = mock.method(CrtAudio.prototype, "power", (on: boolean) => {
    cues.push(on)
  })
  let id = 0
  const timers = new Map<number, { callback: () => void; delay: number }>()
  env.window.setTimeout = ((callback: () => void, delay: number) => {
    timers.set(++id, { callback, delay })
    return id
  }) as typeof env.window.setTimeout
  env.window.clearTimeout = key => {
    if (key !== undefined) timers.delete(key)
  }
  function tick() {
    const entry = [...timers].find(([, timer]) => timer.delay <= 3000)
    assert.ok(entry)
    timers.delete(entry[0])
    act(() => entry[1].callback())
  }
  try {
    env.window.localStorage.setItem("openbracket-sound", "off")
    await act(async () => root.render(createElement(HeroVisual)))
    const sound =
      env.window.document.querySelector<HTMLButtonElement>(".sound-toggle")!
    const terminal = env.window.document.querySelector<HTMLButtonElement>(
      ".terminal-controls button",
    )!
    assert.match(terminal.textContent!, /Pause terminal/)
    assert.equal(sound.getAttribute("aria-pressed"), "true")
    assert.equal(sound.getAttribute("aria-label"), "Mute sound")
    assert.match(sound.textContent!, /Sound off/)
    assert.equal(
      enable.mock.callCount(),
      1,
      "fresh load ignores an old mute preference and attempts playback without a power cue",
    )
    assert.equal(cues.length, 0, "initial load has no power cue")
    tick()
    assert.deepEqual(clicks, ["h"])
    const text =
      env.window.document.querySelector(".terminal-typed")!.textContent
    await act(async () => {
      sound.click()
    })
    assert.equal(sound.getAttribute("aria-pressed"), "false")
    assert.match(sound.textContent!, /Sound on/)
    assert.equal(
      env.window.document.querySelector(".terminal-typed")!.textContent,
      text,
    )
    assert.deepEqual(clicks, ["h"], "unmute never replays a character")
    while (
      !env.window.document
        .querySelector(".terminal-typed")!
        .textContent!.startsWith(terminalPhrases[0])
    )
      tick()
    tick() // holding
    const count = clicks.length
    tick() // deleting phase
    tick() // remove a character
    assert.equal(clicks.length, count, "no clicks on hold/deletion")
    const power = env.window.document.querySelector<HTMLButtonElement>(
      ".monitor-power-control",
    )!
    act(() => {
      power.click()
      power.click()
      power.click()
    })
    assert.deepEqual(
      cues,
      [false],
      "only the accepted power action produces a cue",
    )
  } finally {
    act(() => root.unmount())
    enable.mock.restore()
    click.mock.restore()
    powerCue.mock.restore()
    assert.equal(timers.size, 0)
    env.cleanup()
  }
})
