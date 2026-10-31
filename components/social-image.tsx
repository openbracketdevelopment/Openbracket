import { ImageResponse } from "next/og"
export function socialImage(title: string, label: string) {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        background: "#111210",
        color: "#f7f5ef",
        padding: 64,
        borderLeft: "18px solid #dc3030",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 25,
        }}
      >
        <span style={{ color: "#ef7773" }}>[ OPENBRACKET ]</span>
        <span>{label}</span>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 74,
          letterSpacing: -3,
          lineHeight: 1.08,
          maxWidth: 1000,
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 23,
          color: "#bfc0b5",
          borderTop: "1px solid #505348",
          paddingTop: 22,
        }}
      >
        DALLAS–FORT WORTH / OPENBRACKET.IO
      </div>
    </div>,
    { width: 1200, height: 630 },
  )
}
