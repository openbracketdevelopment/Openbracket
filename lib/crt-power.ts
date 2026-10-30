export type PowerPhase =
  "ON" | "POWERING_OFF" | "OFF" | "POWERING_ON" | "BOOTING"
export type PowerState = {
  phase: PowerPhase
  startedAt: number
  bootStep: number
}
export const initialPower: PowerState = {
  phase: "ON",
  startedAt: 0,
  bootStep: 0,
}
export const powerTiming = {
  off: 720,
  on: 850,
  bootLine: 330,
  bootHold: 1000,
  reducedFade: 160,
}
export const bootMessages = [
  "OPENBRACKET PERSONAL COMPUTER",
  "OB/DOS v0.1",
  "",
  "> mem /check .............. OK",
  "> display.sys /init ....... OK",
  "> load creative-tools .... OK",
  "> clock /zone:DFW ......... OK",
  "> connect human ↔ human .. READY",
  "> run good-things.exe",
  "  good-things.exe initialized.",
]
export function powerBusy(phase: PowerPhase) {
  return phase !== "ON" && phase !== "OFF"
}
export function activatePower(state: PowerState, now: number): PowerState {
  if (powerBusy(state.phase)) return state
  return {
    phase: state.phase === "ON" ? "POWERING_OFF" : "POWERING_ON",
    startedAt: now,
    bootStep: 0,
  }
}
export function powerDelay(state: PowerState, reduced: boolean): number | null {
  if (state.phase === "POWERING_OFF")
    return reduced ? powerTiming.reducedFade : powerTiming.off
  if (state.phase === "POWERING_ON")
    return reduced ? powerTiming.reducedFade : powerTiming.on
  if (state.phase === "BOOTING")
    return state.bootStep < bootMessages.length
      ? powerTiming.bootLine
      : powerTiming.bootHold
  return null
}
export function advancePower(state: PowerState, now: number): PowerState {
  if (state.phase === "POWERING_OFF")
    return { phase: "OFF", startedAt: now, bootStep: 0 }
  if (state.phase === "POWERING_ON")
    return {
      phase: "BOOTING",
      startedAt: now,
      bootStep: 1,
    }
  if (state.phase === "BOOTING")
    return state.bootStep < bootMessages.length
      ? { ...state, bootStep: state.bootStep + 1 }
      : { phase: "ON", startedAt: now, bootStep: 0 }
  return state
}
export function powerAnnouncement(phase: PowerPhase) {
  return phase === "ON"
    ? "Monitor ready"
    : phase === "OFF"
      ? "Monitor off"
      : phase === "POWERING_OFF"
        ? "Turning monitor off"
        : "Starting monitor"
}
export function screenEffect(
  phase: PowerPhase,
  elapsed: number,
  reduced: boolean,
) {
  const result = {
    image: 1,
    scaleY: 1,
    line: 0,
    lineWidth: 1,
    point: 0,
    emission: 0.62,
  }
  if (phase === "OFF") return { ...result, image: 0, emission: 0 }
  if (phase === "ON" || phase === "BOOTING") return result
  if (reduced) {
    const fraction = Math.min(1, elapsed / powerTiming.reducedFade)
    const alpha = phase === "POWERING_OFF" ? 1 - fraction : fraction
    return { ...result, image: alpha, emission: 0.62 * alpha }
  }
  if (phase === "POWERING_OFF") {
    if (elapsed < 240) {
      const t = Math.max(0, elapsed / 240)
      return {
        ...result,
        image: 1 - 0.25 * t,
        scaleY: Math.max(0.004, (1 - t) ** 3),
        line: Math.max(0, (t - 0.45) / 0.55),
        emission: 0.62 + 0.2 * t,
      }
    }
    if (elapsed < 580) {
      const contraction = Math.max(0, (elapsed - 380) / 200)
      return {
        ...result,
        image: 0,
        line: 1,
        lineWidth: Math.max(0.006, (1 - contraction) ** 2),
        emission: 0.82,
      }
    }
    const point = Math.max(0, 1 - (elapsed - 580) / 140)
    return { ...result, image: 0, point, emission: 0.75 * point }
  }

  // Warm-up grows from a dim central glow, not a reversed shutdown.
  if (elapsed < 200) return { ...result, image: 0, emission: 0 }
  if (elapsed < 400) {
    const t = (elapsed - 200) / 200
    return {
      ...result,
      image: 0.15,
      scaleY: 0.008 + 0.022 * t,
      line: 0.2,
      lineWidth: 0.03 + 0.97 * t,
      point: 0.2 * (1 - t),
      emission: 0.18 + 0.2 * t,
    }
  }
  if (elapsed < 700) {
    const t = (elapsed - 400) / 300
    return {
      ...result,
      image: 0.2 + 0.8 * t,
      scaleY: 0.03 + 0.97 * (1 - (1 - t) ** 2),
      emission: 0.38 + 0.24 * t,
    }
  }
  const t = Math.min(1, (elapsed - 700) / 150)
  return { ...result, emission: 0.62 + 0.06 * Math.sin(t * Math.PI) }
}
