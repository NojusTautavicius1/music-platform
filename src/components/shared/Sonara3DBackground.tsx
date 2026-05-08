"use client";

/**
 * Sonara3DBackground
 * --------------------------------------------------------------
 * Lightweight, dependency-free animated 3D background for the
 * "Ask Sonara" page. Uses Canvas 2D with a manual 3D->2D
 * projection — no three.js / webgl required.
 *
 * - 46 colored orbs floating in a 3D box, slow orbital drift.
 * - Subtle parallax on pointer move; auto-orbits when idle.
 * - Honors prefers-reduced-motion.
 * - Pointer-events: none, so it never blocks the UI.
 * - Drop-in: render <Sonara3DBackground /> as the FIRST child
 *   of the page wrapper. It absolutely positions itself.
 */

import { useEffect, useRef } from "react";

type Orb = {
  x0: number; y0: number; z0: number;
  ax: number; ay: number; az: number;
  phx: number; phy: number; phz: number;
  sx: number; sy: number; sz: number;
  radius: number;
  color: { r: number; g: number; b: number };
  alpha: number;
  pulseSpeed: number;
  pulsePh: number;
};

const PALETTE = [
  { r: 251, g: 146, b: 60 },   // orange-400
  { r: 244, g: 114, b: 182 },  // pink-400
  { r: 192, g: 132, b: 252 },  // purple-400
  { r: 236, g: 72, b: 153 },   // pink-500
  { r: 168, g: 85, b: 247 },   // purple-500
];

export default function Sonara3DBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    const N = 46;
    const orbs: Orb[] = [];
    for (let i = 0; i < N; i++) {
      const palette = PALETTE[(Math.random() * PALETTE.length) | 0];
      orbs.push({
        x0: rand(-1.6, 1.6),
        y0: rand(-1.0, 1.0),
        z0: rand(0.6, 3.8),
        ax: rand(0.04, 0.18),
        ay: rand(0.03, 0.14),
        az: rand(0.05, 0.22),
        phx: rand(0, Math.PI * 2),
        phy: rand(0, Math.PI * 2),
        phz: rand(0, Math.PI * 2),
        sx: rand(0.05, 0.15),
        sy: rand(0.04, 0.12),
        sz: rand(0.03, 0.10),
        radius: rand(0.018, 0.06),
        color: palette,
        alpha: rand(0.55, 0.95),
        pulseSpeed: rand(0.4, 1.1),
        pulsePh: rand(0, Math.PI * 2),
      });
    }

    let mx = 0, my = 0;
    let cmx = 0, cmy = 0;
    let lastMove = performance.now();
    const onMove = (e: PointerEvent) => {
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
      lastMove = performance.now();
    };
    window.addEventListener("pointermove", onMove);

    const FOV = 1.4;
    const project = (x: number, y: number, z: number) => {
      const tiltX = cmx * 0.18;
      const tiltY = cmy * 0.12;
      const cosY = Math.cos(tiltX), sinY = Math.sin(tiltX);
      const cosP = Math.cos(tiltY), sinP = Math.sin(tiltY);
      const X = x * cosY + z * sinY;
      let Z = -x * sinY + z * cosY;
      const Y = y * cosP - Z * sinP;
      Z = y * sinP + Z * cosP;
      if (Z < 0.05) Z = 0.05;
      const k = FOV / Z;
      const scale = Math.min(W, H) * 0.55;
      return {
        x: W * 0.5 + X * k * scale,
        y: H * 0.5 + Y * k * scale,
        r: scale * k,
        depth: Z,
      };
    };

    const t0 = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const t = (now - t0) / 1000;

      const idle = now - lastMove > 2500;
      if (idle) {
        const a = now / 8000;
        mx = Math.cos(a) * 0.55;
        my = Math.sin(a * 0.7) * 0.35;
      }
      cmx += (mx - cmx) * 0.04;
      cmy += (my - cmy) * 0.04;

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      type Drawn = { x: number; y: number; screenR: number; depthFade: number; color: Orb["color"]; alpha: number; depth: number };
      const drawList: Drawn[] = [];

      for (let i = 0; i < orbs.length; i++) {
        const o = orbs[i];
        const tt = reduceMotion ? 0 : t;
        const x = o.x0 + Math.sin(tt * o.sx + o.phx) * o.ax;
        const y = o.y0 + Math.cos(tt * o.sy + o.phy) * o.ay;
        const z = o.z0 + Math.sin(tt * o.sz + o.phz) * o.az;
        const p = project(x, y, z);
        if (p.x < -200 || p.x > W + 200 || p.y < -200 || p.y > H + 200) continue;
        const pulse = 0.85 + 0.15 * Math.sin(tt * o.pulseSpeed + o.pulsePh);
        const screenR = Math.max(2, o.radius * p.r * pulse);
        const depthFade = Math.max(0, Math.min(1, 1 - (p.depth - 0.6) / 3.2));
        drawList.push({ x: p.x, y: p.y, screenR, depthFade, color: o.color, alpha: o.alpha, depth: p.depth });
      }
      drawList.sort((a, b) => b.depth - a.depth);

      for (const d of drawList) {
        const a = d.alpha * (0.35 + 0.65 * d.depthFade);

        const glowR = d.screenR * 6;
        const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, glowR);
        g.addColorStop(0, `rgba(${d.color.r},${d.color.g},${d.color.b},${0.55 * a})`);
        g.addColorStop(0.25, `rgba(${d.color.r},${d.color.g},${d.color.b},${0.18 * a})`);
        g.addColorStop(1, `rgba(${d.color.r},${d.color.g},${d.color.b},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(d.x, d.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        const cg = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.screenR);
        cg.addColorStop(0, `rgba(255,255,255,${0.9 * a})`);
        cg.addColorStop(0.4, `rgba(${d.color.r},${d.color.g},${d.color.b},${0.85 * a})`);
        cg.addColorStop(1, `rgba(${d.color.r},${d.color.g},${d.color.b},0)`);
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.screenR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 30%, rgba(251,146,60,0.06) 0%, rgba(244,114,182,0.04) 30%, rgba(192,132,252,0.03) 55%, transparent 75%), radial-gradient(80% 60% at 50% 110%, rgba(192,132,252,0.05), transparent 60%)",
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* faint perspective grid hint */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.18,
          backgroundImage:
            "linear-gradient(rgba(244,114,182,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(251,146,60,0.06) 1px, transparent 1px)",
          backgroundSize: "80px 80px, 80px 80px",
          transform: "perspective(900px) rotateX(58deg) translateY(28%) scale(1.4)",
          transformOrigin: "50% 50%",
          WebkitMaskImage:
            "radial-gradient(70% 80% at 50% 30%, #000 30%, transparent 80%)",
          maskImage:
            "radial-gradient(70% 80% at 50% 30%, #000 30%, transparent 80%)",
        }}
      />
      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(10,10,11,0.55) 90%, rgba(10,10,11,0.85) 100%)",
        }}
      />
    </div>
  );
}
