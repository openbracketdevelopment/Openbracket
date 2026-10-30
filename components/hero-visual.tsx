"use client"
import dynamic from "next/dynamic"
import MonitorFallback from "./crt/monitor-fallback"
import { useEffect, useRef, useState } from "react"

import {
  terminalPhrases,
  initialTypingState,
  advanceTyping,
  typingDelay,
} from "../lib/typewriter"

const MonitorScene = dynamic(() => import("./crt/monitor-scene"), {
  ssr: false,
})

export default function HeroVisual() {
  const host = useRef<HTMLDivElement>(null)
  const [running, setRunning] = useState(false)
  const [paused, setPaused] = useState(false)
  const [reduced, setReduced] = useState(false)
  const [graphics, setGraphics] = useState(false)
  const [visible, setVisible] = useState(false)
  const [typing, setTyping] = useState(initialTypingState)
  useEffect(() => {
    const element = host.current
    if (!element) return
    let visible = false
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => {
      setReduced(preference.matches)
      setRunning(visible && !document.hidden && !preference.matches)
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
  useEffect(() => {
    if (!running || paused) return
    const timer = window.setTimeout(
      () => setTyping(advanceTyping),
      typingDelay(typing),
    )
    return () => window.clearTimeout(timer)
  }, [running, paused, typing])
  const text = reduced
    ? terminalPhrases[0]
    : terminalPhrases[typing.phrase].slice(0, typing.length)
  const blink =
    !reduced &&
    running &&
    !paused &&
    (typing.phase === "holding" || typing.phase === "waiting")
  return (
    <div
      className="crt-composition"
      ref={host}
      data-running={running && !paused}
    >
      <span className="sr-only">
        OpenBracket: Have a project in mind? We build thoughtful websites and
        useful applications. Let’s make something useful.
      </span>
      <div className="diagram-grid" aria-hidden="true" />
      <span className="art-coordinate mono">
        OB / PERSONAL POSSIBILITY COMPUTER
      </span>
      <div className="monitor-assembly" aria-hidden="true">
        <noscript>
          <style>{`.terminal-typed{display:none}.terminal-static{display:block!important}`}</style>
        </noscript>
        <MonitorFallback text={text} blink={blink} />
        {graphics && (
          <MonitorScene
            text={reduced ? terminalPhrases[0] : text}
            blink={blink}
            active={visible && running && !paused}
            reduced={reduced}
          />
        )}
      </div>
      <div className="art-controls">
        <span className="mono">OLD-SCHOOL CHARM. NEW POSSIBILITIES.</span>
        <button
          onClick={() => setPaused(!paused)}
          aria-pressed={paused}
          disabled={reduced}
        >
          {reduced
            ? "Motion reduced"
            : paused
              ? "Resume terminal ▷"
              : "Pause terminal Ⅱ"}
        </button>
      </div>
    </div>
  )
}
