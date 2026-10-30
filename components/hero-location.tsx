"use client"
import { useTexasClock } from "./crt/use-monitor"
export default function HeroLocation() {
  const clock = useTexasClock()
  return (
    <span className="hero-location">
      BASED IN DALLAS–FORT WORTH <span aria-hidden="true">·</span>{" "}
      <span className="hero-local-time" aria-live="off">
        {clock?.label.split(" · ")[1] || "--:-- -- CT"}
      </span>
    </span>
  )
}
