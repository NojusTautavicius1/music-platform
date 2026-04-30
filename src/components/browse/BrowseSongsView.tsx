"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Play, Pause, Plus, Search, Music, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/format";
import { usePlayerStore, type PlayerSong } from "@/store/playerStore";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addSongToPlaylist } from "@/app/actions/playlist";

// ─── Types ────────────────────────────────────────────────────────────────────

type BrowseSong = {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  genre: string | null;
  duration: number;
  coverUrl: string | null;
  audioUrl: string | null;
};

type UserPlaylist = { id: string; name: string };

type Props = {
  songs: BrowseSong[];
  total: number;
  genres: string[];
  userPlaylists: UserPlaylist[];
  currentGenre: string;
  currentSort: string;
  currentQuery: string;
  currentPage: number;
};

const SORT_OPTIONS = [
  { value: "recent", label: "Recently added" },
  { value: "title",  label: "Title" },
  { value: "artist", label: "Artist" },
  { value: "duration", label: "Duration" },
];

// ─── Filter Bar ──────────────────────────────────────────────────────────────

function FilterBar({
  genres,
  currentGenre,
  currentSort,
  currentQuery,
  onGenreChange,
  onSortChange,
  onQueryChange,
}: {
  genres: string[];
  currentGenre: string;
  currentSort: string;
  currentQuery: string;
  onGenreChange: (g: string) => void;
  onSortChange: (s: string) => void;
  onQueryChange: (q: string) => void;
}) {
  const [localQuery, setLocalQuery] = useState(currentQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleQueryInput(val: string) {
    setLocalQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onQueryChange(val), 350);
  }

  useEffect(() => {
    setLocalQuery(currentQuery);
  }, [currentQuery]);

  const selectCls =
    "h-9 rounded-full border border-white/10 bg-white/5 text-zinc-200 text-sm px-3 pr-8 appearance-none cursor-pointer hover:bg-white/10 transition-colors focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]/50";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Genre */}
      <div className="relative">
        <select
          value={currentGenre}
          onChange={(e) => onGenreChange(e.target.value)}
          className={selectCls}
        >
          <option value="">All genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500">▾</span>
      </div>

      {/* Sort */}
      <div className="relative">
        <select
          value={currentSort}
          onChange={(e) => onSortChange(e.target.value)}
          className={selectCls}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500">▾</span>
      </div>

      {/* Text search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
        <input
          type="text"
          value={localQuery}
          onChange={(e) => handleQueryInput(e.target.value)}
          placeholder="Search songs…"
          className="h-9 pl-8 pr-3 rounded-full border border-white/10 bg-white/5 text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#8B5CF6]/50 hover:bg-white/10 transition-colors w-44"
        />
      </div>
    </div>
  );
}

// ─── Add to playlist popover ─────────────────────────────────────────────────

function AddToPlaylistButton({
  songId,
  userPlaylists,
}: {
  songId: string;
  userPlaylists: UserPlaylist[];
}) {
  const [open, setOpen] = useState(false);

  if (userPlaylists.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            onClick={(e) => e.stopPropagation()}
            className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Add to playlist"
          >
            <Plus size={14} />
          </button>
        }
      />
      <PopoverContent
        sideOffset={8}
        className="w-52 p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-2 pb-1">
          Add to playlist
        </p>
        <div className="max-h-52 overflow-y-auto">
          {userPlaylists.map((pl) => (
            <button
              key={pl.id}
              onClick={async () => {
                const result = await addSongToPlaylist(pl.id, songId);
                if (result.ok) {
                  toast.success(`Added to ${result.playlistName}`);
                  setOpen(false);
                } else {
                  toast.error(result.error);
                }
              }}
              className="w-full text-left px-2 py-1.5 rounded text-sm text-zinc-200 hover:bg-white/5 transition-colors"
            >
              {pl.name}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Song Row ─────────────────────────────────────────────────────────────────

function SongRow({
  song,
  index,
  queue,
  userPlaylists,
}: {
  song: BrowseSong;
  index: number;
  queue: PlayerSong[];
  userPlaylists: UserPlaylist[];
}) {
  const play = usePlayerStore((s) => s.play);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  const isActive = currentSong?.id === song.id;
  const isCurrentlyPlaying = isActive && isPlaying;

  const playerSong: PlayerSong = {
    id: song.id,
    title: song.title,
    artist: song.artist,
    album: song.album,
    duration: song.duration,
    coverUrl: song.coverUrl,
    audioUrl: song.audioUrl,
  };

  function handlePlay() {
    if (isActive) {
      togglePlay();
    } else {
      play(playerSong, queue);
    }
  }

  return (
    <>
      {/* Mobile */}
      <div
        className="md:hidden flex items-center gap-3 px-2 h-16 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
        onClick={handlePlay}
      >
        <div className="relative w-10 h-10 rounded shrink-0 overflow-hidden">
          {song.coverUrl ? (
            <Image src={song.coverUrl} alt={song.title} fill sizes="40px" className="object-cover" />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-[#8B5CF6]/30 to-[#EC4899]/30 flex items-center justify-center">
              <Music size={14} className="text-zinc-600" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium truncate", isActive ? "text-[#8B5CF6]" : "text-zinc-100")}>
            {song.title}
          </p>
          <p className="text-xs text-zinc-500 truncate">{song.artist}</p>
        </div>
        <AddToPlaylistButton songId={song.id} userPlaylists={userPlaylists} />
        <span className="text-xs text-zinc-500 tabular-nums shrink-0">
          {formatDuration(song.duration)}
        </span>
      </div>

      {/* Desktop */}
      <div
        className="hidden md:grid grid-cols-[2.5rem_1fr_160px_120px_6rem_2.5rem] items-center px-4 h-14 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
        onClick={handlePlay}
      >
        {/* # / play */}
        <div className="flex items-center justify-center">
          {isCurrentlyPlaying ? (
            <button
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="text-[#8B5CF6]"
              aria-label="Pause"
            >
              <Pause size={16} fill="currentColor" />
            </button>
          ) : (
            <>
              <span className={cn("text-sm tabular-nums text-zinc-500 group-hover:hidden", isActive && "text-[#8B5CF6]")}>
                {index + 1}
              </span>
              <Play size={16} className="hidden group-hover:block text-zinc-100" fill="currentColor" />
            </>
          )}
        </div>

        {/* Title + cover */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-10 h-10 rounded shrink-0 overflow-hidden">
            {song.coverUrl ? (
              <Image src={song.coverUrl} alt={song.title} fill sizes="40px" className="object-cover" />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-[#8B5CF6]/30 to-[#EC4899]/30 flex items-center justify-center">
                <Music size={14} className="text-zinc-600" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className={cn("text-sm font-medium truncate", isActive ? "text-[#8B5CF6]" : "text-zinc-100")}>
              {song.title}
            </p>
            <p className="text-xs text-zinc-500 truncate">{song.artist}</p>
          </div>
        </div>

        {/* Album */}
        <p className="text-sm text-zinc-500 truncate pr-4">{song.album ?? "—"}</p>

        {/* Genre */}
        <p className="text-sm text-zinc-500 truncate pr-4">{song.genre ?? "—"}</p>

        {/* Duration */}
        <span className="text-sm text-zinc-500 tabular-nums">{formatDuration(song.duration)}</span>

        {/* Add */}
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <AddToPlaylistButton songId={song.id} userPlaylists={userPlaylists} />
        </div>
      </div>
    </>
  );
}

// ─── BrowseSongsView ──────────────────────────────────────────────────────────

export function BrowseSongsView({
  songs,
  total,
  genres,
  userPlaylists,
  currentGenre,
  currentSort,
  currentQuery,
  currentPage,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(total / 50);

  const queue: PlayerSong[] = songs.map((s) => ({
    id: s.id,
    title: s.title,
    artist: s.artist,
    album: s.album,
    duration: s.duration,
    coverUrl: s.coverUrl,
    audioUrl: s.audioUrl,
  }));

  const pushParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) {
          params.set(k, v);
        } else {
          params.delete(k);
        }
      });
      // Reset to page 1 when filters change
      if (!("page" in updates)) params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="pb-12">
      {/* Header */}
      <div className="px-4 md:px-8 pt-8 pb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">Browse</h1>
        <p className="text-zinc-500 text-sm">{total.toLocaleString()} songs</p>
      </div>

      {/* Filter bar */}
      <div className="px-4 md:px-8 pb-6">
        <FilterBar
          genres={genres}
          currentGenre={currentGenre}
          currentSort={currentSort}
          currentQuery={currentQuery}
          onGenreChange={(g) => pushParams({ genre: g })}
          onSortChange={(s) => pushParams({ sort: s })}
          onQueryChange={(q) => pushParams({ q })}
        />
      </div>

      {/* Table header — desktop only */}
      <div className="hidden md:grid grid-cols-[2.5rem_1fr_160px_120px_6rem_2.5rem] items-center px-4 md:px-8 py-2 border-b border-white/10 mb-1 sticky top-0 z-10 bg-[#0A0A0F]">
        <span className="text-xs text-zinc-500 text-center">#</span>
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Title</span>
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Album</span>
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Genre</span>
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Duration</span>
        <span />
      </div>

      {/* Song list */}
      <div className="px-4 md:px-8">
        {songs.length === 0 ? (
          <p className="text-zinc-500 text-sm py-12 text-center">No songs found.</p>
        ) : (
          songs.map((song, i) => (
            <SongRow
              key={song.id}
              song={song}
              index={(currentPage - 1) * 50 + i}
              queue={queue}
              userPlaylists={userPlaylists}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 md:px-8 pt-8 flex items-center gap-3">
          <button
            disabled={currentPage <= 1}
            onClick={() => pushParams({ page: String(currentPage - 1) })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} />
            Prev
          </button>
          <span className="text-sm text-zinc-500">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => pushParams({ page: String(currentPage + 1) })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
