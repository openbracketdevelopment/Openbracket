// Supplied recordings provide all effects and the separate quiet room loop.
export const audioAssets = {
  keys: ["/audio/key-1.wav", "/audio/key-2.wav", "/audio/key-3.wav"],
  on: "/audio/power-on.wav",
  off: "/audio/power-off.wav",
  room: "/audio/room-ambience.mp3",
}
async function fetchAudio(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Audio request failed: ${response.status}`)
  return response.arrayBuffer()
}
export class CrtAudio {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private clicks: AudioBuffer[] = []
  private room: AudioBuffer | null = null
  private startup: AudioBuffer | null = null
  private shutdown: AudioBuffer | null = null
  private buffers = new Map<string, AudioBuffer>()
  private loading: Promise<void> | null = null
  private requests: AbortController | null = null
  private loadTimeout: ReturnType<typeof setTimeout> | null = null
  private ambience: AudioBufferSourceNode | null = null
  private voices = new Set<AudioScheduledSourceNode>()
  private allowed = false
  private generation = 0
  private variation = 0
  private disposed = false

  constructor(
    private createContext = () => new AudioContext(),
    private loadFile = fetchAudio,
  ) {}

  private prepare() {
    if (this.context) return this.context
    const context = this.createContext()
    this.context = context
    this.master = context.createGain()
    this.master.gain.value = 0
    this.master.connect(context.destination)
    return context
  }

  private loadEffects(context: AudioContext) {
    if (this.loading) return this.loading
    const requests = new AbortController()
    this.requests = requests
    this.loadTimeout = setTimeout(() => requests.abort(), 8000)
    this.loading = Promise.all(
      [
        ...audioAssets.keys,
        audioAssets.on,
        audioAssets.off,
        audioAssets.room,
      ].map(async url => {
        if (this.buffers.has(url)) return
        try {
          const bytes = await this.loadFile(url, requests.signal)
          if (this.disposed || requests.signal.aborted) return
          const buffer = await context.decodeAudioData(bytes)
          if (!this.disposed && this.context === context)
            this.buffers.set(url, buffer)
        } catch {
          // A failed asset stays silent; successful clips and ambience still work.
          // Missing assets retry on the next enable, never as delayed sound effects.
        }
      }),
    )
      .then(() => {
        if (this.disposed) return
        this.clicks = audioAssets.keys.flatMap(url => {
          const buffer = this.buffers.get(url)
          return buffer ? [buffer] : []
        })
        this.room = this.buffers.get(audioAssets.room) ?? null
        this.startup = this.buffers.get(audioAssets.on) ?? null
        this.shutdown = this.buffers.get(audioAssets.off) ?? null
      })
      .finally(() => {
        if (this.loadTimeout !== null) clearTimeout(this.loadTimeout)
        this.loadTimeout = null
        this.loading = null
        this.requests = null
      })
    return this.loading
  }

  async enable() {
    const generation = ++this.generation
    try {
      if (this.disposed || document.hidden) return false
      const context = this.prepare()
      // Call resume in the user gesture before waiting for downloads/decoding.
      await Promise.all([context.resume(), this.loadEffects(context)])
      if (
        generation !== this.generation ||
        this.disposed ||
        document.hidden ||
        context.state !== "running"
      )
        return false
      this.allowed = true
      this.master!.gain.cancelScheduledValues(context.currentTime)
      this.master!.gain.setValueAtTime(0, context.currentTime)
      this.master!.gain.linearRampToValueAtTime(1, context.currentTime + 0.12)
      this.startRoom()
      return true
    } catch {
      if (generation === this.generation) this.allowed = false
      return false
    }
  }

  private startRoom() {
    if (this.ambience || !this.context || !this.room || !this.master) return
    const source = this.context.createBufferSource()
    const gain = this.context.createGain()
    source.buffer = this.room
    source.loop = true
    gain.gain.setValueAtTime(0, this.context.currentTime)
    gain.gain.linearRampToValueAtTime(0.18, this.context.currentTime + 0.3) // Far below the soft interaction taps.
    source.connect(gain).connect(this.master)
    source.onended = () => {
      source.disconnect()
      gain.disconnect()
    }
    this.ambience = source
    source.start()
  }

  mute() {
    ++this.generation
    this.allowed = false
    const context = this.context
    if (!context || !this.master) return
    const now = context.currentTime
    this.master.gain.cancelScheduledValues(now)
    this.master.gain.setValueAtTime(this.master.gain.value, now)
    this.master.gain.linearRampToValueAtTime(0, now + 0.025)
    this.stopSources(context.state === "running" ? now + 0.03 : now)
  }

  private stopSources(when: number) {
    this.voices.forEach(source => {
      source.stop(when)
    })
    this.voices.clear()
    this.ambience?.stop(when)
    this.ambience = null
  }

  async visibility(visible: boolean) {
    if (!this.context || !this.allowed) return this.allowed
    if (!visible) {
      this.stopSources(this.context.currentTime)
      try {
        await this.context.suspend()
      } catch {
        /* Browser may already have suspended audio. */
      }
      return this.allowed
    }
    try {
      await this.context.resume()
      if (!this.allowed || this.disposed || document.hidden) return false
      if (this.context.state !== "running") {
        this.allowed = false
        return false
      }
      this.startRoom()
      return true
    } catch {
      this.allowed = false
      return false
    }
  }

  private ready() {
    return (
      this.allowed &&
      !this.disposed &&
      !document.hidden &&
      this.context?.state === "running"
    )
  }

  private track(source: AudioScheduledSourceNode, gain: GainNode) {
    this.voices.add(source)
    source.onended = () => {
      this.voices.delete(source)
      source.disconnect()
      gain.disconnect()
    }
  }

  type(character: string) {
    if (
      !this.ready() ||
      !character ||
      /[\s\p{Cc}]/u.test(character) ||
      this.voices.size >= 3 ||
      !this.clicks.length
    )
      return
    const context = this.context!
    const source = context.createBufferSource()
    const gain = context.createGain()
    source.buffer = this.clicks[this.variation++ % this.clicks.length]
    source.playbackRate.value = 1
    gain.gain.value = 0.32
    source.connect(gain).connect(this.master!)
    this.track(source, gain)
    source.start()
  }

  power(on: boolean) {
    if (!this.ready()) return
    const context = this.context!
    const buffer = on ? this.startup : this.shutdown
    if (!buffer) return
    const source = context.createBufferSource()
    const gain = context.createGain()
    source.buffer = buffer
    gain.gain.value = on ? 0.4 : 0.46
    source.connect(gain).connect(this.master!)
    this.track(source, gain)
    source.start(context.currentTime)
  }

  dispose() {
    this.disposed = true
    this.mute()
    this.requests?.abort()
    if (this.loadTimeout !== null) clearTimeout(this.loadTimeout)
    this.loadTimeout = null
    this.buffers.clear()
    this.master?.disconnect()
    void this.context?.close().catch(() => {})
    this.context = null
    this.clicks = []
    this.room = null
    this.shutdown = null
    this.startup = null
  }
}
