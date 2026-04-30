"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { X, GripVertical } from "lucide-react";
import { usePlayerStore } from "@/store/playerStore";
import { cn } from "@/lib/utils";

export function QueuePanel() {
  const showQueue = usePlayerStore((s) => s.showQueue);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const jumpToIndex = usePlayerStore((s) => s.jumpToIndex);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);
  const setQueue = usePlayerStore((s) => s.setQueue);
  const toggleQueue = usePlayerStore((s) => s.toggleQueue);

  const upNext = queue.slice(currentIndex + 1);

  function handleClear() {
    // Keep only the current song
    const current = queue[currentIndex];
    if (current) {
      setQueue([current]);
      // currentIndex stays 0 after clearing
      usePlayerStore.setState({ currentIndex: 0 });
    } else {
      setQueue([]);
    }
  }

  return (
    <AnimatePresence>
      {showQueue && (
        <motion.aside
          key="queue-panel"
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 32 }}
          className="fixed top-16 right-0 bottom-[calc(90px+56px)] md:bottom-[90px] w-96 bg-[#18181F] border-l border-white/5 flex flex-col z-20 overflow-hidden"
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

            {/* Next up */}
            <section className="px-5 pt-3 pb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                Next up
              </p>

              {upNext.length === 0 ? (
                <p className="text-sm text-zinc-600 py-4">
                  Nothing else queued
                </p>
              ) : (
                <div className="space-y-0.5">
                  {upNext.map((song, i) => {
                    const absoluteIndex = currentIndex + 1 + i;
                    return (
                      <QueueRow
                        key={`${song.id}-${absoluteIndex}`}
                        song={song}
                        onPlay={() => jumpToIndex(absoluteIndex)}
                        onRemove={() => removeFromQueue(absoluteIndex)}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// ─── Now Playing Row ──────────────────────────────────────────────────────────

function NowPlayingRow({ song }: { song: { title: string; artist: string; coverUrl: string | null } }) {
  return (
    <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-white/5">
      <div className="relative w-10 h-10 rounded shrink-0 overflow-hidden">
        {song.coverUrl ? (
          <Image src={song.coverUrl} alt={song.title} fill sizes="40px" className="object-cover" />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-[#8B5CF6]/30 to-[#EC4899]/30" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#8B5CF6] truncate">{song.title}</p>
        <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
      </div>
    </div>
  );
}

// ─── Queue Row ────────────────────────────────────────────────────────────────

type QueueRowProps = {
  song: { title: string; artist: string; coverUrl: string | null };
  onPlay: () => void;
  onRemove: () => void;
};

function QueueRow({ song, onPlay, onRemove }: QueueRowProps) {
  return (
    <div
      onClick={onPlay}
      className={cn(
        "flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer group",
        "hover:bg-white/5 transition-colors"
      )}
    >
      {/* Drag handle — visual only for now */}
      <GripVertical
        size={14}
        className="text-zinc-600 shrink-0 cursor-grab group-hover:text-zinc-400 transition-colors"
      />

      {/* Cover */}
      <div className="relative w-9 h-9 rounded shrink-0 overflow-hidden">
        {song.coverUrl ? (
          <Image src={song.coverUrl} alt={song.title} fill sizes="36px" className="object-cover" />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-[#8B5CF6]/30 to-[#EC4899]/30" />
        )}
      </div>

      {/* Title + artist */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-100 truncate">{song.title}</p>
        <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
      </div>

      {/* Remove */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all shrink-0"
        aria-label="Remove from queue"
      >
        <X size={14} />
      </button>
    </div>
  );
}
