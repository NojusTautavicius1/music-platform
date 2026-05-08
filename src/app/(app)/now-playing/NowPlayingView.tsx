"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  MoreHorizontal,
  Heart,
  Share2,
  Check,
  Music2,
  Shuffle,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Repeat,
  Repeat1,
  Volume2,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Waveform } from "@/components/player/Waveform";
import { cn } from "@/lib/utils";
import { formatDuration, formatPlayCount } from "@/lib/format";
import { usePlayerStore } from "@/store/playerStore";
import { toggleLike } from "@/app/actions/like";
import { CoverGradient } from "@/components/playlist/CoverGradient";
import { LyricsPanel } from "@/components/lyrics/LyricsPanel";
import type { LyricsAnalysis } from "@/app/api/lyrics/[songId]/route";

export function NowPlayingView() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [lyricsAnalysis, setLyricsAnalysis] = useState<LyricsAnalysis | null>(null);
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read store after mount to avoid hydration mismatch
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // Reset like state and lyrics analysis when song changes
  const currentSongId = usePlayerStore((s) => s.currentSong?.id);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLiked(false);
    setLyricsAnalysis(null);
  }, [currentSongId]);

  const currentSong  = usePlayerStore((s) => s.currentSong);
  const isPlaying    = usePlayerStore((s) => s.isPlaying);
  const progress     = usePlayerStore((s) => s.progress);
  const duration     = usePlayerStore((s) => s.duration);
  const volume       = usePlayerStore((s) => s.volume);
  const shuffle      = usePlayerStore((s) => s.shuffleEnabled);
  const repeatMode   = usePlayerStore((s) => s.repeatMode);
  const showLyrics   = usePlayerStore((s) => s.showLyrics);

  const togglePlay    = usePlayerStore((s) => s.togglePlay);
  const next          = usePlayerStore((s) => s.next);
  const previous      = usePlayerStore((s) => s.previous);
  const seek          = usePlayerStore((s) => s.seek);
  const setVolume     = usePlayerStore((s) => s.setVolume);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat   = usePlayerStore((s) => s.cycleRepeat);
  const toggleLyrics  = usePlayerStore((s) => s.toggleLyrics);

  const currentTimeSecs = progress * (duration || 0);
  const displayDuration = duration || currentSong?.duration || 0;

  const ACTIVE = "text-brand-orange";

  async function handleLike() {
    if (!currentSong || isLiking) return;
    setIsLiking(true);
    setIsLiked((v) => !v);
    const result = await toggleLike(currentSong.id);
    if (result.ok) {
      setIsLiked(result.isLiked);
    } else {
      setIsLiked((v) => !v); // revert
    }
    setIsLiking(false);
  }

  function handleShare() {
    const url = window.location.origin + "/now-playing";
    navigator.clipboard.writeText(url).catch(() => {
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    });
    setShareCopied(true);
    if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
    shareTimerRef.current = setTimeout(() => setShareCopied(false), 2000);
  }

  // Don't render song-specific UI until client hydrates
  if (!mounted) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-primary">
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-brand-orange to-brand-magenta animate-pulse" />
      </div>
    );
  }

  if (!currentSong) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-bg-primary text-zinc-500">
        <Music2 size={64} />
        <p className="text-lg font-medium">Nothing is playing</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-brand-orange hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <CoverGradient coverUrl={currentSong.coverUrl ?? ""} className="relative h-full overflow-hidden bg-bg-primary flex flex-col">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, var(--cover-gradient) 0%, rgba(10,10,15,0.9) 70%)",
          filter: "saturate(1.4) blur(60px)",
          opacity: 0.55,
        }}
      />

      {/* ── Relative content ──────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Top bar */}
        <div className="flex items-center gap-4 px-4 sm:px-6 pt-4 sm:pt-6 pb-2 shrink-0">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Collapse"
          >
            <ChevronDown size={20} />
          </button>

          <div className="flex-1 text-center min-w-0">
            <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
              Now Playing
            </p>
            {currentSong.album && (
              <p className="text-sm text-zinc-300 truncate mt-0.5">
                {currentSong.album}
              </p>
            )}
          </div>

          <button
            className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Options"
          >
            <MoreHorizontal size={20} />
          </button>
        </div>

        {/* Main content row */}
        <div className="flex-1 flex items-center justify-center gap-8 px-4 sm:px-8 py-4 min-h-0 relative">
          {/* ── Center column ────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-6 w-full max-w-120 shrink-0">
            {/* Cover art */}
            <div className="relative w-full aspect-square max-h-105 rounded-xl overflow-hidden shadow-2xl">
              {currentSong.coverUrl ? (
                <Image
                  src={currentSong.coverUrl}
                  alt={currentSong.title}
                  fill
                  sizes="480px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-[#0A0A0F] border border-white/5 flex items-center justify-center">
                  <Music2 size={80} className="text-orange-500/30" />
                </div>
              )}
            </div>

            {/* Song info + actions */}
            <div className="flex items-start justify-between w-full gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl font-extrabold text-white leading-tight truncate">
                  {currentSong.title}
                </h1>
                <p className="text-lg text-zinc-300 mt-1 truncate">
                  {currentSong.artist}
                </p>
                {/* Audio feature badges */}
                {currentSong.analyzedAt ? (
                  <div className="flex items-center flex-wrap gap-1.5 mt-2">
                    {currentSong.bpm != null && (
                      <span className="px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-xs text-zinc-300 tabular-nums">
                        {Math.round(currentSong.bpm)} BPM
                      </span>
                    )}
                    {currentSong.key && (
                      <span className="px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-xs text-zinc-300">
                        {currentSong.key}
                      </span>
                    )}
                    {currentSong.mood && (
                      <span className="px-2 py-0.5 rounded-full bg-white/8 border border-white/10 text-xs text-zinc-300 capitalize">
                        {currentSong.mood}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-600 mt-2 italic">Analyzing…</p>
                )}
                {lyricsAnalysis && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-brand-orange/15 border border-brand-orange/30 text-xs text-brand-orange capitalize">
                      Lyrics: {lyricsAnalysis.mood}
                      {lyricsAnalysis.themes[0] ? ` · ${lyricsAnalysis.themes[0]}` : ""}
                    </span>
                  </div>
                )}
                <p className="text-xs text-zinc-500 mt-1.5">
                  {formatPlayCount(currentSong.playCount ?? 0)} plays
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 pt-1">
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className={cn(
                    "transition-colors",
                    isLiked ? "text-brand-orange" : "text-zinc-400 hover:text-brand-orange"
                  )}
                  aria-label={isLiked ? "Unlike" : "Like"}
                >
                  <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={handleShare}
                  className={cn(
                    "transition-colors",
                    shareCopied ? "text-green-400" : "text-zinc-400 hover:text-white"
                  )}
                  aria-label="Share"
                >
                  {shareCopied ? <Check size={20} /> : <Share2 size={20} />}
                </button>
                <button
                  onClick={toggleLyrics}
                  className={cn(
                    "transition-colors",
                    showLyrics ? ACTIVE : "text-zinc-400 hover:text-white"
                  )}
                  aria-label="Toggle lyrics"
                >
                  <Music2 size={20} />
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full space-y-1.5">
              <Waveform
                audioUrl={currentSong.audioUrl ?? currentSong.id}
                peaks={currentSong.waveformPeaks as number[] | null}
                currentTime={currentTimeSecs}
                duration={displayDuration}
                onSeek={(secs) => seek(secs / (displayDuration || 1))}
                height={64}
                variant="full"
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{formatDuration(currentTimeSecs)}</span>
                <span>{formatDuration(displayDuration)}</span>
              </div>
            </div>

            {/* Playback controls */}
            <div className="flex items-center gap-6">
              <button
                onClick={toggleShuffle}
                className={cn(
                  "transition-colors",
                  shuffle ? ACTIVE : "text-zinc-400 hover:text-white"
                )}
                aria-label="Shuffle"
              >
                <Shuffle size={20} />
              </button>

              <button
                onClick={previous}
                className="text-zinc-300 hover:text-white transition-colors"
                aria-label="Previous"
              >
                <SkipBack size={26} />
              </button>

              <button
                onClick={togglePlay}
                className="w-20 h-20 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform shadow-2xl"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause size={30} fill="#0A0A0F" className="text-[#0A0A0F]" />
                ) : (
                  <Play size={30} fill="#0A0A0F" className="text-[#0A0A0F] ml-1" />
                )}
              </button>

              <button
                onClick={next}
                className="text-zinc-300 hover:text-white transition-colors"
                aria-label="Next"
              >
                <SkipForward size={26} />
              </button>

              <button
                onClick={cycleRepeat}
                className={cn(
                  "transition-colors",
                  repeatMode !== "off" ? ACTIVE : "text-zinc-400 hover:text-white"
                )}
                aria-label="Repeat"
              >
                {repeatMode === "one" ? (
                  <Repeat1 size={20} />
                ) : (
                  <Repeat size={20} />
                )}
              </button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 w-full max-w-60">
              <Volume2 size={16} className="text-zinc-500 shrink-0" />
              <Slider
                value={[Math.round(volume * 100)]}
                min={0}
                max={100}
                aria-label="Volume"
                onValueChange={(v) => {
                  const pct = Array.isArray(v) ? v[0] : v;
                  setVolume(pct / 100);
                }}
                className="flex-1"
              />
            </div>
          </div>

          {/* ── Lyrics panel: side panel on md+, full overlay on mobile ── */}
          <AnimatePresence>
            {showLyrics && (
              <>
                {/* Mobile: full-screen overlay */}
                <motion.div
                  key="lyrics-mobile"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="md:hidden absolute inset-0 z-20 bg-[#0A0A0F]/95 backdrop-blur-md rounded-xl flex flex-col overflow-hidden"
                >
                  <div className="px-4 pt-4 pb-2 shrink-0 border-b border-white/10 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                      Lyrics
                    </p>
                    <button
                      onClick={toggleLyrics}
                      className="text-zinc-400 hover:text-white transition-colors p-1"
                      aria-label="Close lyrics"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </div>
                  <LyricsPanel
                    songId={currentSong.id}
                    currentTime={currentTimeSecs}
                    onAnalysis={setLyricsAnalysis}
                  />
                </motion.div>

                {/* Desktop: side panel */}
                <motion.div
                  key="lyrics-desktop"
                  initial={{ x: 60, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 60, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="hidden md:flex w-80 shrink-0 h-full max-h-130 rounded-xl bg-white/5 backdrop-blur-sm flex-col overflow-hidden"
                >
                  <div className="px-4 pt-4 pb-2 shrink-0 border-b border-white/10">
                    <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                      Lyrics
                    </p>
                  </div>
                  <LyricsPanel
                    songId={currentSong.id}
                    currentTime={currentTimeSecs}
                    onAnalysis={setLyricsAnalysis}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </CoverGradient>
  );
}
