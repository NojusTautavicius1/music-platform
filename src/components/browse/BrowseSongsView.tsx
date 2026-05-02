"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Play, Pause, Plus, Search, Music, ChevronLeft, ChevronRight, Activity } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDuration, formatPlayCount } from "@/lib/format";
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
  waveformPeaks?: number[] | null;
  playCount?: number;
  bpm?: number | null;
  key?: string | null;
  mood?: string | null;
  energy?: number | null;
  valence?: number | null;
  analyzedAt?: string | null;
};

type UserPlaylist = { id: string; name: string };

type Props = {
  songs: BrowseSong[];
  total: number;
  genres: string[];
  moods: string[];
  musicalKeys: string[];
  userPlaylists: UserPlaylist[];
  currentGenre: string;
  currentSort: string;
  currentQuery: string;
  currentPage: number;
  currentMood: string;
  currentKey: string;
  currentBpmMin: string;
  currentBpmMax: string;
};

const SORT_OPTIONS = [
  { value: "recent", label: "Recently added" },
  { value: "mostPlayed", label: "Most played" },
  { value: "title",  label: "Title" },
  { value: "artist", label: "Artist" },
  { value: "duration", label: "Duration" },
];

const MOOD_LABELS: Record<string, string> = {
  happy: "Happy", sad: "Sad", energetic: "Energetic", calm: "Calm",
  melancholic: "Melancholic", aggressive: "Aggressive", romantic: "Romantic", uplifting: "Uplifting",
};

const MOOD_COLORS: Record<string, string> = {
  happy: "text-yellow-400",
  sad: "text-blue-400",
  energetic: "text-orange-400",
  calm: "text-teal-400",
  melancholic: "text-indigo-400",
  aggressive: "text-red-400",
  romantic: "text-pink-400",
  uplifting: "text-emerald-400",
};

// ─── Audio Feature Tooltip ────────────────────────────────────────────────────

