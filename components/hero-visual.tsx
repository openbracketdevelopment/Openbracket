"use client"
import dynamic from "next/dynamic"
import MonitorFallback from "./crt/monitor-fallback"
import { useEffect, useRef, useState } from "react"

import { terminalPhrases } from "../lib/typewriter"

import {
  useMonitorPower,
  useResumableTyping,
  useTexasClock,
} from "./crt/use-monitor"
import PowerControl from "./crt/power-control"
import { powerAnnouncement, powerBusy } from "../lib/crt-power"

const MonitorScene = dynamic(() => import("./crt/monitor-scene"), {
  ssr: false,
})

export default function HeroVisual() {
  const host = useRef<HTMLDivElement>(null)
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [motionOverride, setMotionOverride] = useState(false)
  const staticTerminal = reduced && !motionOverride
  const [graphics, setGraphics] = useState(false)
  const [visible, setVisible] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [highlighted, setHighlighted] = useState(false)
  const { power, activate } = useMonitorPower(reduced)
  const canType = running && !paused && !staticTerminal && power.phase === "ON"
  const { typing, freeze, reset } = useResumableTyping(canType)
  const clock = useTexasClock()
  function activateMonitor() {
    if (powerBusy(power.phase)) return
    freeze()
    activate()
  }
  useEffect(() => {
    const element = host.current
    if (!element) return
    let visible = false
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => {
      setReduced(preference.matches)
      setRunning(visible && !document.hidden)
    }
    const observer = new IntersectionObserver(
      entries => {
        visible = entries[0].isIntersecting
        setVisible(visible)
        if (
          visible &&
          ("WebGLRenderingContext" in window ||
            "WebGL2RenderingContext" in window) &&
          "ResizeObserver" in window
        )
          setGraphics(true)
        sync()
      },
      { threshold: 0.15 },
    )
    observer.observe(element)
    document.addEventListener("visibilitychange", sync)
    preference.addEventListener("change", sync)
    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", sync)
      preference.removeEventListener("change", sync)
    }
  }, [])
  const text = staticTerminal
    ? terminalPhrases[0]
    : terminalPhrases[typing.phrase].slice(0, typing.length)
  const blink =
    canType && (typing.phase === "holding" || typing.phase === "waiting")
  return (
    <div
      className="crt-composition"
      ref={host}
      data-running={canType}
      data-motion-override={motionOverride}
    >
      <span className="sr-only">
        OpenBracket: Have a project in mind? We build thoughtful websites and
        useful applications. Let’s make something useful.
      </span>
      <div className="diagram-grid" aria-hidden="true" />
      <span className="art-coordinate mono">
        OB / PERSONAL POSSIBILITY COMPUTER
      </span>
      <div
        className="monitor-assembly"
        role="group"
        aria-label="Interactive CRT monitor"
        data-power={power.phase}
        data-pressed={pressed}
      >
        <noscript>
          <style>{`.terminal-typed{display:none}.terminal-static{display:block!important}`}</style>
        </noscript>
        <MonitorFallback
          text={text}
          blink={blink}
          power={power}
          clock={clock}
          reduced={reduced}
        />
        {graphics && (
          <MonitorScene
            text={text}
            blink={blink}
            active={visible && canType}
            reduced={reduced}
            power={power}
            clock={clock}
            pressed={pressed}
            highlighted={highlighted}
          />
        )}
        <PowerControl
          phase={power.phase}
          activate={activateMonitor}
          press={setPressed}
          highlight={setHighlighted}
        />
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {powerAnnouncement(power.phase)}
      </p>
      <div className="art-controls">
        <span className="mono">OLD-SCHOOL CHARM. NEW POSSIBILITIES.</span>
        <button
          onClick={() => {
            if (staticTerminal) {
              setMotionOverride(true)
              reset()
              setPaused(false)
            } else setPaused(!paused)
          }}
          aria-pressed={paused}
          aria-label={
            staticTerminal
              ? "Play terminal animation (reduced motion is enabled)"
              : undefined
          }
        >
          {staticTerminal
            ? "Play terminal ▷"
            : paused
              ? "Resume terminal ▷"
              : "Pause terminal Ⅱ"}
        </button>
      </div>
    </div>
  )
}
