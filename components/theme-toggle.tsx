"use client"
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
    return () => {
      system.removeEventListener("change", followSystem)
      window.removeEventListener("storage", stored)
    }
  }, [])
  function toggle() {
    const root = document.documentElement
    const next = root.dataset.theme === "dark" ? "light" : "dark"
    root.dataset.theme = next
    root.dataset.themePreference = next
    setDark(next === "dark")
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
        <svg
          className="theme-sun"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 1v3m0 16v3M1 12h3m16 0h3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
        </svg>
        <svg
          className="theme-moon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <path d="M20 15.2A8.5 8.5 0 0 1 8.8 4 8.5 8.5 0 1 0 20 15.2Z" />
        </svg>
        <span className="theme-thumb" />
      </span>
    </button>
  )
}
