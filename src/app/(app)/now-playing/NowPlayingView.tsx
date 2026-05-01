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
import { formatDuration } from "@/lib/format";
import { usePlayerStore } from "@/store/playerStore";
import { toggleLike } from "@/app/actions/like";
import { CoverGradient } from "@/components/playlist/CoverGradient";

export function NowPlayingView() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Read store after mount to avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  // Reset like state when song changes
  const currentSongId = usePlayerStore((s) => s.currentSong?.id);
  useEffect(() => { setIsLiked(false); }, [currentSongId]);

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

  const ACTIVE = "text-[#8B5CF6]";

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
      <div className="h-full flex items-center justify-center bg-[#0A0A0F]">
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#8B5CF6] to-[#EC4899] animate-pulse" />
      </div>
    );
  }

  if (!currentSong) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 bg-[#0A0A0F] text-zinc-500">
        <Music2 size={64} />
        <p className="text-lg font-medium">Nothing is playing</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-[#8B5CF6] hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <CoverGradient coverUrl={currentSong.coverUrl ?? ""} className="relative h-full overflow-hidden bg-[#0A0A0F] flex flex-col">
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
        <div className="flex items-center gap-4 px-6 pt-6 pb-2 shrink-0">
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
        <div className="flex-1 flex items-center justify-center gap-8 px-8 py-4 min-h-0">
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
                <div className="w-full h-full bg-linear-to-br from-[#8B5CF6]/40 to-[#EC4899]/40 flex items-center justify-center">
                  <Music2 size={80} className="text-white/30" />
                </div>
              )}
            </div>

            {/* Song info + actions */}
            <div className="flex items-start justify-between w-full gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl font-bold text-white leading-tight truncate">
                  {currentSong.title}
                </h1>
                <p className="text-lg text-zinc-300 mt-1 truncate">
                  {currentSong.artist}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 pt-1">
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className={cn(
                    "transition-colors",
                    isLiked ? "text-[#EC4899]" : "text-zinc-400 hover:text-[#EC4899]"
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
                max={100}
                onValueChange={(v) => {
                  const pct = Array.isArray(v) ? v[0] : v;
                  setVolume(pct / 100);
                }}
                className="flex-1"
              />
            </div>
          </div>

          {/* ── Lyrics panel (animated) ──────────────────────────── */}
          <AnimatePresence>
            {showLyrics && (
              <motion.div
                key="lyrics"
                initial={{ x: 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 60, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-80 shrink-0 h-full max-h-130 rounded-xl bg-white/5 backdrop-blur-sm flex flex-col items-center justify-center gap-4 p-8"
              >
                <Music2 size={48} className="text-zinc-600" />
                <div className="text-center">
                  <p className="text-base font-semibold text-zinc-300">
                    Lyrics coming soon
                  </p>
                  <p className="text-sm text-zinc-600 mt-1">
                    We&apos;re working on it.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </CoverGradient>
  );
}
