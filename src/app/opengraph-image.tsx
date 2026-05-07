import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Houman Eskandani — Backend & Cloud Platform Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background:
            "radial-gradient(circle at 80% 20%, #8a5cff33 0%, transparent 50%), radial-gradient(circle at 20% 80%, #c8ff0033 0%, transparent 50%), #07070a",
          color: "#f5f3ee",
          fontFamily: "system-ui",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* HSK monogram, drawn the same way as the in-app logo */}
          <svg width="64" height="64" viewBox="0 0 40 40">
            <rect
              x="2.5"
              y="2.5"
              width="35"
              height="35"
              rx="6"
              fill="none"
              stroke="#f5f3ee"
              strokeOpacity="0.2"
              strokeWidth="1"
            />
            <g
              stroke="#f5f3ee"
              strokeWidth="1.6"
              strokeLinecap="round"
              fill="none"
            >
              <line x1="11" y1="9" x2="11" y2="31" />
              <line x1="22" y1="9" x2="22" y2="31" />
              <line x1="11" y1="20" x2="22" y2="20" />
              <path d="M27 11 C 14 11, 14 19, 27 19 C 14 19, 14 27, 27 27" />
              <line x1="22" y1="20" x2="32" y2="11" strokeOpacity="0.85" />
              <line x1="22" y1="20" x2="32" y2="29" strokeOpacity="0.85" />
            </g>
            <circle cx="32" cy="11" r="1.6" fill="#c8ff00" />
          </svg>
          <div
            style={{
              fontSize: 18,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#c8ff00",
            }}
          >
            HOUMANESKANDANI.COM
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 110,
            lineHeight: 1,
            letterSpacing: "-0.04em",
            fontWeight: 600,
          }}
        >
          <div>Houman</div>
          <div style={{ color: "#c8ff00" }}>Eskandani.</div>
          <div style={{ opacity: 0.7, fontSize: 44, marginTop: 30 }}>
            Backend & Cloud Platform Engineer
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 22,
            color: "#9b9ba3",
          }}
        >
          <div>
            Go · GraphQL · Postgres · Kubernetes · AI agents
          </div>
          <div>↗</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
