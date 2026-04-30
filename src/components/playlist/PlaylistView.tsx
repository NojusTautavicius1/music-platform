"use client";

import { useState, useOptimistic, useTransition } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import {
  Play,
  Heart,
  MoreHorizontal,
  Clock,
  Search,
  Pause,
  ListPlus,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/format";
import { usePlayerStore, type PlayerSong } from "@/store/playerStore";
import { toggleLike } from "@/app/actions/like";
import { addSongToPlaylist, addSongToNewPlaylist } from "@/app/actions/playlist";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  isLiked?: boolean;
};

export type UserPlaylist = {
  id: string;
  name: string;
};

type Props = {
  playlistId: string;
  songs: SongInPlaylist[];
  userPlaylists?: UserPlaylist[];
};

// ─── Song Row ─────────────────────────────────────────────────────────────────

type SongRowProps = {
  song: SongInPlaylist;
  idx: number;
  isActive: boolean;
  isLiked: boolean;
  queue: PlayerSong[];
  userPlaylists: UserPlaylist[];
  onPlay: () => void;
  onLike: (e: React.MouseEvent) => void;
};

function SongRow({
  song,
  idx,
  isActive,
  isLiked,
  queue: _queue,
  userPlaylists,
  onPlay,
  onLike,
}: SongRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleAddToPlaylist(playlist: UserPlaylist) {
    const result = await addSongToPlaylist(playlist.id, song.songId);
    if (result.ok) {
      toast.success(`Added to ${result.playlistName}`);
    } else {
      toast.error(result.error);
    }
  }

  async function handleAddToNew() {
    const result = await addSongToNewPlaylist(song.songId);
    if (result.ok) {
      toast.success(`Added to ${result.name}`);
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div
      onClick={onPlay}
      className={cn(
        "grid grid-cols-[2.5rem_1fr_180px_140px_8rem] items-center h-14 px-4 rounded-lg cursor-pointer group",
        "hover:bg-white/5 transition-colors",
        isActive && "bg-white/5"
      )}
    >
      {/* # / play icon */}
      <div className="flex items-center justify-center">
        {isActive ? (
          <Pause size={14} fill="#8B5CF6" className="text-[#8B5CF6]" />
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
            <div className="w-full h-full bg-linear-to-br from-[#8B5CF6]/30 to-[#EC4899]/30" />
          )}
        </div>
        <div className="min-w-0">
          <p
            className={cn(
              "text-sm font-medium truncate",
              isActive ? "text-[#8B5CF6]" : "text-zinc-100"
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
          {formatDistanceToNow(new Date(song.addedAt), { addSuffix: true })}
        </p>
      </div>

      {/* Heart + Duration + Three-dot */}
      <div className="flex items-center justify-end gap-1.5">
        <button
          onClick={onLike}
          className={cn(
            "transition-opacity shrink-0",
            isLiked
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
          )}
          aria-label={isLiked ? "Unlike song" : "Like song"}
        >
          <Heart
            size={14}
            className={cn(
              isLiked
                ? "fill-[#EC4899] text-[#EC4899]"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          />
        </button>

        <span className="text-sm text-zinc-400 tabular-nums w-9 text-right shrink-0">
          {formatDuration(song.duration)}
        </span>

        {/* Three-dot menu */}
        <DropdownMenu onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger
            render={
              <button
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "w-6 h-6 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-all shrink-0",
                  menuOpen
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                )}
                aria-label="More options"
              >
                <MoreHorizontal size={14} />
              </button>
            }
          />
          <DropdownMenuContent
            side="bottom"
            align="end"
            className="w-52 bg-[#18181F] border-white/10 text-zinc-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Add to playlist submenu */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white data-popup-open:bg-white/10">
                <ListPlus size={14} />
                Add to playlist
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                className="w-52 bg-[#18181F] border-white/10 text-zinc-100 max-h-[240px] overflow-y-auto"
              >
                {/* Create new */}
                <DropdownMenuItem
                  className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white"
                  onClick={handleAddToNew}
                >
                  <PlusCircle size={14} />
                  Create new playlist
                </DropdownMenuItem>

                {userPlaylists.length > 0 && (
                  <DropdownMenuSeparator className="bg-white/10" />
                )}

                {userPlaylists.map((pl) => (
                  <DropdownMenuItem
                    key={pl.id}
                    className="cursor-pointer focus:bg-white/10 focus:text-white truncate"
                    onClick={() => handleAddToPlaylist(pl)}
                  >
                    {pl.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white">
              Share
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── PlaylistView ─────────────────────────────────────────────────────────────

export function PlaylistView({
  playlistId: _playlistId,
  songs,
  userPlaylists = [],
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isPlaylistLiked, setIsPlaylistLiked] = useState(false);
  const [isPending, startTransition] = useTransition();

  // ── Like state ──────────────────────────────────────────────────────────────
  // Use regular state + optimistic pattern: confirmed reflects server truth,
  // displayed is the optimistic overlay during pending transitions.
  const [confirmedLiked, setConfirmedLiked] = useState<Set<string>>(
    () => new Set(songs.filter((s) => s.isLiked).map((s) => s.songId))
  );

  const [optimisticLiked, applyOptimistic] = useOptimistic(
    confirmedLiked,
    (state: Set<string>, songId: string) => {
      const next = new Set(state);
      next.has(songId) ? next.delete(songId) : next.add(songId);
      return next;
    }
  );

  function handleLike(songId: string, e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      applyOptimistic(songId);
      const result = await toggleLike(songId);
      if (result.ok) {
        setConfirmedLiked((prev) => {
          const next = new Set(prev);
          result.isLiked ? next.add(songId) : next.delete(songId);
          return next;
        });
      } else {
        toast.error("Could not update like");
      }
    });
  }

  // ── Player ──────────────────────────────────────────────────────────────────
  const play = usePlayerStore((s) => s.play);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

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
      togglePlay();
    } else {
      play(playerSong, queue);
    }
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
              togglePlay();
            } else {
              handlePlaySong(songs[0]);
            }
          }}
          className="h-14 w-14 rounded-full bg-linear-to-br from-[#8B5CF6] to-[#EC4899] flex items-center justify-center hover:scale-105 transition-transform shadow-lg shrink-0"
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
          onClick={() => setIsPlaylistLiked((v) => !v)}
          aria-label="Like playlist"
          className="w-8 h-8 flex items-center justify-center"
        >
          <Heart
            size={22}
            className={cn(
              "transition-colors",
              isPlaylistLiked
                ? "fill-[#EC4899] text-[#EC4899]"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          />
        </button>

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
        <div className="sticky top-0 z-10 bg-[#0A0A0F] grid grid-cols-[2.5rem_1fr_180px_140px_8rem] items-center px-4 py-2 border-b border-white/10 mb-1">
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

        {filtered.map((song, idx) => (
          <SongRow
            key={song.songId}
            song={song}
            idx={idx}
            isActive={isCurrentlyPlaying(song.songId)}
            isLiked={optimisticLiked.has(song.songId)}
            queue={queue}
            userPlaylists={userPlaylists}
            onPlay={() => handlePlaySong(song)}
            onLike={(e) => handleLike(song.songId, e)}
          />
        ))}
      </div>

      {/* Suppress unused warning for isPending */}
      {isPending && null}
    </>
  );
}
