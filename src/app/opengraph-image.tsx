import { ImageResponse } from "next/og";

export const alt = "Dear, Today - a quiet public gratitude journal";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f7f1e8",
          color: "#2f241f",
          display: "flex",
          fontFamily: "Georgia, serif",
          padding: 72,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            border: "2px solid #ded4c8",
            borderRadius: 36,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 56,
          }}
        >
          <div
            style={{
              color: "#6f7f66",
              display: "flex",
              fontFamily: "Arial, sans-serif",
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 0,
            }}
          >
            Public gratitude journal
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 126,
                lineHeight: 0.95,
              }}
            >
              Dear, Today
            </div>
            <div
              style={{
                color: "#755f52",
                display: "flex",
                fontFamily: "Arial, sans-serif",
                fontSize: 38,
                lineHeight: 1.35,
                marginTop: 30,
              }}
            >
              A quiet place to leave a grateful note.
            </div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div
              style={{
                background: "#2f241f",
                borderRadius: 999,
                display: "flex",
                height: 18,
                width: 64,
              }}
            />
            <div
              style={{
                background: "#a85f45",
                borderRadius: 999,
                display: "flex",
                height: 18,
                width: 18,
              }}
            />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
