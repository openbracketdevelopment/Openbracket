"use client"
import { useEffect, useRef, useState } from "react"
import { CrtAudio } from "../../lib/crt-audio"
import type { TypingState } from "../../lib/typewriter"
import { terminalPhrases } from "../../lib/typewriter"
export function useCrtAudio(
  typing: TypingState,
  canType: boolean,
  ready = true,
) {
  const controller = useRef<CrtAudio | null>(null)
  const previous = useRef(typing)
  const enabling = useRef(false)
  const action = useRef(0)
  const muted = useRef(false)
  const unlocked = useRef(false)
  const [enabled, setEnabled] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  useEffect(() => {
    unlocked.current = false
    const audio = new CrtAudio()
    controller.current = audio
    // Best-effort autoplay; a pending browser resume never locks the sound button.
    try {
      muted.current = window.localStorage.getItem("openbracket-sound") === "off"
    } catch {}
    const autoplayAction = action.current
    if (ready && !muted.current)
      void audio.enable().then(active => {
        if (controller.current === audio && action.current === autoplayAction) {
          unlocked.current = active
          setEnabled(active)
        }
      })
    const visibility = () => {
      void audio.visibility(!document.hidden).then(active => {
        if (controller.current === audio && !document.hidden) setEnabled(active)
      })
    }
    const unlock = (event: Event) => {
      if (
        unlocked.current ||
        muted.current ||
        !ready ||
        document.hidden ||
        (event.target instanceof window.Element &&
          event.target.closest(".sound-toggle"))
      )
        return
      void audio.enable().then(active => {
        if (controller.current === audio && !muted.current) {
          unlocked.current = active
          setEnabled(active)
        }
      })
    }
    document.addEventListener("pointerdown", unlock, { once: true })
    document.addEventListener("keydown", unlock, { once: true })
    document.addEventListener("visibilitychange", visibility)
    return () => {
      document.removeEventListener("pointerdown", unlock)
      document.removeEventListener("keydown", unlock)
      document.removeEventListener("visibilitychange", visibility)
      controller.current = null
      audio.dispose()
    }
  }, [ready])
  useEffect(() => {
    const before = previous.current
    previous.current = typing
    if (
      canType &&
      typing.phase === "typing" &&
      typing.phrase === before.phrase &&
      typing.length === before.length + 1
    )
      controller.current?.type(
        terminalPhrases[typing.phrase][typing.length - 1],
      )
  }, [typing, canType])
  async function toggle() {
    const audio = controller.current
    if (!audio || enabling.current) return
    action.current++
    if (enabled) {
      unlocked.current = false
      muted.current = true
      try {
        window.localStorage.setItem("openbracket-sound", "off")
      } catch {}
      audio.mute()
      setEnabled(false)
      return
    }
    muted.current = false
    try {
      window.localStorage.setItem("openbracket-sound", "on")
    } catch {}
    enabling.current = true
    const active = await audio.enable()
    enabling.current = false
    if (controller.current !== audio) return
    unlocked.current = active
    setEnabled(active)
    setUnavailable(!active)
  }
  return { enabled, unavailable, toggle, controller }
}
