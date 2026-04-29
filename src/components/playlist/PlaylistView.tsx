"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import {
  Play,
  Heart,
  MoreHorizontal,
  Clock,
  Search,
  Pause,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/format";
import { usePlayerStore, type PlayerSong } from "@/store/playerStore";

export type SongInPlaylist = {
  songId: string;
  position: number;
  addedAt: string;
  title: string;
  artist: string;
  album: string | null;
  duration: number;
  coverUrl: string | null;
  audioUrl: string | null;
};

type Props = {
  playlistId: string;
  songs: SongInPlaylist[];
};

export function PlaylistView({ playlistId: _playlistId, songs }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());

  const play = usePlayerStore((s) => s.play);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const toggle = usePlayerStore((s) => s.toggle);

  const queue: PlayerSong[] = songs.map((s) => ({
    id: s.songId,
    title: s.title,
    artist: s.artist,
    album: s.album,
    duration: s.duration,
    coverUrl: s.coverUrl,
    audioUrl: s.audioUrl,
  }));

  const filtered = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.album ?? "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  function handlePlaySong(song: SongInPlaylist) {
    const playerSong: PlayerSong = {
      id: song.songId,
      title: song.title,
      artist: song.artist,
      album: song.album,
      duration: song.duration,
      coverUrl: song.coverUrl,
      audioUrl: song.audioUrl,
    };
    if (currentSong?.id === song.songId) {
      toggle();
    } else {
      play(playerSong, queue);
    }
  }

  function toggleLike(songId: string, e: React.MouseEvent) {
    e.stopPropagation();
    setLikedSongs((prev) => {
      const next = new Set(prev);
      next.has(songId) ? next.delete(songId) : next.add(songId);
      return next;
    });
  }

  const isCurrentlyPlaying = (songId: string) =>
    currentSong?.id === songId && isPlaying;

  return (
    <>
      {/* ── Action bar ─────────────────────────────────────────────── */}
      <div className="px-8 py-6 flex items-center gap-4">
        {/* Play */}
        <button
          onClick={() => {
            if (songs.length === 0) return;
            if (currentSong && queue.some((q) => q.id === currentSong.id)) {
              toggle();
            } else {
              handlePlaySong(songs[0]);
            }
          }}
          className="h-14 w-14 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#EC4899] flex items-center justify-center hover:scale-105 transition-transform shadow-lg shrink-0"
          aria-label="Play playlist"
        >
          {currentSong &&
          queue.some((q) => q.id === currentSong.id) &&
          isPlaying ? (
            <Pause size={22} fill="white" className="text-white" />
          ) : (
            <Play size={22} fill="white" className="text-white ml-0.5" />
          )}
        </button>

        {/* Heart (playlist-level) */}
        <button
          onClick={() => setIsLiked((v) => !v)}
          aria-label="Like playlist"
          className="w-8 h-8 flex items-center justify-center"
        >
          <Heart
            size={22}
            className={cn(
              "transition-colors",
              isLiked
                ? "fill-[#EC4899] text-[#EC4899]"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          />
        </button>

        {/* Three-dot */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="More options"
              >
                <MoreHorizontal size={20} />
              </button>
            }
          />
          <DropdownMenuContent side="bottom" align="start" className="w-48 bg-[#18181F] border-white/10 text-zinc-100">
            <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white">
              Edit details
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white">
              Add to queue
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white">
              Share
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search in playlist */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in playlist"
            className="pl-8 h-8 max-w-[200px] bg-white/5 border-white/10 text-zinc-100 placeholder:text-zinc-500 text-sm rounded-full focus-visible:ring-[#8B5CF6]/50"
          />
        </div>
      </div>

      {/* ── Song table ─────────────────────────────────────────────── */}
      <div className="px-8 pb-8">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-[#0A0A0F] grid grid-cols-[2.5rem_1fr_180px_140px_5rem] items-center px-4 py-2 border-b border-white/10 mb-1">
          <span className="text-xs text-zinc-500 text-center">#</span>
          <span className="text-xs text-zinc-500 uppercase tracking-wider">
            Title
          </span>
          <span className="text-xs text-zinc-500 uppercase tracking-wider hidden md:block">
            Album
          </span>
          <span className="text-xs text-zinc-500 uppercase tracking-wider hidden md:block">
            Date Added
          </span>
          <span className="flex justify-end text-zinc-500">
            <Clock size={14} />
          </span>
        </div>

        {/* Rows */}
        {filtered.length === 0 && (
          <p className="text-zinc-500 text-sm px-4 py-8 text-center">
            No songs match your search.
          </p>
        )}
        {filtered.map((song, idx) => {
          const active = isCurrentlyPlaying(song.songId);
          const liked = likedSongs.has(song.songId);

          return (
            <div
              key={song.songId}
              onClick={() => handlePlaySong(song)}
              className={cn(
                "grid grid-cols-[2.5rem_1fr_180px_140px_5rem] items-center h-14 px-4 rounded-lg cursor-pointer group",
                "hover:bg-white/5 transition-colors",
                active && "bg-white/5"
              )}
            >
              {/* # / play icon */}
              <div className="flex items-center justify-center">
                {active ? (
                  <Pause
                    size={14}
                    fill="#8B5CF6"
                    className="text-[#8B5CF6]"
                  />
                ) : (
                  <>
                    <span className="text-sm text-zinc-400 group-hover:hidden">
                      {idx + 1}
                    </span>
                    <Play
                      size={14}
                      fill="white"
                      className="text-white hidden group-hover:block"
                    />
                  </>
                )}
              </div>

              {/* Cover + Title + Artist */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-10 h-10 shrink-0 rounded overflow-hidden">
                  {song.coverUrl ? (
                    <Image
                      src={song.coverUrl}
                      alt={song.title}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#8B5CF6]/30 to-[#EC4899]/30" />
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium truncate",
                      active ? "text-[#8B5CF6]" : "text-zinc-100"
                    )}
                  >
                    {song.title}
                  </p>
                  <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                </div>
              </div>

              {/* Album */}
              <div className="hidden md:block min-w-0 pr-4">
                <p className="text-sm text-zinc-400 line-clamp-1">
                  {song.album ?? "—"}
                </p>
              </div>

              {/* Date added */}
              <div className="hidden md:block">
                <p className="text-sm text-zinc-400">
                  {formatDistanceToNow(new Date(song.addedAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>

              {/* Duration + heart */}
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={(e) => toggleLike(song.songId, e)}
                  className={cn(
                    "opacity-0 group-hover:opacity-100 transition-opacity",
                    liked && "opacity-100"
                  )}
                  aria-label="Like song"
                >
                  <Heart
                    size={14}
                    className={cn(
                      liked
                        ? "fill-[#EC4899] text-[#EC4899]"
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  />
                </button>
                <span className="text-sm text-zinc-400 tabular-nums">
                  {formatDuration(song.duration)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
