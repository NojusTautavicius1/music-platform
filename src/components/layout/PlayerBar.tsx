"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import {
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
  Repeat1,
  Heart,
  ListMusic,
  MonitorSpeaker,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Laptop,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/format";
import { usePlayerStore } from "@/store/playerStore";

const VOLUME_KEY = "player.volume";

// ─── Volume Controls ──────────────────────────────────────────────────────────

function VolumeControl() {
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleMute = usePlayerStore((s) => s.toggleMute);
  const [hovered, setHovered] = useState(false);

  // Persist volume to localStorage whenever it changes
  useEffect(() => {
    if (!isMuted) {
      localStorage.setItem(VOLUME_KEY, String(volume));
    }
  }, [volume, isMuted]);

  const displayVolume = isMuted ? 0 : volume;

  return (
    <div
      className="flex items-center gap-2"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={toggleMute}
        className="text-zinc-500 hover:text-zinc-200 transition-colors shrink-0"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted || volume === 0 ? (
          <VolumeX size={16} />
        ) : (
          <Volume2 size={16} />
        )}
      </button>

      <div
        className={cn(
          "transition-all duration-200 overflow-hidden",
          hovered ? "w-24 opacity-100" : "w-0 opacity-0"
        )}
      >
        <Slider
          value={[Math.round(displayVolume * 100)]}
          max={100}
          onValueChange={(v) => {
            const pct = Array.isArray(v) ? v[0] : v;
            setVolume(pct / 100);
          }}
          className="w-24"
        />
      </div>
    </div>
  );
}

// ─── Devices Popover ──────────────────────────────────────────────────────────

function DevicesPopover() {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            className="text-zinc-500 hover:text-zinc-200 transition-colors"
            aria-label="Devices"
          >
            <MonitorSpeaker size={16} />
          </button>
        }
      />
      <PopoverContent className="w-72 p-4" sideOffset={12}>
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
          Connect to a device
        </p>

        {/* This computer — always selected */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 mb-2">
          <Laptop size={18} className="text-[#8B5CF6] shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-100">This computer</p>
            <p className="text-xs text-[#8B5CF6]">Current device</p>
          </div>
        </div>

        <p className="text-xs text-zinc-600 px-3 py-2">
          No other devices found
        </p>
      </PopoverContent>
    </Popover>
  );
}

// ─── PlayerBar ────────────────────────────────────────────────────────────────

