"use client";

import Link from "next/link";
import Image from "next/image";
import { Play, Pause, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPlayCount } from "@/lib/format";
import { usePlayerStore, type PlayerSong } from "@/store/playerStore";

type Props = {
  id: string;
  title: string;
  subtitle: string;
  coverUrl?: string | null;
  size?: "sm" | "md" | "lg";
  fluid?: boolean;
  /** Navigate to this URL when the card is clicked. If omitted, defaults to /library/playlist/{id} */
  href?: string;
  /** Pass the full queue of songs. If provided without href, clicking plays song[0] instead of navigating. */
  songs?: PlayerSong[];
  /** Single song to play on card click — card becomes a button, no navigation. */
  song?: PlayerSong;
  playCount?: number;
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
  song,
  playCount,
}: Props) {
  const play = usePlayerStore((s) => s.play);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const toggle = usePlayerStore((s) => s.toggle);
  const px = SIZE_PX[size];

  const isActive = song ? currentSong?.id === song.id : false;

  function handleCardPlay() {
    if (!song) return;
    if (isActive) { toggle(); return; }
    play(song, songs ?? [song]);
  }

  function handlePlayBtnClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (song) {
      handleCardPlay();
    } else if (songs?.length) {
      play(songs[0], songs);
    }
  }

  const coverEl = (
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
        <div className="w-full h-full bg-[#0A0A0F] flex items-center justify-center border border-white/5">
          <Music2 size={32} className="text-orange-500/40" />
        </div>
      )}

      {/* When card is a <button> (song prop), render overlay as <div> to avoid nested buttons */}
      {song ? (
        <div
          className={cn(
            "absolute top-2 right-2 w-10 h-10 rounded-full",
            "bg-linear-to-br from-brand-orange to-brand-magenta",
            "hover:shadow-[0_0_24px_rgba(255,85,0,0.5)]",
            "flex items-center justify-center shadow-xl",
            "transition-all duration-200 pointer-events-none",
            isActive
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
          )}
          aria-hidden="true"
        >
          {isActive && isPlaying
            ? <Pause size={16} fill="white" className="text-white" />
            : <Play size={16} fill="white" className="text-white ml-0.5" />}
        </div>
      ) : (
        <button
          onClick={handlePlayBtnClick}
          aria-label={`Play ${title}`}
          className={cn(
            "absolute top-2 right-2 w-10 h-10 rounded-full",
            "bg-linear-to-br from-brand-orange to-brand-magenta",
            "hover:shadow-[0_0_24px_rgba(255,85,0,0.5)]",
            "flex items-center justify-center shadow-xl",
            "transition-all duration-200",
            isActive
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
          )}
        >
          {isActive && isPlaying
            ? <Pause size={16} fill="white" className="text-white" />
            : <Play size={16} fill="white" className="text-white ml-0.5" />}
        </button>
      )}

      {typeof playCount === "number" && playCount > 0 && (
        <div className="absolute bottom-2 right-2 rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-semibold text-white/90 backdrop-blur-sm opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
          ▶ {formatPlayCount(playCount)}
        </div>
      )}
    </div>
  );

  const textEl = (
    <div className="mt-3">
      <p className={cn("font-semibold line-clamp-1 text-sm leading-snug", isActive ? "text-brand-orange" : "text-zinc-100")}>
        {title}
      </p>
      <p className="text-zinc-400 text-sm line-clamp-2 mt-0.5 leading-snug">{subtitle}</p>
    </div>
  );

  const sharedCls = cn(
    "group block rounded-xl p-2 sm:p-3 hover:bg-orange-500/5 transition-all duration-200 hover:-translate-y-0.5 text-left",
    fluid ? "w-full min-w-0" : undefined
  );

  if (song) {
    return (
      <button
        onClick={handleCardPlay}
        className={sharedCls}
        style={fluid ? undefined : { width: px }}
        aria-label={`Play ${title}`}
      >
        {coverEl}
        {textEl}
      </button>
    );
  }

  const dest = href ?? `/library/playlist/${id}`;
  return (
    <Link
      href={dest}
      className={sharedCls}
      style={fluid ? undefined : { width: px }}
    >
      {coverEl}
      {textEl}
    </Link>
  );
}
