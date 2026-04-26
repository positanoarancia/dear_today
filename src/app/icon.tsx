import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          alignItems: "center",
          background: "#f7f1e8",
          border: "3px solid #2f241f",
          borderRadius: "18px",
          color: "#2f241f",
          display: "flex",
          fontFamily: "Georgia, serif",
          fontSize: 42,
          justifyContent: "center",
          lineHeight: 1,
        }}
      >
        D
      </div>
    ),
    size,
  );
}
