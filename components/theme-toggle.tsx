"use client"
import Icon from "./icon"
import { useEffect, useState } from "react"
import { themeStorageKey } from "../lib/theme"
export default function ThemeToggle() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const root = document.documentElement
    const system = window.matchMedia("(prefers-color-scheme: dark)")
    const sync = () => setDark(root.dataset.theme === "dark")
    const followSystem = () => {
      if (root.dataset.themePreference === "system")
        root.dataset.theme = system.matches ? "dark" : "light"
      sync()
    }
    const stored = (event: StorageEvent) => {
      if (event.key !== themeStorageKey && event.key !== null) return
      const value = event.newValue
      root.dataset.themePreference =
        value === "light" || value === "dark" ? value : "system"
      root.dataset.theme =
        value === "light" || value === "dark"
          ? value
          : system.matches
            ? "dark"
            : "light"
      sync()
    }
    followSystem()
    system.addEventListener("change", followSystem)
    window.addEventListener("storage", stored)
    window.addEventListener("openbracket-theme-change", sync)
    return () => {
      system.removeEventListener("change", followSystem)
      window.removeEventListener("storage", stored)
      window.removeEventListener("openbracket-theme-change", sync)
    }
  }, [])
  function toggle() {
    const root = document.documentElement
    const next = root.dataset.theme === "dark" ? "light" : "dark"
    root.dataset.theme = next
    root.dataset.themePreference = next
    setDark(next === "dark")
    window.dispatchEvent(new window.Event("openbracket-theme-change"))
    try {
      window.localStorage.setItem(themeStorageKey, next)
    } catch {
      /* Keep the selection for this page when storage is blocked. */
    }
  }
  return (
    <button
      className="theme-toggle"
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark theme"
      onClick={toggle}
    >
      <span className="theme-track" aria-hidden="true">
        <Icon name="sun" className="theme-sun" />
        <Icon name="moon" className="theme-moon" />
        <span className="theme-thumb" />
      </span>
    </button>
  )
}
