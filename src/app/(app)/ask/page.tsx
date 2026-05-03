"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Sparkles, Play, Pause, Plus, Music2, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { askAgent, type AgentResponse, type AgentSong } from "@/lib/ai/agentClient";
import { usePlayerStore } from "@/store/playerStore";
import { CreatePlaylistDialog } from "@/components/playlist/CreatePlaylistDialog";

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
      <div className="w-16 h-16 rounded-lg bg-white/10 shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-4 w-1/2 bg-white/10 rounded" />
        <div className="h-3 w-1/3 bg-white/10 rounded" />
        <div className="h-3 w-3/4 bg-white/10 rounded" />
      </div>
    </div>
  );
}

function SongCard({ song }: { song: AgentSong }) {
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
    <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 ${
      isThisSong
        ? "bg-orange-500/10 border-orange-500/30"
        : "bg-white/5 border-white/5 hover:bg-white/8 hover:border-white/10"
    }`}>
      <div className="relative shrink-0">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/10">
          {song.coverUrl ? (
            <Image src={song.coverUrl} alt={song.title} width={64} height={64} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music2 size={24} className="text-zinc-600" />
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
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shadow-lg">
            {isThisPlaying ? (
              <Pause size={14} className="text-white" />
            ) : (
              <Play size={14} className="text-white ml-0.5" />
            )}
          </div>
        </button>
      </div>

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

export default function AskPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createPlaylistOpen, setCreatePlaylistOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % EXAMPLE_QUERIES.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    router.replace(`/ask?q=${encodeURIComponent(trimmed)}`, { scroll: false });

    try {
      const data = await askAgent(trimmed);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [loading, router]);

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
    handleSubmit(query);
  }

  function onChipClick(chip: string) {
    setQuery(chip);
    handleSubmit(chip);
  }

  return (
    <div className="min-h-full p-4 md:p-8 pb-24 max-w-3xl mx-auto flex flex-col">
      {/* Hero */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium mb-4">
          <Sparkles size={12} />
          AI-powered recommendations
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 bg-linear-to-r from-orange-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          Ask anything
        </h1>
        <p className="text-zinc-400 text-base">
          Tell us a vibe, mood, activity, or song you love. We&apos;ll find what fits.
        </p>
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
                handleSubmit(query);
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
            <span>Thinking<span className="animate-pulse">…</span></span>
          </div>
          {[1, 2, 3].map((i) => <SongCardSkeleton key={i} />)}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4">
          {/* Agent explanation */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-linear-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/20">
            <Sparkles size={16} className="text-orange-400 shrink-0 mt-0.5" />
            <p className="text-sm text-zinc-300 leading-relaxed">{result.explanation}</p>
          </div>

          {/* Song cards */}
          <div className="space-y-3">
            {result.songs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>

          {/* Add all to playlist */}
          <div className="pt-2">
            <CreatePlaylistDialog
              open={createPlaylistOpen}
              onOpenChange={setCreatePlaylistOpen}
              initialSongIds={result.songs.map((s) => s.id)}
            >
              <button
                onClick={() => setCreatePlaylistOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 text-zinc-400 text-sm hover:border-orange-500/30 hover:text-orange-400 hover:bg-orange-500/5 transition-all duration-200"
              >
                <Plus size={16} />
                Add all to a new playlist
              </button>
            </CreatePlaylistDialog>
          </div>
        </div>
      )}
    </div>
  );
}
