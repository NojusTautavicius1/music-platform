"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { LyricsPayload, LyricsAnalysis } from "@/app/api/lyrics/[songId]/route";
import type { LRCLine } from "@/app/actions/lyrics";

type Props = {
  songId: string | null;
  currentTime: number; // seconds
  onAnalysis?: (analysis: LyricsAnalysis | null) => void;
};

export function LyricsPanel({ songId, currentTime, onAnalysis }: Props) {
  const [payload, setPayload] = useState<LyricsPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const lastSongIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!songId || songId === lastSongIdRef.current) return;
    lastSongIdRef.current = songId;
    setLoading(true);
    setPayload(null);

    fetch(`/api/lyrics/${songId}`)
      .then((r) => r.json())
      .then((data: LyricsPayload) => {
        setPayload(data);
        if (onAnalysis) {
          onAnalysis(data.status !== "none" ? data.analysis : null);
        }
      })
      .catch(() => {
        setPayload({ status: "none" });
        onAnalysis?.(null);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songId]);

  const activeIndex = useCallback(() => {
    if (payload?.status !== "synced") return -1;
    const lines = payload.lines as LRCLine[];
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].time <= currentTime) idx = i;
      else break;
    }
    return idx;
  }, [payload, currentTime]);

  const active = activeIndex();

  // Auto-scroll active line to vertical center
  useEffect(() => {
    if (active < 0) return;
    const container = containerRef.current;
    const line = activeLineRef.current;
    if (!container || !line) return;

    const lineTop = line.offsetTop;
    const lineHeight = line.offsetHeight;
    const target = lineTop - container.clientHeight / 2 + lineHeight / 2;
    container.scrollTo({ top: target, behavior: "smooth" });
  }, [active]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
      </div>
    );
  }

  if (!payload || payload.status === "none") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-zinc-500">No lyrics available for this song.</p>
      </div>
    );
  }

  if (payload.status === "plain") {
    return (
      <div className="flex-1 overflow-y-auto px-2 py-4 scrollbar-hide">
        <pre className="whitespace-pre-wrap text-sm text-zinc-300 leading-7 font-sans">
          {payload.text}
        </pre>
      </div>
    );
  }

  // Synced
  const lines = payload.lines as LRCLine[];

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-2 py-8 scrollbar-hide"
      style={{ scrollBehavior: "smooth" }}
    >
      <div className="space-y-1 pb-40 pt-40">
        {lines.map((line, i) => {
          const isActive = i === active;
          const isNear = Math.abs(i - active) <= 2;

          return (
            <div
              key={i}
              ref={isActive ? activeLineRef : undefined}
              className={cn(
                "text-center transition-all duration-300 leading-snug select-none px-2 py-1 rounded-lg",
                isActive
                  ? "text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-brand-orange to-brand-magenta scale-105"
                  : isNear
                  ? "text-base text-zinc-200 opacity-70"
                  : "text-sm text-zinc-500 opacity-40"
              )}
              style={
                isActive
                  ? {
                      backgroundImage:
                        "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }
                  : undefined
              }
            >
              {line.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
