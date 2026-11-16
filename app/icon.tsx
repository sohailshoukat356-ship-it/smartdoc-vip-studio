import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
          borderRadius: "18px",
          color: "white",
          fontFamily: "sans-serif",
          fontWeight: 900,
          fontSize: 28,
          letterSpacing: "-1px",
        }}
      >
        {/* Apne brand ke initials yahan likhein (e.g. QD for QuickDoc, SD for SmartDoc) */}
        SD
      </div>
    ),
    { ...size }
  );
}