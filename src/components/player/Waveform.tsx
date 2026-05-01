"use client";

import { useEffect, useRef, useCallback } from "react";

type Props = {
  audioUrl: string;
  peaks?: number[] | null;
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  height?: number;
  variant?: "compact" | "full";
};

function seededPeaks(seed: string, count: number): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    h = (Math.imul(1664525, h) + 1013904223) | 0;
    out.push(((h >>> 0) / 0xffffffff) * 0.8 + 0.1);
  }
  return out;
}

function resample(src: number[], n: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const fi = (i / n) * src.length;
    const lo = Math.floor(fi);
    const hi = Math.min(lo + 1, src.length - 1);
    out.push(src[lo] + (src[hi] - src[lo]) * (fi - lo));
  }
  return out;
}

export function Waveform({
  audioUrl,
  peaks,
  currentTime,
  duration,
  onSeek,
  height = 32,
  variant = "compact",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const effectivePeaks = peaks ?? seededPeaks(audioUrl, 150);
  const progress = duration > 0 ? currentTime / duration : 0;

  const barW = variant === "full" ? 3 : 2;
  const gap = variant === "full" ? 2 : 1;
  const step = barW + gap;
  const filledColor = variant === "full" ? "#8B5CF6" : "rgba(255,255,255,0.78)";
  const unfilledColor =
    variant === "full" ? "rgba(139,92,246,0.28)" : "rgba(255,255,255,0.18)";

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.offsetWidth;
    if (!w) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, height);

    const totalBars = Math.max(1, Math.floor(w / step));
    const bars = resample(effectivePeaks, totalBars);
    const splitAt = Math.round(progress * totalBars);

    bars.forEach((p, i) => {
      const x = i * step;
      const bh = Math.max(2, p * height * 0.88);
      const y = (height - bh) / 2;

      ctx.fillStyle = i < splitAt ? filledColor : unfilledColor;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, barW, bh, 1);
      } else {
        ctx.rect(x, y, barW, bh);
      }
      ctx.fill();
    });
  }, [
    effectivePeaks,
    progress,
    height,
    step,
    barW,
    filledColor,
    unfilledColor,
  ]);

  useEffect(() => {
    paint();
  }, [paint]);

  // Repaint when container resizes
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => paint());
    ro.observe(el);
    return () => ro.disconnect();
  }, [paint]);

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * (duration || 1));
  }

  return (
    <div ref={wrapRef} className="w-full" style={{ height }}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="w-full cursor-pointer block"
        style={{ height }}
      />
    </div>
  );
}