export function PlayerBar() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const shuffleEnabled = usePlayerStore((s) => s.shuffleEnabled);
  const repeatMode = usePlayerStore((s) => s.repeatMode);
  const showQueue = usePlayerStore((s) => s.showQueue);

  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const seek = usePlayerStore((s) => s.seek);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);
  const toggleQueue = usePlayerStore((s) => s.toggleQueue);

  const router = useRouter();
  const pathname = usePathname();
  const [isLiked, setIsLiked] = useState(false);
  const initialized = useRef(false);

  // Restore volume from localStorage on first mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const saved = localStorage.getItem(VOLUME_KEY);
    if (saved !== null) {
      const v = parseFloat(saved);
      if (!isNaN(v)) {
        usePlayerStore.setState({ volume: v, lastVolume: v });
      }
    }
  }, []);

  const currentTimeSecs = progress * (duration || 0);
  const displayDuration = duration || (currentSong?.duration ?? 0);
  const onNowPlaying = pathname === "/now-playing";

  const ACTIVE = "text-[#8B5CF6]";
  const QUEUE_ACTIVE = "text-transparent bg-linear-to-r from-[#8B5CF6] to-[#EC4899] bg-clip-text";

  return (
    <footer className="shrink-0 bg-[#18181F] border-t border-white/5">
      {/* ── Mobile mini player (< md) ──────────────────────────────── */}
      <div
        className="md:hidden flex items-center gap-3 px-4 h-16 cursor-pointer"
        onClick={() => router.push("/now-playing")}
        role="button"
        aria-label="Open now playing"
      >
        <div className="relative w-10 h-10 rounded shrink-0 overflow-hidden">
          {currentSong?.coverUrl ? (
            <Image
              src={currentSong.coverUrl}
              alt={currentSong.title}
              fill
              sizes="40px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-[#8B5CF6]/40 to-[#EC4899]/40" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-100 truncate">
            {currentSong?.title ?? "No song playing"}
          </p>
          <p className="text-xs text-zinc-500 truncate">
            {currentSong?.artist ?? "—"}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="w-9 h-9 rounded-full bg-linear-to-br from-[#8B5CF6] to-[#EC4899] flex items-center justify-center shrink-0 shadow-lg"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause size={16} fill="white" className="text-white" />
          ) : (
            <Play size={16} fill="white" className="text-white ml-0.5" />
          )}
        </button>
      </div>

      {/* ── Desktop full player (md+) ──────────────────────────────── */}
      <div className="hidden md:flex h-22.5 items-center px-6 gap-4">
        {/* Left — song info */}
        <div className="flex items-center gap-3 w-[30%] min-w-0">
          <div className="relative w-14 h-14 rounded shrink-0 overflow-hidden">
            {currentSong?.coverUrl ? (
              <Image
                src={currentSong.coverUrl}
                alt={currentSong.title}
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-[#8B5CF6]/40 to-[#EC4899]/40" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-100 truncate">
              {currentSong?.title ?? "No song playing"}
            </p>
            <p className="text-xs text-zinc-500 truncate">
              {currentSong?.artist ?? "—"}
            </p>
          </div>
          <button
            onClick={() => setIsLiked((v) => !v)}
            className="ml-2 shrink-0"
            aria-label="Like"
          >
            <Heart
              size={16}
              className={cn(
                "transition-colors",
                isLiked
                  ? "fill-[#EC4899] text-[#EC4899]"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            />
          </button>
        </div>

        {/* Center — controls + progress */}
        <div className="flex-1 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleShuffle}
              className={cn(
                "transition-colors",
                shuffleEnabled ? ACTIVE : "text-zinc-500 hover:text-zinc-200"
              )}
              aria-label="Shuffle"
            >
              <Shuffle size={16} />
            </button>

            <button
              onClick={previous}
              className="text-zinc-400 hover:text-white transition-colors"
              aria-label="Previous"
            >
              <SkipBack size={20} />
            </button>

            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-linear-to-br from-[#8B5CF6] to-[#EC4899] flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause size={18} fill="white" className="text-white" />
              ) : (
                <Play size={18} fill="white" className="text-white ml-0.5" />
              )}
            </button>

            <button
              onClick={next}
              className="text-zinc-400 hover:text-white transition-colors"
              aria-label="Next"
            >
              <SkipForward size={20} />
            </button>

            <button
              onClick={cycleRepeat}
              className={cn(
                "transition-colors",
                repeatMode !== "off" ? ACTIVE : "text-zinc-500 hover:text-zinc-200"
              )}
              aria-label="Repeat"
            >
              {repeatMode === "one" ? (
                <Repeat1 size={16} />
              ) : (
                <Repeat size={16} />
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full max-w-120">
            <span className="text-xs text-zinc-500 w-8 text-right shrink-0">
              {formatDuration(currentTimeSecs)}
            </span>
            <Slider
              value={[currentTimeSecs]}
              max={displayDuration || 1}
              onValueChange={(v) => {
                const secs = Array.isArray(v) ? v[0] : v;
                seek(secs / (displayDuration || 1));
              }}
              className="flex-1"
            />
            <span className="text-xs text-zinc-500 w-8 shrink-0">
              {formatDuration(displayDuration)}
            </span>
          </div>
        </div>

        {/* Right — queue / devices / volume / expand */}
        <div className="flex items-center gap-3 w-[30%] justify-end">
          {/* Queue */}
          <button
            onClick={toggleQueue}
            className={cn(
              "transition-colors",
              showQueue ? QUEUE_ACTIVE : "text-zinc-500 hover:text-zinc-200"
            )}
            aria-label="Queue"
            aria-pressed={showQueue}
          >
            <ListMusic size={16} />
          </button>

          {/* Devices */}
          <DevicesPopover />

          {/* Volume */}
          <VolumeControl />

          {/* Fullscreen / minimize */}
          <button
            onClick={() => {
              if (onNowPlaying) {
                router.back();
              } else {
                router.push("/now-playing");
              }
            }}
            className="text-zinc-500 hover:text-zinc-200 transition-colors"
            aria-label={onNowPlaying ? "Exit fullscreen" : "Fullscreen"}
          >
            {onNowPlaying ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
    </footer>
  );
}