function AudioTooltip({ song }: { song: BrowseSong }) {
  if (!song.analyzedAt) {
    return (
      <div className="p-3 space-y-1">
        <p className="text-xs text-zinc-500 italic">Analyzing…</p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2.5 min-w-[180px]">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-zinc-500">BPM</span>
        <span className="text-xs font-semibold text-zinc-100">{song.bpm ?? "—"}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-zinc-500">Key</span>
        <span className="text-xs font-semibold text-zinc-100">{song.key ?? "—"}</span>
      </div>
      {song.mood && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-zinc-500">Mood</span>
          <span className={cn("text-xs font-semibold capitalize", MOOD_COLORS[song.mood] ?? "text-zinc-100")}>
            {MOOD_LABELS[song.mood] ?? song.mood}
          </span>
        </div>
      )}
      {song.energy != null && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Energy</span>
            <span className="text-xs text-zinc-400">{Math.round(song.energy * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-linear-to-r from-orange-500 to-brand-magenta"
              style={{ width: `${Math.round(song.energy * 100)}%` }}
            />
          </div>
        </div>
      )}
      {song.valence != null && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Valence</span>
            <span className="text-xs text-zinc-400">{Math.round(song.valence * 100)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-linear-to-r from-purple-500 to-pink-500"
              style={{ width: `${Math.round(song.valence * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Filter Bar ──────────────────────────────────────────────────────────────

function FilterBar({
  genres,
  moods,
  musicalKeys,
  currentGenre,
  currentSort,
  currentQuery,
  currentMood,
  currentKey,
  currentBpmMin,
  currentBpmMax,
  onGenreChange,
  onSortChange,
  onQueryChange,
  onMoodChange,
  onKeyChange,
  onBpmChange,
}: {
  genres: string[];
  moods: string[];
  musicalKeys: string[];
  currentGenre: string;
  currentSort: string;
  currentQuery: string;
  currentMood: string;
  currentKey: string;
  currentBpmMin: string;
  currentBpmMax: string;
  onGenreChange: (g: string) => void;
  onSortChange: (s: string) => void;
  onQueryChange: (q: string) => void;
  onMoodChange: (m: string) => void;
  onKeyChange: (k: string) => void;
  onBpmChange: (min: string, max: string) => void;
}) {
  const [localQuery, setLocalQuery] = useState(currentQuery);
  const [localBpmMin, setLocalBpmMin] = useState(currentBpmMin);
  const [localBpmMax, setLocalBpmMax] = useState(currentBpmMax);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bpmDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleQueryInput(val: string) {
    setLocalQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onQueryChange(val), 350);
  }

  function handleBpmInput(min: string, max: string) {
    setLocalBpmMin(min);
    setLocalBpmMax(max);
    if (bpmDebounceRef.current) clearTimeout(bpmDebounceRef.current);
    bpmDebounceRef.current = setTimeout(() => onBpmChange(min, max), 500);
  }

  useEffect(() => { setLocalQuery(currentQuery); }, [currentQuery]);
  useEffect(() => { setLocalBpmMin(currentBpmMin); setLocalBpmMax(currentBpmMax); }, [currentBpmMin, currentBpmMax]);

  const selectCls =
    "h-9 rounded-full border border-white/15 bg-white/5 text-zinc-200 text-sm px-3 pr-8 appearance-none cursor-pointer hover:bg-white/10 transition-colors focus:outline-none focus:ring-1 focus:ring-orange-500/40";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Genre */}
      <div className="relative">
        <select value={currentGenre} onChange={(e) => onGenreChange(e.target.value)} className={selectCls}>
          <option value="">All genres</option>
          {genres.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500">▾</span>
      </div>

      {/* Mood */}
      {moods.length > 0 && (
        <div className="relative">
          <select value={currentMood} onChange={(e) => onMoodChange(e.target.value)} className={selectCls}>
            <option value="">All moods</option>
            {moods.map((m) => <option key={m} value={m}>{MOOD_LABELS[m] ?? m}</option>)}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500">▾</span>
        </div>
      )}

      {/* Key */}
      {musicalKeys.length > 0 && (
        <div className="relative">
          <select value={currentKey} onChange={(e) => onKeyChange(e.target.value)} className={selectCls}>
            <option value="">All keys</option>
            {musicalKeys.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500">▾</span>
        </div>
      )}

      {/* BPM range */}
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={localBpmMin}
          onChange={(e) => handleBpmInput(e.target.value, localBpmMax)}
          placeholder="BPM min"
          min={0}
          max={300}
          className="h-9 w-20 rounded-full border border-white/15 bg-white/5 text-zinc-200 text-sm px-3 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/40 hover:bg-white/10 transition-colors"
        />
        <span className="text-zinc-600 text-xs">–</span>
        <input
          type="number"
          value={localBpmMax}
          onChange={(e) => handleBpmInput(localBpmMin, e.target.value)}
          placeholder="BPM max"
          min={0}
          max={300}
          className="h-9 w-20 rounded-full border border-white/15 bg-white/5 text-zinc-200 text-sm px-3 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/40 hover:bg-white/10 transition-colors"
        />
      </div>

      {/* Sort */}
      <div className="relative">
        <select value={currentSort} onChange={(e) => onSortChange(e.target.value)} className={selectCls}>
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
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
          className="h-9 pl-8 pr-3 rounded-full border border-white/15 bg-white/5 text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/40 hover:bg-white/10 transition-colors w-44"
        />
      </div>
    </div>
  );
}

// ─── Add to playlist popover ─────────────────────────────────────────────────

function AddToPlaylistButton({ songId, userPlaylists }: { songId: string; userPlaylists: UserPlaylist[] }) {
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
      <PopoverContent sideOffset={8} className="w-52 p-2" onClick={(e) => e.stopPropagation()}>
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 px-2 pb-1">Add to playlist</p>
        <div className="max-h-52 overflow-y-auto">
          {userPlaylists.map((pl) => (
            <button
              key={pl.id}
              onClick={async () => {
                const result = await addSongToPlaylist(pl.id, songId);
                if (result.ok) { toast.success(`Added to ${result.playlistName}`); setOpen(false); }
                else { toast.error(result.error); }
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

function SongRow({ song, index, queue, userPlaylists }: {
  song: BrowseSong;
  index: number;
  queue: PlayerSong[];
  userPlaylists: UserPlaylist[];
}) {
  const play = usePlayerStore((s) => s.play);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlay = usePlayerStore((s) => s.togglePlay);
  const [tooltipOpen, setTooltipOpen] = useState(false);

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
    waveformPeaks: song.waveformPeaks,
    playCount: song.playCount,
    bpm: song.bpm,
    key: song.key,
    mood: song.mood,
    energy: song.energy,
    valence: song.valence,
    analyzedAt: song.analyzedAt,
  };

  function handlePlay() {
    if (isActive) togglePlay();
    else play(playerSong, queue);
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
          <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500 truncate md:hidden">
            <Play size={10} className="shrink-0 text-zinc-600" fill="currentColor" />
            <span>{formatPlayCount(song.playCount ?? 0)} plays</span>
          </p>
        </div>
        <AddToPlaylistButton songId={song.id} userPlaylists={userPlaylists} />
        <span className="text-xs text-zinc-500 tabular-nums shrink-0">{formatDuration(song.duration)}</span>
      </div>

      {/* Desktop */}
      <div
        className="hidden md:grid grid-cols-[2.5rem_1fr_160px_120px_120px_6rem_2rem_2.5rem] items-center px-4 h-14 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
        onClick={handlePlay}
      >
        {/* # / play */}
        <div className="flex items-center justify-center">
          {isCurrentlyPlaying ? (
            <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="text-[#8B5CF6]" aria-label="Pause">
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

        {/* Title + cover with tooltip */}
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
            <Popover open={tooltipOpen} onOpenChange={setTooltipOpen}>
              <PopoverTrigger
                render={
                  <button
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={() => setTooltipOpen(true)}
                    onMouseLeave={() => setTooltipOpen(false)}
                    className="text-left"
                  >
                    <p className={cn("text-sm font-medium truncate hover:underline", isActive ? "text-[#8B5CF6]" : "text-zinc-100")}>
                      {song.title}
                    </p>
                  </button>
                }
              />
              <PopoverContent
                sideOffset={6}
                className="w-auto p-0 bg-zinc-900 border border-white/10"
                onMouseEnter={() => setTooltipOpen(true)}
                onMouseLeave={() => setTooltipOpen(false)}
                onClick={(e) => e.stopPropagation()}
              >
                <AudioTooltip song={song} />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-zinc-500 truncate">{song.artist}</p>
          </div>
        </div>

        {/* Album */}
        <p className="text-sm text-zinc-500 truncate pr-4">{song.album ?? "—"}</p>

        {/* Plays */}
        <p className="text-sm text-zinc-500 truncate pr-4 flex items-center gap-1">
          <Play size={12} className="shrink-0 text-zinc-600" fill="currentColor" />
          <span>{formatPlayCount(song.playCount ?? 0)}</span>
        </p>

        {/* Genre */}
        <p className="text-sm text-zinc-500 truncate pr-4">{song.genre ?? "—"}</p>

        {/* Duration */}
        <span className="text-sm text-zinc-500 tabular-nums">{formatDuration(song.duration)}</span>

        {/* Audio badge: BPM or Analyzing */}
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          {song.analyzedAt ? (
            song.bpm ? (
              <span className="text-[10px] text-zinc-600 tabular-nums">{Math.round(song.bpm)}</span>
            ) : null
          ) : (
            <Activity size={12} className="text-zinc-700 animate-pulse" />
          )}
        </div>

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
  moods,
  musicalKeys,
  userPlaylists,
  currentGenre,
  currentSort,
  currentQuery,
  currentPage,
  currentMood,
  currentKey,
  currentBpmMin,
  currentBpmMax,
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
    waveformPeaks: s.waveformPeaks,
    playCount: s.playCount,
    bpm: s.bpm,
    key: s.key,
    mood: s.mood,
    energy: s.energy,
    valence: s.valence,
    analyzedAt: s.analyzedAt,
  }));

  const pushParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
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
          moods={moods}
          musicalKeys={musicalKeys}
          currentGenre={currentGenre}
          currentSort={currentSort}
          currentQuery={currentQuery}
          currentMood={currentMood}
          currentKey={currentKey}
          currentBpmMin={currentBpmMin}
          currentBpmMax={currentBpmMax}
          onGenreChange={(g) => pushParams({ genre: g })}
          onSortChange={(s) => pushParams({ sort: s })}
          onQueryChange={(q) => pushParams({ q })}
          onMoodChange={(m) => pushParams({ mood: m })}
          onKeyChange={(k) => pushParams({ key: k })}
          onBpmChange={(min, max) => pushParams({ bpmMin: min, bpmMax: max })}
        />
      </div>

      {/* Table header — desktop only */}
      <div className="hidden md:grid grid-cols-[2.5rem_1fr_160px_120px_120px_6rem_2rem_2.5rem] items-center px-4 md:px-8 py-2 border-b border-white/10 mb-1 sticky top-0 z-10 bg-[#0A0A0F]">
        <span className="text-xs text-zinc-500 text-center">#</span>
        <span className="text-xs text-zinc-500 uppercase tracking-widest">Title</span>
        <span className="text-xs text-zinc-500 uppercase tracking-widest">Album</span>
        <span className="text-xs text-zinc-500 uppercase tracking-widest">Plays</span>
        <span className="text-xs text-zinc-500 uppercase tracking-widest">Genre</span>
        <span className="text-xs text-zinc-500 uppercase tracking-widest">Duration</span>
        <span className="text-xs text-zinc-500 uppercase tracking-widest">BPM</span>
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
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-sm text-zinc-500">Page {currentPage} of {totalPages}</span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => pushParams({ page: String(currentPage + 1) })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
