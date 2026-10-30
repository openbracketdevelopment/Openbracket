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
