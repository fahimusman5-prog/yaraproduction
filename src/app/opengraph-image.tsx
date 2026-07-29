import { ImageResponse } from "next/og";

export const alt = "YARA Luxury Skincare";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background:
            "radial-gradient(circle at top right, #f4cbd9 0, transparent 34%), linear-gradient(135deg, #fffaf7, #f9e7ec)",
          color: "#35272d",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "center",
          padding: "72px",
          textAlign: "center",
          width: "100%",
        }}
      >
        <div
          style={{
            color: "#7f2346",
            display: "flex",
            fontFamily: "Georgia, serif",
            fontSize: 104,
            fontWeight: 700,
            letterSpacing: "0.18em",
          }}
        >
          YARA
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: "0.12em",
            marginTop: 28,
            textTransform: "uppercase",
          }}
        >
          Luxury skincare with care
        </div>
        <div
          style={{
            color: "#8c6775",
            display: "flex",
            fontSize: 24,
            marginTop: 24,
          }}
        >
          Sri Lanka · UAE
        </div>
      </div>
    ),
    size,
  );
}
