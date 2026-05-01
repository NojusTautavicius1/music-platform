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

// Seeded deterministic peaks from a string (song ID)
function seededPeaks(seed: string, count = 100): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  const peaks: number[] = [];
  for (let i = 0; i < count; i++) {
    h = (Math.imul(1664525, h) + 1013904223) | 0;
    const val = ((h >>> 0) / 0xffffffff) * 0.8 + 0.1;
    peaks.push(val);
  }
  return peaks;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<import("wavesurfer.js").default | null>(null);
  const seekingRef = useRef(false);
  const lastTimeRef = useRef(-1);

  const effectivePeaks = peaks ?? seededPeaks(audioUrl, variant === "full" ? 200 : 100);

  const initWavesurfer = useCallback(async () => {
    if (!containerRef.current || wsRef.current) return;

    const WaveSurfer = (await import("wavesurfer.js")).default;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      height,
      waveColor: variant === "full" ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.2)",
      progressColor: variant === "full" ? "#8B5CF6" : "rgba(255,255,255,0.7)",
      cursorColor: "transparent",
      barWidth: variant === "full" ? 3 : 2,
      barGap: variant === "full" ? 2 : 1,
      barRadius: 2,
      normalize: true,
      interact: true,
      backend: "WebAudio",
    });

    // Load with peaks only — no audio fetch
    ws.load(audioUrl, [effectivePeaks], duration || 1);

    ws.on("interaction", (newTime: number) => {
      seekingRef.current = true;
      onSeek(newTime);
      // Release after a short debounce
      setTimeout(() => { seekingRef.current = false; }, 300);
    });

    wsRef.current = ws;
  }, [audioUrl, duration, effectivePeaks, height, onSeek, variant]);

  // Init on mount
  useEffect(() => {
    initWavesurfer();
    return () => {
      wsRef.current?.destroy();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync playhead when currentTime changes (driven by Howler via playerStore)
  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || seekingRef.current) return;
    if (Math.abs(currentTime - lastTimeRef.current) < 0.25) return;
    lastTimeRef.current = currentTime;
    try {
      ws.setTime(currentTime);
    } catch {
      // ws not ready yet
    }
  }, [currentTime]);

  // Re-init when song changes
  useEffect(() => {
    wsRef.current?.destroy();
    wsRef.current = null;
    lastTimeRef.current = -1;
    initWavesurfer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  return (
    <div
      ref={containerRef}
      className="w-full cursor-pointer"
      style={{ height }}
    />
  );
}
