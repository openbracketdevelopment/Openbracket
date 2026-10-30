import { terminalPhrases } from "../../lib/typewriter"

export default function MonitorFallback({
  text,
  blink,
}: {
  text: string
  blink: boolean
}) {
  return (
    <svg
      className="crt-fallback"
      viewBox="0 0 900 760"
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
          <stop stopColor="#111a17" />
          <stop offset="1" stopColor="#060a0b" />
        </radialGradient>
        <linearGradient id="crt-reflection">
          <stop stopColor="#d5deee" stopOpacity=".12" />
          <stop offset="1" stopColor="#d5deee" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="crt-contact">
          <stop stopOpacity=".24" />
          <stop offset="1" stopOpacity="0" />
        </radialGradient>
        <clipPath id="crt-glass-clip">
          <path d="M205 175Q380 137 580 164L578 511Q390 540 205 500Q183 335 205 175Z" />
        </clipPath>
      </defs>
      <ellipse cx="466" cy="666" rx="335" ry="40" fill="url(#crt-contact)" />
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
        d="M159 611L611 643L664 622L627 677L188 645Z"
        fill="var(--monitor-front)"
      />
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
          d="M215 183L401 164Q371 208 380 348L207 341Z"
          fill="url(#crt-reflection)"
        />
        <g
          transform="matrix(.87,-.02,0,1,213,202)"
          fill="#a8dca5"
          fontFamily="Courier New, monospace"
        >
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
          <text className="terminal-typed" y="158" fontSize="12">
            {text}
            <tspan className="terminal-caret" data-blink={blink}>
              ▋
            </tspan>
          </text>
          <text className="terminal-static" y="158" fontSize="12">
            {terminalPhrases[0]}
            <tspan>▋</tspan>
          </text>
          <text y="214" fontSize="8" fill="#799b7b">
            YOUR NEXT CHAPTER STARTS HERE.
          </text>
          <path d="M0 245H394" stroke="#58765c" strokeWidth=".6" />
          <text y="264" fontSize="7" fill="#799b7b">
            OPEN TO POSSIBILITIES
          </text>
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
      <path
        d="M529 594L563 597L563 627L529 624Z"
        fill="var(--monitor-front)"
        stroke="var(--monitor-seam)"
      />
      <path d="M505 569L515 570L515 575L505 574Z" fill="#39b71c" />
    </svg>
  )
}
