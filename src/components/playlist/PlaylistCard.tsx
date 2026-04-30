"use client";

import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayerStore, type PlayerSong } from "@/store/playerStore";

type Props = {
  id: string;
  title: string;
  subtitle: string;
  coverUrl?: string | null;
  size?: "sm" | "md" | "lg";
  /** When true, the card fills its container width (for grids). When false (default), uses fixed pixel width for horizontal scroll. */
  fluid?: boolean;
  href?: string;
  songs?: PlayerSong[];
};

const SIZE_PX = { sm: 160, md: 180, lg: 240 } as const;

export function PlaylistCard({
  id,
  title,
  subtitle,
  coverUrl,
  size = "md",
  fluid = false,
  href,
  songs,
}: Props) {
  const play = usePlayerStore((s) => s.play);
  const px = SIZE_PX[size];
  const dest = href ?? `/library/playlist/${id}`;

  function handlePlayClick(e: React.MouseEvent) {
    if (songs?.length) {
      e.preventDefault();
      e.stopPropagation();
      play(songs[0], songs);
    }
  }

  return (
    <Link
      href={dest}
      className="group block rounded-xl p-3 hover:bg-white/5 transition-all duration-200 hover:-translate-y-0.5"
      style={fluid ? undefined : { width: px }}
    >
      {/* Cover */}
      <div
        className={cn(
          "relative rounded-md overflow-hidden shrink-0",
          fluid && "aspect-square w-full"
        )}
        style={fluid ? undefined : { width: px - 24, height: px - 24 }}
      >
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={title}
            fill
            sizes={fluid ? "50vw" : `${px}px`}
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-[#8B5CF6]/40 to-[#EC4899]/40" />
        )}

        {/* Play button */}
        <button
          onClick={handlePlayClick}
          aria-label={`Play ${title}`}
          className={cn(
            "absolute bottom-2 right-2 w-10 h-10 rounded-full",
            "bg-linear-to-br from-[#8B5CF6] to-[#EC4899]",
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
        <p className="font-semibold text-zinc-100 line-clamp-1 text-sm leading-snug">
          {title}
        </p>
        <p className="text-zinc-400 text-sm line-clamp-2 mt-0.5 leading-snug">
          {subtitle}
        </p>
      </div>
    </Link>
  );
}
