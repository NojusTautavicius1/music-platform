"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Sparkles, Play, Pause, Plus, Music2, Loader2, AlertCircle,
  Check, ChevronDown, ListPlus, X, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { askAgent, fetchUsage, RateLimitError, type AgentResponse, type AgentSong, type UsageInfo } from "@/lib/ai/agentClient";
import { usePlayerStore } from "@/store/playerStore";
import { CreatePlaylistDialog } from "@/components/playlist/CreatePlaylistDialog";
import {
  getUserPlaylists,
  addSongsToPlaylist,
  type UserPlaylist,
} from "@/app/actions/playlist";
import Sonara3DBackground from "@/components/shared/Sonara3DBackground";

const EXAMPLE_QUERIES = [
  "songs for a rainy evening",
  "something fast for running",
  "sad love songs in minor keys",
  "late-night coding vibes",
  "uplifting morning energy",
  "melancholic indie folk",
];

const SUGGESTED_CHIPS = [
  "Chill Sunday morning",
  "Study focus",
  "Post-breakup sad",
  "Energetic workout",
  "Road trip anthems",
  "Late night drive",
];

function SongCardSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 animate-pulse">
      <div className="w-5 h-5 rounded bg-white/10 shrink-0 mt-0.5" />
      <div className="w-16 h-16 rounded-lg bg-white/10 shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-4 w-1/2 bg-white/10 rounded" />
        <div className="h-3 w-1/3 bg-white/10 rounded" />
        <div className="h-3 w-3/4 bg-white/10 rounded" />
      </div>
    </div>
  );
}

