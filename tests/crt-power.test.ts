import { test } from "node:test"
import assert from "node:assert/strict"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import MonitorFallback from "../components/crt/monitor-fallback"
import {
  activatePower,
  advancePower,
  initialPower,
  powerDelay,
  screenEffect,
  bootMessages,
  shutdownMotion,
  powerTiming,
} from "../lib/crt-power"
import { formatTexasTime, nextMinuteDelay } from "../lib/texas-clock"

test("power ignores busy activation and completes shutdown, warm-up and sequential boot", () => {
  let state = activatePower(initialPower, 100)
  assert.equal(state.phase, "POWERING_OFF")
  assert.equal(activatePower(state, 110), state)
  assert.equal(powerDelay(state, false), 540)
  state = advancePower(state, 700)
  assert.equal(state.phase, "OFF")
  assert.equal(powerDelay(state, false), null)
  state = activatePower(state, 800)
  assert.equal(state.phase, "POWERING_ON")
  assert.equal(powerDelay(state, false), 850)
  state = advancePower(state, 1650)
  for (let step = 1; step <= bootMessages.length; step++) {
    assert.equal(state.phase, "BOOTING")
    assert.equal(state.bootStep, step)
    assert.equal(activatePower(state, 1700), state)
    assert.equal(
      powerDelay(state, false),
      step < bootMessages.length ? 330 : 1000,
    )
    state = advancePower(state, 2000 + step * 250)
  }
  assert.equal(state.phase, "ON")
})

test("reduced motion keeps every boot command readable with gentle power fades", () => {
  let state = activatePower(initialPower, 0)
  assert.equal(powerDelay(state, true), 160)
  state = advancePower(state, 160)
  state = activatePower(state, 200)
  assert.equal(powerDelay(state, true), 160)
  state = advancePower(state, 360)
  for (let step = 1; step <= bootMessages.length; step++) {
    assert.equal(state.phase, "BOOTING")
    assert.equal(state.bootStep, step)
    assert.equal(
      powerDelay(state, true),
      step < bootMessages.length ? 330 : 1000,
    )
    state = advancePower(state, 360 + step * 330)
  }
  assert.equal(state.phase, "ON")
  assert.equal(screenEffect("POWERING_OFF", 80, true).scaleY, 1)
  assert.equal(screenEffect("POWERING_OFF", 80, true).image, 0.5)
  assert.equal(bootMessages.at(-2), "> run good-things.exe")
  assert.match(bootMessages.at(-1)!, /initialized/)
})

test("screen content collapses to a shrinking line and point, then starts with a distinct warm-up", () => {
  assert.ok(screenEffect("POWERING_OFF", 130, false).scaleY < 0.1)
  const line = screenEffect("POWERING_OFF", 310, false)
  assert.equal(line.image, 0)
  assert.equal(line.line, 1)
  assert.ok(
    Math.abs(line.lineWidth - 0.5 ** shutdownMotion.contractExponent) < 1e-6,
  )
  assert.ok(screenEffect("POWERING_OFF", 450, false).point > 0)
  assert.equal(screenEffect("OFF", 0, false).emission, 0)
  assert.equal(screenEffect("POWERING_ON", 100, false).image, 0)
  assert.ok(screenEffect("POWERING_ON", 300, false).scaleY < 0.04)
  assert.ok(screenEffect("POWERING_ON", 600, false).scaleY > 0.8)
  assert.equal(screenEffect("POWERING_ON", 850, false).image, 1)
})

test("Texas clock handles CST/CDT, sunrise boundaries and minute scheduling independently of visitor zone", () => {
  assert.deepEqual(formatTexasTime(new Date("2026-01-15T16:42:00Z")), {
    label: "DFW, TX · 10:42 AM CST",
    isDay: true,
  })
  assert.deepEqual(formatTexasTime(new Date("2026-07-15T15:42:00Z")), {
    label: "DFW, TX · 10:42 AM CDT",
    isDay: true,
  })
  for (const [time, day] of [
    ["11:59", false],
    ["12:00", true],
    ["23:59", true],
  ] as const)
    assert.equal(formatTexasTime(new Date(`2026-01-15T${time}:00Z`)).isDay, day)
  assert.equal(formatTexasTime(new Date("2026-01-16T00:00:00Z")).isDay, false)
  assert.match(
    formatTexasTime(new Date("2026-03-08T07:59:00Z")).label,
    /1:59 AM CST/,
  )
  assert.match(
    formatTexasTime(new Date("2026-03-08T08:00:00Z")).label,
    /3:00 AM CDT/,
  )
  assert.equal(nextMinuteDelay(120001), 59999)
  assert.equal(nextMinuteDelay(120000), 60000)
})

test("boot renders commands before initialization in both motion modes without exposing rotating text", () => {
  for (const reduced of [false, true]) {
    const render = (bootStep: number) =>
      renderToStaticMarkup(
        createElement(MonitorFallback, {
          text: "saved typing position",
          blink: false,
          power: { phase: "BOOTING", startedAt: 0, bootStep },
          clock: null,
          reduced,
        }),
      )
    const launching = render(bootMessages.length - 1)
    assert.match(launching, /run good-things.exe/)
    assert.match(launching, /mem \/check/)
    assert.doesNotMatch(launching, /initialized\./)
    assert.doesNotMatch(launching, /saved typing position|terminal-typed/)
    assert.match(render(bootMessages.length), /good-things.exe initialized\./)
  }
})

test("shutdown stages fit a short hardware decay with no residual emission", () => {
  assert.equal(powerTiming.off, 540)
  assert.equal(screenEffect("POWERING_OFF", 200, false).lineWidth, 1)
  const point = screenEffect("POWERING_OFF", 400, false)
  assert.equal(point.image, 0)
  assert.equal(point.line, 0)
  assert.ok(point.point > screenEffect("POWERING_OFF", 470, false).point)
  assert.equal(screenEffect("POWERING_OFF", powerTiming.off, false).emission, 0)
})
