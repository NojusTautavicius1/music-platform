"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Shuffle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Repeat,
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

const PLACEHOLDER_DURATION = 217;

export function PlayerBar() {
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const toggle = usePlayerStore((s) => s.toggle);

  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(70);

  const duration = currentSong?.duration ?? PLACEHOLDER_DURATION;

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
            onClick={() => setIsShuffle((v) => !v)}
            className={cn(
              "transition-colors",
              isShuffle ? "text-[#8B5CF6]" : "text-zinc-500 hover:text-zinc-200"
            )}
            aria-label="Shuffle"
          >
            <Shuffle size={16} />
          </button>

          <button
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="Previous"
          >
            <SkipBack size={20} />
          </button>

          <button
            onClick={toggle}
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
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="Next"
          >
            <SkipForward size={20} />
          </button>

          <button
            onClick={() => setIsRepeat((v) => !v)}
            className={cn(
              "transition-colors",
              isRepeat ? "text-[#8B5CF6]" : "text-zinc-500 hover:text-zinc-200"
            )}
            aria-label="Repeat"
          >
            <Repeat size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 w-full max-w-120">
          <span className="text-xs text-zinc-500 w-8 text-right shrink-0">
            {formatDuration(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            max={duration}
            onValueChange={(v) => setCurrentTime(Array.isArray(v) ? v[0] : v)}
            className="flex-1"
          />
          <span className="text-xs text-zinc-500 w-8 shrink-0">
            {formatDuration(duration)}
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
            value={[volume]}
            max={100}
            onValueChange={(v) => setVolume(Array.isArray(v) ? v[0] : v)}
            className="w-24"
          />
        </div>
        <button
          className="text-zinc-500 hover:text-zinc-200 transition-colors"
          aria-label="Fullscreen"
        >
          <Maximize2 size={16} />
        </button>
      </div>
    </footer>
  );
}
