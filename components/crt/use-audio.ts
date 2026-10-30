"use client"
import { useEffect, useRef, useState } from "react"
import { CrtAudio } from "../../lib/crt-audio"
import type { TypingState } from "../../lib/typewriter"
import { terminalPhrases } from "../../lib/typewriter"
export function useCrtAudio(typing: TypingState, canType: boolean) {
  const controller = useRef<CrtAudio | null>(null)
  const previous = useRef(typing)
  const enabling = useRef(false)
  const action = useRef(0)
  const [enabled, setEnabled] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  useEffect(() => {
    const audio = new CrtAudio()
    controller.current = audio
    // Best-effort autoplay; a pending browser resume never locks the sound button.
    const autoplayAction = action.current
    void audio.enable().then(active => {
      if (controller.current === audio && action.current === autoplayAction)
        setEnabled(active)
    })
    const visibility = () => {
      void audio.visibility(!document.hidden).then(active => {
        if (controller.current === audio && !document.hidden) setEnabled(active)
      })
    }
    document.addEventListener("visibilitychange", visibility)
    return () => {
      document.removeEventListener("visibilitychange", visibility)
      controller.current = null
      audio.dispose()
    }
  }, [])
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
      audio.mute()
      setEnabled(false)
      return
    }
    enabling.current = true
    const active = await audio.enable()
    enabling.current = false
    if (controller.current !== audio) return
    setEnabled(active)
    setUnavailable(!active)
  }
  return { enabled, unavailable, toggle, controller }
}
