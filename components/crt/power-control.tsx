"use client"
import { useRef } from "react"
import { powerBusy, type PowerPhase } from "../../lib/crt-power"
export default function PowerControl({
  phase,
  activate,
  press,
  highlight,
}: {
  phase: PowerPhase
  activate: () => void
  press: (value: boolean) => void
  highlight: (value: boolean) => void
}) {
  const key = useRef<string | null>(null)
  const canceled = useRef(false)
  const focused = useRef(false)
  const pointerDown = useRef(false)
  const busy = powerBusy(phase)
  const on = phase === "ON" || phase === "POWERING_OFF"
  return (
    <button
      type="button"
      className="monitor-power-control"
      aria-label={
        busy
          ? phase === "POWERING_OFF"
            ? "Monitor shutting down"
            : "Monitor starting"
          : on
            ? "Turn monitor off"
            : "Turn monitor on"
      }
      aria-pressed={on}
      aria-disabled={busy}
      onPointerEnter={() => highlight(true)}
      onPointerLeave={() => {
        if (pointerDown.current && key.current === null) {
          pointerDown.current = false
          canceled.current = true
          press(false)
        }
        highlight(focused.current)
      }}
      onPointerDown={event => {
        if (busy || event.button !== 0) return
        canceled.current = false
        pointerDown.current = true
        press(true)
      }}
      onPointerUp={() => {
        pointerDown.current = false
        press(false)
      }}
      onPointerCancel={() => {
        pointerDown.current = false
        canceled.current = true
        press(false)
      }}
      onFocus={() => {
        canceled.current = false
        focused.current = true
        highlight(true)
      }}
      onBlur={() => {
        pointerDown.current = false
        focused.current = false
        canceled.current = true
        key.current = null
        press(false)
        highlight(false)
      }}
      onKeyDown={event => {
        if (event.key !== "Enter" && event.key !== " ") return
        event.preventDefault()
        if (busy || event.repeat || key.current !== null) return
        key.current = event.key
        canceled.current = false
        press(true)
      }}
      onKeyUp={event => {
        if (event.key !== "Enter" && event.key !== " ") return
        event.preventDefault()
        const valid = key.current === event.key && !canceled.current
        key.current = null
        press(false)
        if (valid && !busy) activate()
      }}
      onClick={() => {
        press(false)
        if (!busy && !canceled.current) activate()
        canceled.current = false
      }}
    >
      <span className="power-control-tooltip" aria-hidden="true">
        {busy
          ? phase === "POWERING_OFF"
            ? "Powering off…"
            : "Starting…"
          : on
            ? "Power off"
            : "Power on"}
      </span>
    </button>
  )
}
