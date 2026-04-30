import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export type PlayerSong = {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  duration: number;
  coverUrl: string | null;
  audioUrl: string | null;
};

export type RepeatMode = "off" | "one" | "all";

// Fisher-Yates in-place shuffle — O(n), unbiased
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Smart shuffle algorithm ──────────────────────────────────────────────────
//
// When shuffle is ON the queue is rearranged so the current song sits at index 0
// and the remaining songs follow in a random order. We advance linearly through
// this pre-shuffled queue rather than picking random indices each time, which
// guarantees every song is heard before any is repeated.
//
// shuffleHistory tracks the IDs of songs we have already heard in the current
// cycle. When history.size === sourceQueue.length the entire source has been
// played. At that point:
//   • repeatMode "all"  → reshuffle and start a fresh cycle (history resets)
//   • anything else     → stop playback
//
// sourceQueue always stores the natural (unshuffled) order so we can:
//   a) restore it when shuffle is toggled off
//   b) use it as the pool when reshuffling for a new cycle
// ─────────────────────────────────────────────────────────────────────────────

type PlayerStore = {
  currentSong: PlayerSong | null;
  queue: PlayerSong[];
  sourceQueue: PlayerSong[];    // natural order — never reordered, only replaced
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  lastVolume: number;
  progress: number;
  duration: number;
  seekRequest: number | null;
  shuffleEnabled: boolean;
  shuffleHistory: Set<string>;  // IDs heard in current shuffle cycle
  shuffleSourceId: string | null;
  repeatMode: RepeatMode;
  showLyrics: boolean;
  showQueue: boolean;

  play: (song: PlayerSong, queue?: PlayerSong[], sourceId?: string) => void;
  pause: () => void;
  togglePlay: () => void;
  /** @deprecated use togglePlay */
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (progress: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleLyrics: () => void;
  toggleQueue: () => void;
  setQueue: (queue: PlayerSong[]) => void;
  removeFromQueue: (index: number) => void;
  jumpToIndex: (index: number) => void;
  setProgress: (p: number) => void;
  setDuration: (d: number) => void;
  clearSeekRequest: () => void;
  resetShuffleHistory: () => void;
};

export const usePlayerStore = create<PlayerStore>()(
  subscribeWithSelector((set, get) => ({
    currentSong: null,
    queue: [],
    sourceQueue: [],
    currentIndex: 0,
    isPlaying: false,
    volume: 0.7,
    isMuted: false,
    lastVolume: 0.7,
    progress: 0,
    duration: 0,
    seekRequest: null,
    shuffleEnabled: false,
    shuffleHistory: new Set(),
    shuffleSourceId: null,
    repeatMode: "off",
    showLyrics: false,
    showQueue: false,

    play: (song, queue, sourceId) => {
      const { shuffleEnabled } = get();
      // Use the passed queue as the natural order; fall back to existing sourceQueue
      const natural = queue ?? (get().sourceQueue.length > 0 ? get().sourceQueue : get().queue);

      let finalQueue: PlayerSong[];
      let finalIndex: number;

      if (shuffleEnabled && natural.length > 1) {
        // Place clicked song first, shuffle the rest
        const others = shuffleArray(natural.filter((s) => s.id !== song.id));
        finalQueue = [song, ...others];
        finalIndex = 0;
      } else {
        finalQueue = natural;
        finalIndex = natural.findIndex((s) => s.id === song.id);
        if (finalIndex < 0) finalIndex = 0;
      }

      set({
        currentSong: song,
        queue: finalQueue,
        sourceQueue: natural,
        currentIndex: finalIndex,
        isPlaying: true,
        progress: 0,
        duration: 0,
        seekRequest: null,
        shuffleHistory: new Set([song.id]),
        shuffleSourceId: sourceId ?? null,
      });
    },

    pause: () => set({ isPlaying: false }),

    togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

    toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),

    next: () => {
      const { queue, currentIndex, repeatMode, shuffleEnabled, shuffleHistory, sourceQueue } = get();
      if (queue.length === 0) return;

      if (shuffleEnabled) {
        const nextIdx = currentIndex + 1;

        if (nextIdx < queue.length) {
          // Advance linearly through the pre-shuffled queue
          const nextSong = queue[nextIdx];
          const newHistory = new Set(shuffleHistory);
          newHistory.add(nextSong.id);
          set({
            currentSong: nextSong,
            currentIndex: nextIdx,
            isPlaying: true,
            progress: 0,
            duration: 0,
            seekRequest: null,
            shuffleHistory: newHistory,
          });
        } else {
          // End of shuffled queue — full cycle complete
          if (repeatMode === "all") {
            // Reshuffle for a new cycle; current song seeds the new session
            const current = queue[currentIndex];
            const src = sourceQueue.length > 0 ? sourceQueue : queue;
            const others = shuffleArray(src.filter((s) => s.id !== current?.id));
            const newQueue = current ? [current, ...others] : others;
            const firstNext = newQueue[1] ?? newQueue[0];
            const nextSongIdx = newQueue.length > 1 ? 1 : 0;
            const newHistory = new Set<string>();
            if (current) newHistory.add(current.id);
            if (firstNext && firstNext.id !== current?.id) newHistory.add(firstNext.id);
            set({
              queue: newQueue,
              currentIndex: nextSongIdx,
              currentSong: firstNext ?? current ?? null,
              isPlaying: !!(firstNext ?? current),
              progress: 0,
              duration: 0,
              seekRequest: null,
              shuffleHistory: newHistory,
            });
          } else {
            set({ isPlaying: false, progress: 0 });
          }
        }
        return;
      }

      // Non-shuffle path
      let nextIdx = currentIndex + 1;
      if (nextIdx >= queue.length) {
        if (repeatMode === "all") {
          nextIdx = 0;
        } else {
          set({ isPlaying: false, progress: 0 });
          return;
        }
      }
      const nextSong = queue[nextIdx];
      set({ currentSong: nextSong, currentIndex: nextIdx, isPlaying: true, progress: 0, duration: 0, seekRequest: null });
    },

    previous: () => {
      const { queue, currentIndex, progress, duration } = get();
      const elapsedSeconds = progress * duration;

      if (elapsedSeconds > 3) {
        set({ seekRequest: 0, progress: 0 });
        return;
      }

      const prevIdx = Math.max(0, currentIndex - 1);
      const prevSong = queue[prevIdx];
      if (prevSong) {
        // Don't modify shuffleHistory — going back shouldn't "un-listen"
        set({ currentSong: prevSong, currentIndex: prevIdx, isPlaying: true, progress: 0, duration: 0, seekRequest: null });
      }
    },

    seek: (progress) => {
      const { duration } = get();
      set({ seekRequest: progress * duration, progress });
    },

    setVolume: (v) => {
      const clamped = Math.max(0, Math.min(1, v));
      set({ volume: clamped, isMuted: clamped === 0, lastVolume: clamped > 0 ? clamped : get().lastVolume });
    },

    toggleMute: () => {
      const { isMuted, volume, lastVolume } = get();
      if (isMuted || volume === 0) {
        const restore = lastVolume > 0 ? lastVolume : 0.7;
        set({ volume: restore, isMuted: false });
      } else {
        set({ lastVolume: volume, volume: 0, isMuted: true });
      }
    },

    toggleShuffle: () => {
      const { shuffleEnabled, queue, sourceQueue, currentSong, currentIndex } = get();

      if (!shuffleEnabled) {
        // Turning shuffle ON
        if (queue.length <= 1 || !currentSong) {
          set({
            shuffleEnabled: true,
            shuffleHistory: currentSong ? new Set([currentSong.id]) : new Set(),
          });
          return;
        }
        const natural = sourceQueue.length > 0 ? sourceQueue : queue;
        const current = queue[currentIndex];
        const others = shuffleArray(natural.filter((s) => s.id !== current?.id));
        set({
          shuffleEnabled: true,
          sourceQueue: natural,
          queue: current ? [current, ...others] : others,
          currentIndex: 0,
          shuffleHistory: new Set(current ? [current.id] : []),
        });
      } else {
        // Turning shuffle OFF — restore natural order, keep current song
        const src = sourceQueue.length > 0 ? sourceQueue : queue;
        const naturalIdx = currentSong ? src.findIndex((s) => s.id === currentSong.id) : 0;
        set({
          shuffleEnabled: false,
          queue: src,
          currentIndex: naturalIdx >= 0 ? naturalIdx : 0,
          shuffleHistory: new Set(),
        });
      }
    },

    cycleRepeat: () =>
      set((s) => ({
        repeatMode:
          s.repeatMode === "off" ? "all" : s.repeatMode === "all" ? "one" : "off",
      })),

    toggleLyrics: () => set((s) => ({ showLyrics: !s.showLyrics })),

    toggleQueue: () => set((s) => ({ showQueue: !s.showQueue })),

    setQueue: (queue) => {
      const { shuffleEnabled, shuffleHistory, currentIndex, queue: currentQueue } = get();

      if (!shuffleEnabled) {
        set({ queue, sourceQueue: queue });
        return;
      }

      // Shuffle is on: find truly new songs (not in the shuffled queue yet and not played)
      // Append them to the unplayed portion so they're eligible in this cycle
      const existingIds = new Set(currentQueue.map((s) => s.id));
      const newUnplayed = queue.filter((s) => !existingIds.has(s.id) && !shuffleHistory.has(s.id));
      const played = currentQueue.slice(0, currentIndex + 1);
      const upcoming = currentQueue.slice(currentIndex + 1);
      set({
        queue: [...played, ...upcoming, ...shuffleArray(newUnplayed)],
        sourceQueue: queue,
      });
    },

    removeFromQueue: (index) => {
      const { queue, currentIndex } = get();
      const next = queue.filter((_, i) => i !== index);
      const newCurrentIndex = index < currentIndex ? currentIndex - 1 : currentIndex;
      set({ queue: next, currentIndex: newCurrentIndex });
    },

    jumpToIndex: (index) => {
      const { queue, shuffleEnabled, shuffleHistory } = get();
      const song = queue[index];
      if (!song) return;
      const newHistory = shuffleEnabled ? new Set([...shuffleHistory, song.id]) : new Set<string>();
      set({
        currentSong: song,
        currentIndex: index,
        isPlaying: true,
        progress: 0,
        duration: 0,
        seekRequest: null,
        ...(shuffleEnabled ? { shuffleHistory: newHistory } : {}),
      });
    },

    setProgress: (p) => set({ progress: p }),

    setDuration: (d) => set({ duration: d }),

    clearSeekRequest: () => set({ seekRequest: null }),

    resetShuffleHistory: () => {
      const { currentSong, sourceQueue, queue } = get();
      if (!currentSong) return;
      const src = sourceQueue.length > 0 ? sourceQueue : queue;
      const others = shuffleArray(src.filter((s) => s.id !== currentSong.id));
      set({
        queue: [currentSong, ...others],
        currentIndex: 0,
        shuffleHistory: new Set([currentSong.id]),
      });
    },
  }))
);
