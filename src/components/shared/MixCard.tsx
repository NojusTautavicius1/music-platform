"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayerStore, type PlayerSong } from "@/store/playerStore";

type Props = {
  kind: string;
  name: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
  songs?: PlayerSong[];
};

function MixArtwork({ kind }: { kind: string }) {
  if (kind === "daily-mix-1" || kind === "daily-mix-2") {
    // Vinyl record rings
    return (
      <svg viewBox="0 0 192 192" className="absolute inset-0 w-full h-full opacity-20">
        <circle cx="96" cy="96" r="88" fill="none" stroke="white" strokeWidth="2" />
        <circle cx="96" cy="96" r="72" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="96" cy="96" r="56" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="96" cy="96" r="40" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="96" cy="96" r="24" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="96" cy="96" r="10" fill="white" opacity="0.6" />
        <circle cx="96" cy="96" r="4" fill="white" />
        {/* Highlight arc */}
        <path d="M 40 96 A 56 56 0 0 1 152 96" fill="none" stroke="white" strokeWidth="3" opacity="0.15" />
      </svg>
    );
  }

  if (kind === "discover-weekly") {
    // Radar / sonar rings with dots
    return (
      <svg viewBox="0 0 192 192" className="absolute inset-0 w-full h-full opacity-20">
        <circle cx="96" cy="96" r="80" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="4 6" />
        <circle cx="96" cy="96" r="56" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="4 6" />
        <circle cx="96" cy="96" r="32" fill="none" stroke="white" strokeWidth="1.5" strokeDasharray="4 6" />
        {/* Crosshairs */}
        <line x1="96" y1="12" x2="96" y2="180" stroke="white" strokeWidth="1" opacity="0.5" />
        <line x1="12" y1="96" x2="180" y2="96" stroke="white" strokeWidth="1" opacity="0.5" />
        {/* Sweep line */}
        <line x1="96" y1="96" x2="170" y2="38" stroke="white" strokeWidth="2" opacity="0.7" />
        {/* Dots */}
        <circle cx="140" cy="60" r="5" fill="white" opacity="0.9" />
        <circle cx="60" cy="130" r="3.5" fill="white" opacity="0.7" />
        <circle cx="155" cy="115" r="3" fill="white" opacity="0.5" />
        <circle cx="96" cy="96" r="5" fill="white" />
      </svg>
    );
  }

  if (kind === "on-repeat") {
    // Sound bars
    const bars = [16, 28, 44, 36, 52, 64, 48, 38, 56, 44, 30, 20];
    const barW = 10;
    const gap = 4;
    const total = bars.length * (barW + gap) - gap;
    const startX = (192 - total) / 2;
    return (
      <svg viewBox="0 0 192 192" className="absolute inset-0 w-full h-full opacity-20">
        {bars.map((h, i) => (
          <rect
            key={i}
            x={startX + i * (barW + gap)}
            y={96 - h / 2}
            width={barW}
            height={h}
            rx="5"
            fill="white"
            opacity={0.5 + (i % 3) * 0.15}
          />
        ))}
        {/* Repeat arrows */}
        <path
          d="M 56 148 Q 96 160 136 148"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <polygon points="148,142 136,155 130,143" fill="white" opacity="0.6" />
        <polygon points="44,142 56,155 62,143" fill="white" opacity="0.6" />
      </svg>
    );
  }

  return null;
}

export function MixCard({ kind, name, description, gradientFrom, gradientTo, songs }: Props) {
  const play = usePlayerStore((s) => s.play);

  function handlePlayClick(e: React.MouseEvent) {
    if (songs?.length) {
      e.preventDefault();
      e.stopPropagation();
      play(songs[0], songs);
    }
  }

  return (
    <Link
      href={`/mixes/${kind}`}
      className="group block rounded-xl p-2 sm:p-3 hover:bg-orange-500/5 transition-all duration-200 hover:-translate-y-0.5 shrink-0 w-[40vw] sm:w-54"
    >
      {/* Gradient cover */}
      <div className="relative rounded-md overflow-hidden aspect-square w-full">
        <div
          className="w-full h-full"
          style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
        />
        <MixArtwork kind={kind} />

        {/* Play button */}
        <button
          onClick={handlePlayClick}
          aria-label={`Play ${name}`}
          className={cn(
            "absolute bottom-2 right-2 w-10 h-10 rounded-full",
            "bg-linear-to-br from-brand-orange to-brand-magenta",
            "hover:shadow-[0_0_24px_rgba(255,85,0,0.5)]",
            "flex items-center justify-center shadow-xl",
            "opacity-0 translate-y-2",
            "group-hover:opacity-100 group-hover:translate-y-0",
            "transition-all duration-200"
          )}
        >
          <Play size={16} fill="white" className="text-white ml-0.5" />
        </button>
      </div>

      {/* Text */}
      <div className="mt-3">
        <p className="font-semibold text-zinc-100 line-clamp-1 text-sm leading-snug">{name}</p>
        <p className="text-zinc-400 text-sm line-clamp-2 mt-0.5 leading-snug">{description}</p>
      </div>
    </Link>
  );
}
