import { ImageResponse } from "next/og";

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
          background: "#09090B",
          position: "relative",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* subtle orange glow top-left */}
        <div
          style={{
            position: "absolute",
            top: -120,
            left: -120,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,85,0,0.18) 0%, transparent 70%)",
          }}
        />
        {/* subtle magenta glow bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: -80,
            right: -80,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)",
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
              background: "linear-gradient(135deg, #FF5500 0%, #EC4899 100%)",
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
            background: "linear-gradient(90deg, #FF5500 0%, #FF8C00 50%, #EC4899 100%)",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent",
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
              color: "rgba(161,161,170,0.8)",
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

        {/* bottom divider line */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            width: 120,
            height: 3,
            borderRadius: 2,
            background: "linear-gradient(90deg, #FF5500, #EC4899)",
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
