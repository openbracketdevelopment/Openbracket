import Icon from "../icon"
import { bootMessages, type PowerState } from "../../lib/crt-power"
import type { TexasClock } from "../../lib/texas-clock"
import { terminalPhrases } from "../../lib/typewriter"

export default function MonitorFallback({
  text,
  blink,
  power,
  clock,
  reduced,
}: {
  text: string
  blink: boolean
  power: PowerState
  clock: TexasClock | null
  reduced: boolean
}) {
  const split = text.lastIndexOf(" ", 27)
  const lines =
    text.length > 27 && split > 0
      ? [text.slice(0, split + 1), text.slice(split + 1)]
      : [text]
  return (
    <svg
      className="crt-fallback"
      viewBox="0 0 900 820"
      role="presentation"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="crt-shell" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="var(--monitor-front-light)" />
          <stop offset="1" stopColor="var(--monitor-front)" />
        </linearGradient>
        <linearGradient id="crt-side" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="var(--monitor-side-light)" />
          <stop offset="1" stopColor="var(--monitor-side)" />
        </linearGradient>
        <linearGradient id="crt-recess" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#191817" />
          <stop offset="1" stopColor="#5a4c44" />
        </linearGradient>
        <radialGradient id="crt-glass">
          <stop stopColor="#060a0b" />
          <stop offset="1" stopColor="#060a0b" />
        </radialGradient>
        <radialGradient id="crt-reflection">
          <stop stopColor="#d5deee" stopOpacity=".12" />
          <stop offset="1" stopColor="#d5deee" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="crt-contact">
          <stop stopOpacity=".24" />
          <stop offset="1" stopOpacity="0" />
        </radialGradient>
        <clipPath id="crt-glass-clip">
          <path d="M205 175Q380 137 580 164L578 511Q390 540 205 500Q183 335 205 175Z" />
        </clipPath>
      </defs>
      <ellipse cx="426" cy="756" rx="198" ry="30" fill="url(#crt-contact)" />
      <path
        d="M270 738C270 704 578 699 584 734L582 753C567 779 286 783 269 755Z"
        fill="url(#crt-shell)"
        stroke="var(--monitor-seam)"
      />
      <ellipse cx="426" cy="735" rx="158" ry="30" fill="url(#crt-shell)" />
      <path
        d="M389 735Q364 724 383 707L395 641L447 645L465 704Q485 726 460 736Z"
        fill="url(#crt-side)"
      />
      <ellipse cx="423" cy="645" rx="53" ry="17" fill="var(--monitor-front)" />
      <path
        d="M596 99L667 116L668 184L788 240L784 556L665 638L595 658Z"
        fill="url(#crt-side)"
        stroke="var(--monitor-seam)"
        strokeWidth="1"
      />
      <path
        d="M142 123L596 99L667 116L217 145Z"
        fill="var(--monitor-front-light)"
      />
      <path
        d="M619 109L620 641"
        stroke="var(--monitor-seam)"
        strokeWidth="2"
        opacity=".5"
      />
      <g stroke="#1a211c" strokeWidth="4" opacity=".8">
        {Array.from({ length: 17 }, (_, i) => (
          <path key={i} d={`M718 ${375 + i * 7}L782 ${360 + i * 7}`} />
        ))}
      </g>

      <path
        d="M142 123L596 99L595 658L150 614Z"
        fill="url(#crt-shell)"
        stroke="var(--monitor-edge)"
        strokeWidth="2"
      />
      <path d="M151 141L587 120L586 599L159 568Z" fill="#403734" />
      <path d="M166 161L575 142L573 568L172 544Z" fill="url(#crt-recess)" />
      <path
        d="M205 175Q380 137 580 164L578 511Q390 540 205 500Q183 335 205 175Z"
        fill="url(#crt-glass)"
        stroke="#171d18"
        strokeWidth="3"
      />
      <g clipPath="url(#crt-glass-clip)">
        <path
          d="M205 175Q380 137 580 164L578 511Q390 540 205 500Q183 335 205 175Z"
          fill="url(#crt-reflection)"
        />
        <g
          transform="matrix(.87,-.02,0,1,213,202)"
          fill="#a8dca5"
          fontFamily="Courier New, monospace"
        >
          <g
            className="fallback-powered-content"
            data-phase={power.phase}
            data-reduced={reduced}
          >
            {power.phase === "BOOTING" || power.phase === "POWERING_ON" ? (
              <g>
                {bootMessages
                  .slice(0, power.phase === "POWERING_ON" ? 1 : power.bootStep)
                  .map((message, index) => (
                    <text key={index} y={index * 23} fontSize="11">
                      {message}
                    </text>
                  ))}
              </g>
            ) : (
              <g>
                <text fontSize="9">OPENBRACKET / HUMAN INTERFACE</text>
                <path d="M0 13H394" stroke="#58765c" strokeWidth=".6" />
                <text y="40" fontSize="10" fill="#799b7b">
                  OB/DOS v.01
                </text>
                <text y="60" fontSize="10" fill="#799b7b">
                  connection: human ↔ human
                </text>
                <text y="101" fontSize="12">
                  &gt; run good-things.exe
                </text>
                <text className="terminal-typed" y="145" fontSize="24">
                  {lines.map((line, index) => (
                    <tspan key={index} x="0" dy={index ? 32 : 0}>
                      {line}
                    </tspan>
                  ))}
                  <tspan className="terminal-caret" data-blink={blink}>
                    ▋
                  </tspan>
                </text>
                <text className="terminal-static" y="145" fontSize="24">
                  {terminalPhrases[0]}
                  <tspan>▋</tspan>
                </text>
                <text y="214" fontSize="8" fill="#799b7b">
                  YOUR NEXT CHAPTER STARTS HERE.
                </text>
              </g>
            )}
            <path d="M0 245H394" stroke="#58765c" strokeWidth=".6" />
            {clock && (
              <svg x="0" y="253" width="12" height="12" viewBox="0 0 20 20">
                <Icon name={clock.isDay ? "sun" : "moon"} />
              </svg>
            )}
            <text x="17" y="264" fontSize="10" fill="#91ba8c">
              {clock?.label || "DFW, TX · --:-- -- CT"}
            </text>
          </g>
          <path
            className="fallback-shutdown-line"
            data-phase={power.phase}
            d="M10 132H380"
            stroke="#dfefdf"
            strokeWidth="1.5"
          />
          <circle
            className="fallback-shutdown-point"
            data-phase={power.phase}
            cx="195"
            cy="132"
            r="3"
            fill="#edf9e9"
          />
        </g>
      </g>
      <g transform="matrix(.8,.07,0,.8,177,580)">
        <image href="/brand/openbracket-icon.svg" width="26" height="24" />
        <text
          x="34"
          y="17"
          fontFamily="Courier New, monospace"
          fontSize="15"
          fontWeight="bold"
          fill="var(--monitor-label)"
        >
          openbracket
        </text>
      </g>
      <g className="fallback-button-face">
        <path
          d="M529 594L563 597L563 627L529 624Z"
          fill="var(--monitor-front)"
          stroke="var(--monitor-seam)"
        />
        <g
          transform="translate(546 611)"
          fill="none"
          stroke="var(--monitor-label)"
          strokeWidth="1.6"
          strokeLinecap="round"
        >
          <path d="M-4-7a8 8 0 1 0 8 0M0-11V0" />
        </g>
      </g>
      <path
        d="M505 569L515 570L515 575L505 574Z"
        fill={power.phase === "OFF" ? "#b52b24" : "#39b71c"}
      />
    </svg>
  )
}
