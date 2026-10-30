import { test } from "node:test"
import assert from "node:assert/strict"
import { CrtAudio } from "../lib/crt-audio"

// A narrow Web Audio test double observes playback/scheduling without a sound device.
function audioDevice(blocked = false) {
  const sources: {
    kind: string
    started: boolean
    stopped: boolean
    loop: boolean
    onended: (() => void) | null
  }[] = []
  const parameter = () => ({
    value: 0,
    cancelScheduledValues() {},
    setValueAtTime() {},
    linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {},
  })
  const node = () => ({
    connect(target: unknown) {
      return target
    },
    disconnect() {},
  })
  let buffers = 0
  let decoded = 0
  let requests = 0
  const context = {
    sampleRate: 1000,
    currentTime: 0,
    state: "suspended",
    destination: {},
    createGain: () => ({ ...node(), gain: parameter() }),
    createBuffer: (_channels: number, length: number) => {
      buffers++
      return { getChannelData: () => new Float32Array(length) }
    },
    async decodeAudioData() {
      decoded++
      return { duration: 0.1 }
    },
    createBufferSource: () => source("buffer"),
    createOscillator: () =>
      Object.assign(source("oscillator"), {
        frequency: parameter(),
        type: "sine",
      }),
    async resume() {
      if (blocked) throw Error("blocked")
      this.state = "running"
    },
    async suspend() {
      this.state = "suspended"
    },
    async close() {
      this.state = "closed"
    },
  }
  function source(kind: string) {
    const item = {
      ...node(),
      kind,
      started: false,
      stopped: false,
      loop: false,
      onended: null as (() => void) | null,
      playbackRate: parameter(),
      start() {
        this.started = true
      },
      stop() {
        this.stopped = true
      },
    }
    sources.push(item)
    return item
  }
  return {
    context: context as unknown as AudioContext,
    sources,
    bufferCount: () => buffers,
    decodeCount: () => decoded,
    requestCount: () => requests,
    loadFile: async () => {
      requests++
      return new ArrayBuffer(1)
    },
  }
}

test("audio loads on enable, caches decoded recordings, bounds typing voices, mutes and resumes no missed cues", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document")
  const page = { hidden: false }
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: page,
  })
  const device = audioDevice()
  let constructions = 0
  const audio = new CrtAudio(() => {
    constructions++
    return device.context
  }, device.loadFile)
  try {
    audio.type("a")
    audio.power(false)
    assert.equal(
      constructions,
      0,
      "no audio resources or playback before consent",
    )
    assert.equal(await audio.enable(), true)
    assert.equal(device.bufferCount(), 0)
    assert.equal(device.decodeCount(), 6)
    assert.equal(device.requestCount(), 6)
    assert.equal(device.sources.length, 1, "enabling starts only room tone")
    assert.equal(device.sources[0].loop, true)
    audio.type(" ")
    audio.type("\n")
    assert.equal(device.sources.length, 1)
    for (let i = 0; i < 8; i++) audio.type("a")
    assert.equal(device.sources.length, 4, "maximum three interaction voices")
    device.sources.slice(1).forEach(source => source.onended?.())
    audio.power(false)
    assert.equal(device.sources.at(-1)?.kind, "buffer")
    page.hidden = true
    await audio.visibility(false)
    assert.ok(
      device.sources[0].stopped && device.sources.at(-1)?.stopped,
      "active ambience and power cue stop on hide",
    )
    const before = device.sources.length
    audio.type("x")
    audio.power(true)
    assert.equal(device.sources.length, before)
    page.hidden = false
    await audio.visibility(true)
    assert.equal(
      device.sources.length,
      before + 1,
      "return starts only ambience, no queued cues",
    )
    audio.mute()
    const muted = device.sources.length
    audio.type("x")
    audio.power(true)
    assert.equal(device.sources.length, muted)
    await audio.enable()
    assert.equal(device.decodeCount(), 6, "unmuting reuses decoded recordings")
  } finally {
    audio.dispose()
    assert.equal(device.context.state, "closed")
    if (previous) Object.defineProperty(globalThis, "document", previous)
    else Reflect.deleteProperty(globalThis, "document")
  }
})

test("blocked or unavailable audio stays silent and fails gracefully", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document")
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { hidden: false },
  })
  const device = audioDevice(true)
  const blocked = new CrtAudio(() => device.context, device.loadFile)
  const unavailable = new CrtAudio(() => {
    throw Error("unsupported")
  })
  try {
    assert.equal(await blocked.enable(), false)
    blocked.type("a")
    blocked.power(false)
    assert.equal(device.sources.length, 0)
    assert.equal(await unavailable.enable(), false)
  } finally {
    blocked.dispose()
    unavailable.dispose()
    if (previous) Object.defineProperty(globalThis, "document", previous)
    else Reflect.deleteProperty(globalThis, "document")
  }
})

test("a missing recording stays silent, retries on enable, and never delays a power cue", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "document")
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { hidden: false },
  })
  const device = audioDevice()
  const urls: string[] = []
  let failStartup = true
  const audio = new CrtAudio(
    () => device.context,
    async url => {
      urls.push(url)
      if (url.endsWith("power-on.wav") && failStartup)
        throw Error("missing asset")
      return new ArrayBuffer(1)
    },
  )
  try {
    assert.equal(await audio.enable(), true)
    const before = device.sources.length
    audio.power(true)
    assert.equal(
      device.sources.length,
      before,
      "missing startup never falls back to the old synthesized sound",
    )
    audio.power(false)
    assert.equal(device.sources.length, before + 1)
    audio.mute()
    failStartup = false
    await audio.enable()
    assert.equal(
      urls.length,
      7,
      "only the failed file is fetched a second time",
    )
    const resumed = device.sources.length
    assert.equal(
      resumed,
      before + 2,
      "retry starts ambience without replaying the missed startup",
    )
    audio.power(true)
    assert.equal(device.sources.length, resumed + 1)
  } finally {
    audio.dispose()
    if (previous) Object.defineProperty(globalThis, "document", previous)
    else Reflect.deleteProperty(globalThis, "document")
  }
})
