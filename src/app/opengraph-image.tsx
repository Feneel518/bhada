import { ImageResponse } from "next/og";

export const alt =
  "Bhada rent management software for independent landlords in India";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#111111",
          color: "#EDEDE8",
          padding: "68px 76px",
          border: "2px solid #2d2d2b",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 62,
              height: 62,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #EDEDE8",
              color: "#E4C77A",
              fontSize: 34,
            }}
          >
            भ
          </div>
          <div style={{ fontSize: 38, letterSpacing: -1 }}>Bhada</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              color: "#E4C77A",
              fontSize: 22,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            For independent landlords
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: 960,
              fontSize: 68,
              lineHeight: 1.08,
            }}
          >
            Rent management,
            <br />
            without the runaround.
          </div>
          <div style={{ color: "#aaa9a4", fontSize: 25 }}>
            Rent · GST &amp; TDS bills · Electricity · Payments · PDF bills
          </div>
        </div>
      </div>
    ),
    size,
  );
}
