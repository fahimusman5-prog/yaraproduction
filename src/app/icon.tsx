import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        aria-label="YARA"
        style={{
          alignItems: "center",
          background: "linear-gradient(145deg, #fffaf7, #f9dce6)",
          color: "#7f2346",
          display: "flex",
          fontFamily: "Georgia, serif",
          fontSize: 152,
          fontWeight: 700,
          height: "100%",
          justifyContent: "center",
          letterSpacing: "0.04em",
          width: "100%",
        }}
      >
        Y
      </div>
    ),
    size,
  );
}
