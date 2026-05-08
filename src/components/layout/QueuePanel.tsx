"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { X, GripVertical, RotateCcw, Sparkles } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { usePlayerStore, type PlayerSong } from "@/store/playerStore";
import { useDndSensors } from "@/hooks/useDndSensors";
import { cn } from "@/lib/utils";
import { formatPlayCount } from "@/lib/format";

export function QueuePanel() {
  const showQueue = usePlayerStore((s) => s.showQueue);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const queue = usePlayerStore((s) => s.queue);
  const sourceQueue = usePlayerStore((s) => s.sourceQueue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const shuffleEnabled = usePlayerStore((s) => s.shuffleEnabled);
  const shuffleHistory = usePlayerStore((s) => s.shuffleHistory);
  const jumpToIndex = usePlayerStore((s) => s.jumpToIndex);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const reorderQueue = usePlayerStore((s) => s.reorderQueue);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const toggleQueue = usePlayerStore((s) => s.toggleQueue);
  const resetShuffleHistory = usePlayerStore((s) => s.resetShuffleHistory);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const sensors = useDndSensors();

  type SimilarSong = { id: string; title: string; artist: string; coverUrl: string | null; audioUrl: string | null; duration: number };
  const [similarSongs, setSimilarSongs] = useState<SimilarSong[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!currentSong) { setSimilarSongs([]); return; }
    let cancelled = false;
    fetch(`/api/songs/${currentSong.id}/similar`)
      .then((r) => r.json())
      .then((data: { songs: SimilarSong[] }) => { if (!cancelled) setSimilarSongs(data.songs ?? []); })
      .catch(() => { if (!cancelled) setSimilarSongs([]); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong?.id]);

  const upNext = queue.slice(currentIndex + 1);
  const totalSongs = sourceQueue.length > 0 ? sourceQueue.length : queue.length;
  const playedCount = shuffleHistory.size;

  function handleClear() {
    const current = queue[currentIndex];
    if (current) {
      setQueue([current]);
      usePlayerStore.setState({ currentIndex: 0 });
    } else {
      setQueue([]);
    }
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveDragId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const fromRelative = upNext.findIndex((s, i) => uniqueKey(s, currentIndex + 1 + i) === String(active.id));
    const toRelative   = upNext.findIndex((s, i) => uniqueKey(s, currentIndex + 1 + i) === String(over.id));
    if (fromRelative < 0 || toRelative < 0) return;
    reorderQueue(currentIndex + 1 + fromRelative, currentIndex + 1 + toRelative);
  }

  // Each queue row needs a stable unique key that survives reorder
  // We key by both songId and its position so the same song appearing twice
  // in the queue still gets distinct DnD items.
  function uniqueKey(song: PlayerSong, absoluteIndex: number) {
    return `${song.id}::${absoluteIndex}`;
  }

  const activeSong = activeDragId
    ? upNext.find((s, i) => uniqueKey(s, currentIndex + 1 + i) === activeDragId) ?? null
    : null;

  return (
    <AnimatePresence>
      {showQueue && (
        <motion.aside
          key="queue-panel"
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="fixed top-16 right-0 bottom-[calc(90px+56px)] md:bottom-[90px] w-full sm:w-96 bg-[#18181F] border-l border-white/5 flex flex-col z-20 overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between shrink-0 border-b border-white/5">
            <h2 className="text-base font-bold text-zinc-100">Queue</h2>
            <div className="flex items-center gap-2">
              {upNext.length > 0 && (
                <button
                  onClick={handleClear}
                  className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5"
                >
                  Clear queue
                </button>
              )}
              <button
                onClick={toggleQueue}
                className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                aria-label="Close queue"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Shuffle progress banner */}
          {shuffleEnabled && totalSongs > 1 && (
            <div className="px-5 py-2.5 flex items-center justify-between bg-white/[0.03] border-b border-white/5 shrink-0">
              <p className="text-xs text-zinc-500">
                Shuffle:{" "}
                <span className="text-brand-orange font-medium">{playedCount}</span>
                {" of "}
                <span className="font-medium text-zinc-400">{totalSongs}</span>
                {" songs played"}
              </p>
              <button
                onClick={resetShuffleHistory}
                className="w-5 h-5 flex items-center justify-center text-zinc-600 hover:text-brand-orange transition-colors"
                aria-label="Reshuffle from beginning"
                title="Reshuffle"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {/* Now playing */}
            {currentSong && (
              <section className="px-5 pt-4 pb-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                  Now playing
                </p>
                <NowPlayingRow song={currentSong} />
              </section>
            )}

            {/* Similar tracks */}
            {similarSongs.length > 0 && (
              <section className="px-5 pt-3 pb-2 border-t border-white/5">
                <div className="flex items-center gap-1.5 mb-3">
                  <Sparkles size={12} className="text-brand-orange" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Similar tracks</p>
                </div>
                <div className="space-y-0.5">
                  {similarSongs.slice(0, 5).map((song) => (
                    <SimilarRow key={song.id} song={song} onAdd={() => {
                      const { queue, setQueue } = usePlayerStore.getState();
                      const playerSong: PlayerSong = { id: song.id, title: song.title, artist: song.artist, album: null, duration: song.duration, coverUrl: song.coverUrl, audioUrl: song.audioUrl };
                      setQueue([...queue, playerSong]);
                    }} />
                  ))}
                </div>
              </section>
            )}

            {/* Next up */}
            <section className="px-5 pt-3 pb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                Next up
              </p>

              {upNext.length === 0 ? (
                <p className="text-sm text-zinc-600 py-4">Nothing else queued</p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={upNext.map((s, i) => uniqueKey(s, currentIndex + 1 + i))}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-0.5">
                      {upNext.map((song, i) => {
                        const absoluteIndex = currentIndex + 1 + i;
                        const key = uniqueKey(song, absoluteIndex);
                        return (
                          <QueueRow
                            key={key}
                            id={key}
                            song={song}
                            onPlay={() => jumpToIndex(absoluteIndex)}
                            onRemove={() => removeFromQueue(absoluteIndex)}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>

                  <DragOverlay dropAnimation={null}>
                    {activeSong ? (
                      <QueueRow
                        id="__overlay__"
                        song={activeSong}
                        onPlay={() => {}}
                        onRemove={() => {}}
                        overlay
                      />
                    ) : null}
                  </DragOverlay>
                </DndContext>
              )}
            </section>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// ─── Now Playing Row ──────────────────────────────────────────────────────────

function NowPlayingRow({ song }: { song: { title: string; artist: string; coverUrl: string | null; playCount?: number } }) {
  return (
    <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-white/5">
      <div className="relative w-10 h-10 rounded shrink-0 overflow-hidden">
        {song.coverUrl ? (
          <Image src={song.coverUrl} alt={song.title} fill sizes="40px" className="object-cover" />
        ) : (
          <div className="w-full h-full bg-[#0A0A0F] border border-white/5" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-brand-orange truncate">{song.title}</p>
        <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
        <p className="text-xs text-zinc-600 mt-0.5">{formatPlayCount(song.playCount ?? 0)} plays</p>
      </div>
    </div>
  );
}

// ─── Queue Row ────────────────────────────────────────────────────────────────

type QueueRowProps = {
  id: string;
  song: PlayerSong;
  onPlay: () => void;
  onRemove: () => void;
  overlay?: boolean;
};

function QueueRow({ id, song, onPlay, onRemove, overlay = false }: QueueRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: overlay });

  const style: React.CSSProperties = overlay
    ? {}
    : { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      {...(overlay ? {} : attributes)}
      onClick={overlay ? undefined : onPlay}
      className={cn(
        "flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer group",
        "hover:bg-white/5 transition-colors",
        isDragging && "opacity-30",
        overlay && "opacity-90 bg-[#18181F] shadow-xl ring-1 ring-white/10 rounded-lg cursor-grabbing"
      )}
    >
      {/* Drag handle */}
      <button
        {...(overlay ? {} : listeners)}
        className="text-zinc-600 shrink-0 touch-none cursor-grab active:cursor-grabbing group-hover:text-zinc-400 transition-colors"
        aria-label="Drag to reorder"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={14} />
      </button>

      {/* Cover */}
      <div className="relative w-9 h-9 rounded shrink-0 overflow-hidden">
        {song.coverUrl ? (
          <Image src={song.coverUrl} alt={song.title} fill sizes="36px" className="object-cover" />
        ) : (
          <div className="w-full h-full bg-[#0A0A0F] border border-white/5" />
        )}
      </div>

      {/* Title + artist */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-100 truncate">{song.title}</p>
        <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-600 truncate">
          <span className="inline-block w-2 h-2 rounded-full bg-zinc-600/70" />
          <span>{formatPlayCount(song.playCount ?? 0)} plays</span>
        </p>
      </div>

      {/* Remove */}
      {!overlay && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all shrink-0"
          aria-label="Remove from queue"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// ─── Similar Row ──────────────────────────────────────────────────────────────

function SimilarRow({
  song,
  onAdd,
}: {
  song: { id: string; title: string; artist: string; coverUrl: string | null; duration: number };
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors group">
      <div className="relative w-9 h-9 rounded shrink-0 overflow-hidden">
        {song.coverUrl ? (
          <Image src={song.coverUrl} alt={song.title} fill sizes="36px" className="object-cover" />
        ) : (
          <div className="w-full h-full bg-[#0A0A0F] border border-white/5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-100 truncate">{song.title}</p>
        <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
      </div>
      <button
        onClick={onAdd}
        title="Add to queue"
        className="shrink-0 w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-brand-orange transition-colors opacity-0 group-hover:opacity-100"
        aria-label={`Add ${song.title} to queue`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  );
}
