export const texasClockConfig = {
  timeZone: "America/Chicago",
  dayStart: 6,
  nightStart: 18,
}
const timeFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: texasClockConfig.timeZone,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZoneName: "short",
})
const hourFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: texasClockConfig.timeZone,
  hour: "numeric",
  hourCycle: "h23",
})
export type TexasClock = { label: string; isDay: boolean }
export function formatTexasTime(date: Date): TexasClock {
  const parts = timeFormat.formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value || ""
  const hour = Number(
    hourFormat.formatToParts(date).find(part => part.type === "hour")?.value,
  )
  return {
    label: `DFW, TX · ${value("hour")}:${value("minute")} ${value("dayPeriod")} ${value("timeZoneName")}`,
    isDay:
      hour >= texasClockConfig.dayStart && hour < texasClockConfig.nightStart,
  }
}
export function nextMinuteDelay(now: number) {
  return 60000 - (now % 60000)
}

// Both hero clocks subscribe to one minute-aligned source. No browser work at import.
let snapshot: TexasClock | null = null
let minuteTimer: number | undefined
const clockListeners = new Set<() => void>()
function refreshClock() {
  window.clearTimeout(minuteTimer)
  if (document.hidden) return
  const now = Date.now()
  snapshot = formatTexasTime(new Date(now))
  clockListeners.forEach(listener => listener())
  minuteTimer = window.setTimeout(refreshClock, nextMinuteDelay(now))
}
export function subscribeTexasClock(listener: () => void) {
  clockListeners.add(listener)
  if (clockListeners.size === 1) {
    refreshClock()
    document.addEventListener("visibilitychange", refreshClock)
  }
  return () => {
    clockListeners.delete(listener)
    if (!clockListeners.size) {
      window.clearTimeout(minuteTimer)
      minuteTimer = undefined
      document.removeEventListener("visibilitychange", refreshClock)
      snapshot = null
    }
  }
}
export const getTexasClock = () => snapshot
export const getServerTexasClock = () => null
