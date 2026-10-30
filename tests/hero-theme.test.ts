import { test } from "node:test"
import assert from "node:assert/strict"
import { JSDOM } from "jsdom"
import { createElement, act, StrictMode } from "react"
import { createRoot } from "react-dom/client"
import ThemeToggle from "../components/theme-toggle"
import HeroVisual from "../components/hero-visual"
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
    act(() => root.render(createElement(ThemeToggle)))
    const button = env.window.document.querySelector("button")!
    assert.equal(button.getAttribute("role"), "switch")
    assert.equal(button.getAttribute("aria-checked"), "false")
    act(() => env.preference("(prefers-color-scheme: dark)", true))
    assert.equal(button.getAttribute("aria-checked"), "true")
    act(() => button.click())
    assert.equal(env.window.localStorage.getItem(themeStorageKey), "light")
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
    assert.equal(timers.size, 1)
    const [key, timer] = [...timers][0]
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
    assert.equal(timers.size, 0)
    act(() =>
      env.window.document
        .querySelector<HTMLButtonElement>(".art-controls button")!
        .click(),
    )
    assert.equal(timers.size, 1)
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
    assert.equal(timers.size, 1)
    act(() => env.preference("(prefers-reduced-motion: reduce)", true))
    assert.equal(timers.size, 0)
    assert.equal(text(), terminalPhrases[0] + "▋")
    assert.equal(cursor().getAttribute("data-blink"), "false")
    assert.ok(
      env.window.document
        .querySelector(".sr-only")!
        .textContent!.includes("Have a project in mind?"),
    )
    assert.equal(
      env.window.document
        .querySelector(".monitor-assembly")!
        .getAttribute("aria-hidden"),
      "true",
    )
  } finally {
    act(() => root.unmount())
    assert.equal(timers.size, 0)
    env.cleanup()
  }
})
