"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Laptop2,
  Volume2,
  Maximize2,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/format";
import { usePlayerStore } from "@/store/playerStore";

export function PlayerBar() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);
  const shuffleEnabled = usePlayerStore((s) => s.shuffleEnabled);
  const repeatMode = usePlayerStore((s) => s.repeatMode);

  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const next = usePlayerStore((s) => s.next);
  const previous = usePlayerStore((s) => s.previous);
  const seek = usePlayerStore((s) => s.seek);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const toggleShuffle = usePlayerStore((s) => s.toggleShuffle);
  const cycleRepeat = usePlayerStore((s) => s.cycleRepeat);

  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);

  const currentTimeSecs = progress * (duration || 0);
  const displayDuration = duration || (currentSong?.duration ?? 0);

  const ACTIVE = "text-[#8B5CF6]";

  return (
    <footer className="h-[90px] shrink-0 bg-[#18181F] border-t border-white/5 flex items-center px-6 gap-4">
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

      {/* Right — queue / volume / expand */}
      <div className="flex items-center gap-3 w-[30%] justify-end">
        <button
          className="text-zinc-500 hover:text-zinc-200 transition-colors"
          aria-label="Queue"
        >
          <ListMusic size={16} />
        </button>
        <button
          className="text-zinc-500 hover:text-zinc-200 transition-colors"
          aria-label="Devices"
        >
          <Laptop2 size={16} />
        </button>
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-zinc-500 shrink-0" />
          <Slider
            value={[Math.round(volume * 100)]}
            max={100}
            onValueChange={(v) => {
              const pct = Array.isArray(v) ? v[0] : v;
              setVolume(pct / 100);
            }}
            className="w-24"
          />
        </div>
        <button
          onClick={() => router.push("/now-playing")}
          className="text-zinc-500 hover:text-zinc-200 transition-colors"
          aria-label="Fullscreen"
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </footer>
  );
}
