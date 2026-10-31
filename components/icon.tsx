type IconName =
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
  | "power"
const paths: Record<IconName, string> = {
  arrow: "M3 12h17m-6-6 6 6-6 6M3 9v6",
  external: "M5 19 19 5M8 5h11v11M5 16v3h3",
  down: "M12 3v17m-6-6 6 6 6-6M9 3h6",
  up: "M12 21V4m-6 6 6-6 6 6M9 21h6",
  play: "M7 4v16l13-8Z",
  pause: "M8 4v16M16 4v16",
  sound: "M3 9h4l5-5v16l-5-5H3ZM16 8q4 4 0 8m3-11q7 7 0 14",
  mute: "M3 9h4l5-5v16l-5-5H3Zm13 0 5 6m0-6-5 6",
  sun: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  moon: "M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z",
  plus: "M12 4v16M4 12h16",
  close: "M5 5l14 14M19 5 5 19",
  dots: "M4 11h1v1H4zM11 11h1v1h-1zM18 11h1v1h-1z",
  power: "M12 2v10M6 5a9 9 0 1 0 12 0",
}
export default function Icon({ name = "external" }: { name?: IconName }) {
  return (
    <svg
      className="ob-icon"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="square"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  )
}
