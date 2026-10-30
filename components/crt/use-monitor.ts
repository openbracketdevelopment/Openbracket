"use client"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import {
  activatePower,
  advancePower,
  initialPower,
  powerDelay,
} from "../../lib/crt-power"
import {
  advanceTyping,
  initialTypingState,
  typingDelay,
} from "../../lib/typewriter"
import {
  subscribeTexasClock,
  getTexasClock,
  getServerTexasClock,
} from "../../lib/texas-clock"

export function useMonitorPower(reduced: boolean) {
  const [power, setPower] = useState(initialPower)
  const state = useRef(power)
  const activate = useCallback(() => {
    const next = activatePower(state.current, performance.now())
    if (next === state.current) return false
    state.current = next
    setPower(next)
    return true
  }, [])
  useEffect(() => {
    const delay = powerDelay(power, reduced)
    if (delay === null) return
    const timer = window.setTimeout(() => {
      const next = advancePower(state.current, performance.now())
      state.current = next
      setPower(next)
    }, delay)
    return () => window.clearTimeout(timer)
  }, [power, reduced])
  return { power, activate }
}

export function useResumableTyping(enabled: boolean) {
  const [typing, setTyping] = useState(initialTypingState)
  const timer = useRef<{
    id: number | null
    started: number
    remaining: number
    state: typeof initialTypingState
  }>({
    id: null,
    started: 0,
    remaining: typingDelay(initialTypingState),
    state: initialTypingState,
  })
  const freeze = useCallback(() => {
    const current = timer.current
    if (current.id === null) return
    window.clearTimeout(current.id)
    current.remaining = Math.max(
      0,
      current.remaining - (performance.now() - current.started),
    )
    current.id = null
  }, [])
  const reset = useCallback(() => {
    freeze()
    timer.current.state = initialTypingState
    timer.current.remaining = typingDelay(initialTypingState)
    setTyping(initialTypingState)
  }, [freeze])
  useEffect(() => {
    const current = timer.current
    if (current.state !== typing) {
      current.state = typing
      current.remaining = typingDelay(typing)
    }
    if (!enabled) return
    current.started = performance.now()
    current.id = window.setTimeout(() => {
      current.id = null
      current.remaining = 0
      setTyping(advanceTyping)
    }, current.remaining)
    return freeze
  }, [enabled, typing, freeze])
  return { typing, freeze, reset }
}

export function useTexasClock() {
  return useSyncExternalStore(
    subscribeTexasClock,
    getTexasClock,
    getServerTexasClock,
  )
}
