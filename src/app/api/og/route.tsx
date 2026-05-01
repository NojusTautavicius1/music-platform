import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "Sonara";
  const subtitle = searchParams.get("subtitle") ?? "Your music, beautifully organized";

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
          background: "linear-gradient(135deg, #0d0820 0%, #0a0a1a 50%, #1a0a2e 100%)",
          position: "relative",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* purple-pink gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(236,72,153,0.15) 100%)",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginBottom: "40px",
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "14px",
              background: "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "white", fontSize: 26, fontWeight: 900 }}>S</span>
          </div>
          <span
            style={{
              color: "white",
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "-0.5px",
            }}
          >
            Sonara
          </span>
        </div>

        {/* Title */}
        <p
          style={{
            color: "white",
            fontSize: title.length > 30 ? 48 : 60,
            fontWeight: 800,
            textAlign: "center",
            maxWidth: "960px",
            margin: 0,
            lineHeight: 1.1,
            letterSpacing: "-1px",
            zIndex: 1,
          }}
        >
          {title}
        </p>

        {/* Subtitle */}
        {subtitle && (
          <p
            style={{
              color: "rgba(161,161,170,0.9)",
              fontSize: 28,
              marginTop: 20,
              textAlign: "center",
              maxWidth: "720px",
              zIndex: 1,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
