import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          alignItems: "center",
          background: "#f7f1e8",
          border: "8px solid #2f241f",
          borderRadius: "42px",
          color: "#2f241f",
          display: "flex",
          flexDirection: "column",
          fontFamily: "Georgia, serif",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", fontSize: 92, lineHeight: 1 }}>D</div>
        <div
          style={{
            background: "#a85f45",
            borderRadius: "999px",
            display: "flex",
            height: 12,
            marginTop: 10,
            width: 42,
          }}
        />
      </div>
    ),
    size,
  );
}
