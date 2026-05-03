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
      className="group block rounded-xl p-3 hover:bg-orange-500/5 transition-all duration-200 hover:-translate-y-0.5 shrink-0"
      style={{ width: 216 }}
    >
      {/* Gradient cover */}
      <div
        className="relative rounded-md overflow-hidden"
        style={{ width: 192, height: 192 }}
      >
        <div
          className="w-full h-full"
          style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
        />

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
