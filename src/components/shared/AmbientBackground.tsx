"use client";

export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ backgroundColor: "#0A0A0A" }}
    >
      {/* Layer 2: grid */}
      <div className="absolute inset-0 bg-grid-pattern" />

      {/* Layer 3: diagonal lines */}
      <div
        className="ambient-line absolute"
        style={{
          top: "10%",
          left: "-10%",
          width: "120%",
          height: "1px",
          background: "rgba(255,85,0,0.15)",
          transform: "rotate(-15deg)",
          animation: "drift-line-1 45s ease-in-out infinite alternate",
          willChange: "transform",
        }}
      />
      <div
        className="ambient-line absolute"
        style={{
          top: "45%",
          left: "-5%",
          width: "110%",
          height: "1px",
          background: "rgba(255,85,0,0.12)",
          transform: "rotate(-25deg)",
          animation: "drift-line-2 60s ease-in-out infinite alternate",
          willChange: "transform",
        }}
      />
      <div
        className="ambient-line absolute"
        style={{
          top: "75%",
          left: "-8%",
          width: "115%",
          height: "1px",
          background: "rgba(255,85,0,0.10)",
          transform: "rotate(-8deg)",
          animation: "drift-line-3 38s ease-in-out infinite alternate",
          willChange: "transform",
        }}
      />

      {/* Layer 4: blurred orbs */}
      <div
        className="ambient-orb absolute rounded-full"
        style={{
          width: 480,
          height: 480,
          top: "-10%",
          left: "-8%",
          background: "rgba(255,85,0,0.17)",
          filter: "blur(120px)",
          animation: "float-1 28s ease-in-out infinite alternate",
          willChange: "transform",
          opacity: 0.18,
        }}
      />
      <div
        className="ambient-orb absolute rounded-full"
        style={{
          width: 360,
          height: 360,
          bottom: "5%",
          right: "-5%",
          background: "rgba(255,85,0,0.15)",
          filter: "blur(100px)",
          animation: "float-2 34s ease-in-out infinite alternate",
          willChange: "transform",
          opacity: 0.16,
        }}
      />
      <div
        className="ambient-orb absolute rounded-full"
        style={{
          width: 300,
          height: 300,
          top: "40%",
          left: "55%",
          background: "rgba(255,85,0,0.13)",
          filter: "blur(90px)",
          animation: "float-3 22s ease-in-out infinite alternate",
          willChange: "transform",
          opacity: 0.15,
        }}
      />
      <div
        className="ambient-orb absolute rounded-full"
        style={{
          width: 420,
          height: 420,
          bottom: "20%",
          left: "15%",
          background: "rgba(255,85,0,0.12)",
          filter: "blur(110px)",
          animation: "float-4 40s ease-in-out infinite alternate",
          willChange: "transform",
          opacity: 0.15,
        }}
      />
    </div>
  );
}