function SongCard({
  song,
  selected,
  onToggle,
}: {
  song: AgentSong;
  selected: boolean;
  onToggle: () => void;
}) {
  const { currentSong, isPlaying, play, pause } = usePlayerStore();
  const isThisSong = currentSong?.id === song.id;
  const isThisPlaying = isThisSong && isPlaying;

  function handlePlay() {
    if (!song.audioUrl || !song.duration) {
      toast.error("Audio not available for this song");
      return;
    }
    if (isThisPlaying) {
      pause();
      return;
    }
    play(
      {
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: null,
        duration: song.duration,
        coverUrl: song.coverUrl,
        audioUrl: song.audioUrl,
      },
      [],
      "ask-sonara"
    );
  }

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 ${
        isThisSong
          ? "bg-orange-500/10 border-orange-500/30"
          : selected
          ? "bg-white/8 border-white/15"
          : "bg-white/5 border-white/5 hover:bg-white/8 hover:border-white/10"
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        aria-label={selected ? "Deselect" : "Select"}
        className={`mt-1 w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-all duration-150 ${
          selected
            ? "bg-orange-500 border-orange-500"
            : "border-white/20 hover:border-white/40"
        }`}
      >
        {selected && <Check size={12} className="text-white" strokeWidth={3} />}
      </button>

      {/* Cover + play */}
      <div className="relative shrink-0">
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/10">
          {song.coverUrl ? (
            <Image
              src={song.coverUrl}
              alt={song.title}
              width={56}
              height={56}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music2 size={20} className="text-zinc-600" />
            </div>
          )}
        </div>
        <button
          onClick={handlePlay}
          className={`absolute inset-0 flex items-center justify-center rounded-lg transition-all duration-200 ${
            isThisPlaying
              ? "bg-black/40 opacity-100"
              : "bg-black/0 opacity-0 hover:opacity-100 hover:bg-black/50"
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
            {isThisPlaying ? (
              <Pause size={12} className="text-white" />
            ) : (
              <Play size={12} className="text-white ml-0.5" />
            )}
          </div>
        </button>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-sm truncate ${isThisSong ? "text-orange-400" : "text-zinc-100"}`}>
          {song.title}
        </p>
        <p className="text-xs text-zinc-500 truncate mt-0.5">{song.artist}</p>
        {song.why && (
          <p className="text-xs text-zinc-400 mt-2 italic leading-relaxed line-clamp-2">
            ✨ {song.why}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Playlist picker dropdown ─────────────────────────────────────────────────

function PlaylistPicker({
  selectedIds,
  onClose,
}: {
  selectedIds: string[];
  onClose: () => void;
}) {
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getUserPlaylists().then((r) => {
      if (r.ok) setPlaylists(r.playlists);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [onClose]);

  async function handleAddToExisting(playlistId: string) {
    setAdding(playlistId);
    const res = await addSongsToPlaylist(playlistId, selectedIds);
    setAdding(null);
    if (res.ok) {
      toast.success(
        res.added === 0
          ? `Already in "${res.playlistName}"`
          : `Added ${res.added} song${res.added === 1 ? "" : "s"} to "${res.playlistName}"`
      );
      onClose();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div
      ref={ref}
      className="absolute bottom-full mb-2 right-0 w-72 rounded-2xl bg-[#18181F] border border-white/10 shadow-2xl overflow-hidden z-50"
    >
      <div className="px-4 py-3 border-b border-white/8">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
          Add {selectedIds.length} song{selectedIds.length === 1 ? "" : "s"} to…
        </p>
      </div>

      <div className="max-h-60 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-6 text-zinc-500 text-sm gap-2">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : playlists.length === 0 ? (
          <p className="py-4 px-4 text-sm text-zinc-500">No playlists yet.</p>
        ) : (
          playlists.map((p) => (
            <button
              key={p.id}
              onClick={() => handleAddToExisting(p.id)}
              disabled={adding === p.id}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left disabled:opacity-50"
            >
              <div className="w-9 h-9 rounded-md overflow-hidden shrink-0 bg-white/10 flex items-center justify-center">
                {p.coverUrl ? (
                  <Image src={p.coverUrl} alt={p.name} width={36} height={36} className="w-full h-full object-cover" />
                ) : (
                  <Music2 size={16} className="text-zinc-600" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-zinc-100 truncate">{p.name}</p>
                <p className="text-xs text-zinc-500">{p.songCount} songs</p>
              </div>
              {adding === p.id && <Loader2 size={14} className="animate-spin text-zinc-400 shrink-0" />}
            </button>
          ))
        )}
      </div>

      <div className="px-3 py-2 border-t border-white/8">
        <CreatePlaylistDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          initialSongIds={selectedIds}
        >
          <button
            onClick={() => setCreateOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-zinc-300 hover:text-white transition-colors"
          >
            <Plus size={14} className="text-orange-400" />
            New playlist
          </button>
        </CreatePlaylistDialog>
      </div>
    </div>
  );
}

// ─── Usage badge ──────────────────────────────────────────────────────────────

function useCountdown(resetAt: string | null) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    if (!resetAt) { setRemaining(""); return; }
    const tick = () => {
      const ms = new Date(resetAt).getTime() - Date.now();
      if (ms <= 0) { setRemaining(""); return; }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setRemaining(`${m}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [resetAt]);
  return remaining;
}

function RateLimitCard({ usage }: { usage: UsageInfo | null }) {
  const remaining = useCountdown(usage?.resetAt ?? null);
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200">
      <Clock size={18} className="shrink-0 mt-0.5 text-orange-400" />
      <div>
        <p className="text-sm font-semibold text-orange-300">Hourly limit reached</p>
        <p className="text-sm text-orange-200/70 mt-0.5">
          You&apos;ve used all {usage?.limit ?? 5} asks for this hour.
          {remaining ? <> Resets in <span className="font-mono font-semibold text-orange-300">{remaining}</span>.</> : null}
        </p>
      </div>
    </div>
  );
}

function UsageBadge({ usage }: { usage: UsageInfo | null }) {
  const remaining = useCountdown(usage?.resetAt ?? null);
  if (!usage) return null;
  const left = usage.limit - usage.used;
  const full = left <= 0;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
      full
        ? "bg-red-500/10 border-red-500/30 text-red-400"
        : left <= 2
        ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
        : "bg-white/5 border-white/10 text-zinc-400"
    }`}>
      <Clock size={11} />
      {full ? (
        <span>Resets in {remaining || "…"}</span>
      ) : (
        <span>{left}/{usage.limit} asks left this hour</span>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function AskPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % EXAMPLE_QUERIES.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetchUsage().then(setUsage);
  }, []);

  const handleSubmit = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed || loading) return;
      setLoading(true);
      setError(null);
      setResult(null);
      setSelected(new Set());
      setPickerOpen(false);

      router.replace(`/ask?q=${encodeURIComponent(trimmed)}`, { scroll: false });

      try {
        const data = await askAgent(trimmed);
        setResult(data);
        setSelected(new Set(data.songs.map((s) => s.id)));
        fetchUsage().then(setUsage);
      } catch (e) {
        if (e instanceof RateLimitError) {
          setUsage({ used: e.used, limit: e.limit, resetAt: e.resetAt });
          setError("rate_limit");
        } else {
          setError(e instanceof Error ? e.message : "Something went wrong.");
        }
      } finally {
        setLoading(false);
      }
    },
    [loading, router]
  );

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !result && !loading) {
      setQuery(q);
      handleSubmit(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim() === "/usage") {
      setQuery("");
      fetchUsage().then((u) => {
        setUsage(u);
        const left = u.limit - u.used;
        toast.info(
          left > 0
            ? `${left}/${u.limit} asks remaining this hour`
            : `Limit reached — resets at ${new Date(u.resetAt!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
          { duration: 4000 }
        );
      });
      return;
    }
    handleSubmit(query);
  }

  function onChipClick(chip: string) {
    setQuery(chip);
    handleSubmit(chip);
  }

  function toggleSong(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (!result) return;
    if (selected.size === result.songs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(result.songs.map((s) => s.id)));
    }
  }

  const selectedIds = Array.from(selected);
  const allSelected = result ? selected.size === result.songs.length : false;

  return (
    <div className="relative min-h-full">
      <Sonara3DBackground />
    <div className="relative z-10 p-4 md:p-8 pb-40 max-w-2xl mx-auto lg:-translate-x-16 flex flex-col">
      {/* Hero */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium mb-4">
          <Sparkles size={12} />
          AI-powered recommendations
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 bg-linear-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          Ask anything
        </h1>
        <p className="text-zinc-400 text-base mb-3">
          Tell us a vibe, mood, activity, or song you love. We&apos;ll find what fits.
        </p>
        <UsageBadge usage={usage} />
      </div>

      {/* Input */}
      <form onSubmit={onFormSubmit} className="mb-4">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onFormSubmit(e as unknown as React.FormEvent);
              }
            }}
            placeholder={EXAMPLE_QUERIES[placeholderIdx]}
            rows={2}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-zinc-100 placeholder:text-zinc-600 text-base resize-none focus:outline-none focus:border-orange-500/40 focus:ring-1 focus:ring-orange-500/20 transition-all pr-28"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-3 bottom-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-orange-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Ask
          </button>
        </div>
      </form>

      {/* Suggested chips */}
      {!result && !loading && (
        <div className="flex flex-wrap gap-2 mb-8">
          {SUGGESTED_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => onChipClick(chip)}
              className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-400 text-xs hover:border-orange-500/40 hover:text-orange-400 hover:bg-orange-500/5 transition-all duration-200"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-zinc-400 text-sm mb-4">
            <Loader2 size={16} className="animate-spin text-orange-400" />
            <span>
              Thinking<span className="animate-pulse">…</span>
            </span>
          </div>
          {[1, 2, 3].map((i) => (
            <SongCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        error === "rate_limit" ? (
          <RateLimitCard usage={usage} />
        ) : (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4">
          {/* Agent explanation */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-linear-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/20">
            <Sparkles size={16} className="text-orange-400 shrink-0 mt-0.5" />
            <p className="text-sm text-zinc-300 leading-relaxed">{result.explanation}</p>
          </div>

          {/* Select all toggle */}
          <div className="flex items-center justify-between px-1">
            <button
              onClick={toggleAll}
              className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                  allSelected ? "bg-orange-500 border-orange-500" : "border-white/20"
                }`}
              >
                {allSelected && <Check size={10} className="text-white" strokeWidth={3} />}
              </div>
              {allSelected ? "Deselect all" : "Select all"}
            </button>
            <span className="text-xs text-zinc-500">
              {selected.size} of {result.songs.length} selected
            </span>
          </div>

          {/* Song cards */}
          <div className="space-y-2">
            {result.songs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                selected={selected.has(song.id)}
                onToggle={() => toggleSong(song.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Sticky bottom bar ──────────────────────────────────────── */}
      {result && !loading && (
        <div className="fixed bottom-36 md:bottom-24 left-0 right-0 flex justify-center pointer-events-none z-40 px-4">
          <div className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#18181F]/95 border border-white/10 backdrop-blur-md shadow-2xl">
            {selected.size === 0 ? (
              <p className="text-sm text-zinc-500 px-2">Select songs to add to a playlist</p>
            ) : (
              <>
                <button
                  onClick={() => setSelected(new Set())}
                  className="w-7 h-7 flex items-center justify-center rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-colors"
                  aria-label="Clear selection"
                >
                  <X size={14} />
                </button>
                <span className="text-sm text-zinc-300 font-medium">
                  {selected.size} song{selected.size === 1 ? "" : "s"}
                </span>
                <div className="relative" ref={pickerRef}>
                  <button
                    onClick={() => setPickerOpen((v) => !v)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-orange-500 to-pink-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    <ListPlus size={15} />
                    Add to playlist
                    <ChevronDown size={13} className={`transition-transform ${pickerOpen ? "rotate-180" : ""}`} />
                  </button>
                  {pickerOpen && (
                    <PlaylistPicker
                      selectedIds={selectedIds}
                      onClose={() => setPickerOpen(false)}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
