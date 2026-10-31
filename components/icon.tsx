export type IconName =
  | "arrow"
  | "external"
  | "down"
  | "up"
  | "play"
  | "pause"
  | "sound"
  | "mute"
  | "sun"
  | "moon"
  | "plus"
  | "close"
  | "dots"
  | "compass"
  | "pen"
  | "code"
  | "rocket"
  | "conversation"
  | "puzzle"
  | "layers"
  | "shield"
  | "power"
const paths: Record<IconName, string> = {
  arrow: "M4 12h16m-6-6 6 6-6 6",
  external: "M6 18 18 6M6 6h12v12",
  down: "M12 4v16m-6-6 6 6 6-6",
  up: "M12 20V4m-6 6 6-6 6 6",
  play: "M7 4v16l13-8Z",
  pause: "M8 4v16M16 4v16",
  sound: "M3 9h4l5-5v16l-5-5H3ZM16 8q4 4 0 8m3-11q7 7 0 14",
  mute: "M3 9h4l5-5v16l-5-5H3Zm13 0 5 6m0-6-5 6",
  sun: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  moon: "M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z",
  plus: "M12 4v16M4 12h16",
  close: "M5 5l14 14M19 5 5 19",
  dots: "M4 11h1v1H4zM11 11h1v1h-1zM18 11h1v1h-1z",
  compass:
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM16 8l-2.5 5.5L8 16l2.5-5.5L16 8Z",
  pen: "M13 5 19 11M4 20l1.5-6.5L16 3a2.1 2.1 0 0 1 3 0l2 2a2.1 2.1 0 0 1 0 3L10.5 18.5 4 20ZM5.5 13.5l5 5M14 21h7",
  code: "m7 7-5 5 5 5m10-10 5 5-5 5M14 4l-4 16",
  rocket:
    "M14 4c3-1 6-1 6-1s0 3-1 6c-1 3-4 6-7 8l-5-5c2-3 4-6 7-8ZM14 4H8l-4 6 4 1m11-2v7l-6 4-1-4M5 15c-2 1-2 5-2 5s4 0 5-2M17 7h.01",
  conversation:
    "M20 11a7 7 0 0 1-7 7H8l-5 3v-6a7 7 0 0 1 4-12h6a7 7 0 0 1 7 8ZM7 8h9M7 12h6",
  puzzle:
    "M4 4h6V3a2 2 0 0 1 4 0v1h6v6h1a2 2 0 0 1 0 4h-1v6h-6v-1a2 2 0 0 0-4 0v1H4v-6h1a2 2 0 0 0 0-4H4V4Z",
  layers: "m12 3 10 5-10 5L2 8l10-5ZM2 12l10 5 10-5M2 16l10 5 10-5",
  shield: "M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7l-9-4Zm-4 9 3 3 5-6",
  power: "M12 2v10M6 5a9 9 0 1 0 12 0",
}
export default function Icon({
  name = "external",
  className = "",
}: {
  name?: IconName
  className?: string
}) {
  return (
    <svg
      className={`ob-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  )
}
