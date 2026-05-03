"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  ChevronUp,
  Loader2,
  Music2,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  suggestSongsForPlaylist,
  type RecommendationSong,
} from "@/app/actions/recommendations";

type Props = {
  playlistId: string;
  mode: "empty" | "more";
  initialSongs: RecommendationSong[];
  alreadyInPlaylist: Set<string>;
  onAddSong: (song: RecommendationSong) => Promise<boolean>;
};

function SuggestionRow({
  song,
  onAdd,
  isPending,
}: {
  song: RecommendationSong;
  onAdd: () => void;
  isPending: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/5 transition-colors group">
      <div className="relative w-6 h-6 rounded overflow-hidden shrink-0 bg-white/10">
        {song.coverUrl ? (
          <Image src={song.coverUrl} alt={song.title} fill sizes="24px" className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#0A0A0F] border border-white/5">
            <Music2 size={12} className="text-orange-500/50" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-100 truncate">{song.title}</p>
        <p className="text-xs text-zinc-500 truncate">{song.artist}</p>
      </div>
      <button
        onClick={onAdd}
        disabled={isPending}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/10 text-xs text-zinc-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
        aria-label={`Add ${song.title}`}
      >
        {isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
        Add
      </button>
    </div>
  );
}

export function PlaylistSuggestionsSection({
  playlistId,
  mode,
  initialSongs,
  alreadyInPlaylist,
  onAddSong,
}: Props) {
  const [expanded, setExpanded] = useState(mode === "empty");
  const [songs, setSongs] = useState<RecommendationSong[]>(initialSongs);
  const [loading, setLoading] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setSongs(initialSongs);
  }, [initialSongs]);

  useEffect(() => {
    if (mode === "empty") {
      setExpanded(true);
    }
  }, [mode]);

  const visibleSongs = useMemo(
    () => songs.filter((song) => !alreadyInPlaylist.has(song.id)),
    [songs, alreadyInPlaylist]
  );

  const loadSuggestions = useCallback(async (nextSeed?: string) => {
    setLoading(true);
    try {
      const seed = nextSeed ?? crypto.randomUUID();
      const nextSongs = await suggestSongsForPlaylist(playlistId, {
        seed,
        limit: mode === "empty" ? 10 : 5,
      });
      if (!mountedRef.current) return;
      setSongs(nextSongs);
    } catch {
      if (mountedRef.current) toast.error("Could not refresh suggestions");
    } finally {
      setLoading(false);
    }
  }, [mode, mountedRef, playlistId]);

  useEffect(() => {
    void loadSuggestions();
  }, [loadSuggestions]);

  async function handleAdd(song: RecommendationSong) {
    const previous = songs;
    setPendingIds((current) => new Set([...current, song.id]));
    setSongs((current) => current.filter((item) => item.id !== song.id));

    try {
      const ok = await onAddSong(song);
      if (!ok) {
        setSongs(previous);
        return;
      }
      if (mode === "empty") return;
      await loadSuggestions();
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(song.id);
        return next;
      });
    }
  }

  if (mode === "more" && !expanded) {
    return (
      <div className="px-4 md:px-8 pb-8">
        <button
          onClick={() => setExpanded(true)}
          className="text-sm text-zinc-500 hover:text-white transition-colors"
        >
          Show suggestions
        </button>
      </div>
    );
  }

  return (
    <div className={cn(mode === "empty" ? "px-4 md:px-8 pb-8" : "px-4 md:px-8 pb-8")}> 
      <div className={cn("rounded-2xl border border-white/5 bg-white/5", mode === "empty" ? "p-4 md:p-5" : "p-4") }>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-brand-orange" />
              <h3 className="text-sm font-semibold text-zinc-100">
                {mode === "empty" ? "Let's get this playlist started" : "More like this"}
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {mode === "empty"
                ? "Here are some songs based on what you've been into"
                : "Based on the playlist's genres and artists"}
            </p>
          </div>

          {mode === "more" && (
            <button
              onClick={() => setExpanded(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <ChevronUp size={14} />
            </button>
          )}
        </div>

        <div className="space-y-1">
          {loading && visibleSongs.length === 0 ? (
            <div className="flex items-center gap-2 py-4 text-zinc-500 text-sm">
              <Loader2 size={14} className="animate-spin" />
              Loading suggestions…
            </div>
          ) : visibleSongs.length === 0 ? (
            <p className="text-sm text-zinc-500 py-4">No suggestions available right now.</p>
          ) : (
            visibleSongs.map((song) => (
              <SuggestionRow
                key={song.id}
                song={song}
                onAdd={() => void handleAdd(song)}
                isPending={pendingIds.has(song.id)}
              />
            ))
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => void loadSuggestions()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh suggestions
          </button>

          {mode === "more" && (
            <button
              onClick={() => setExpanded(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Hide suggestions
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
