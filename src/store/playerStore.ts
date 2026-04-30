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

type PlayerStore = {
  currentSong: PlayerSong | null;
  queue: PlayerSong[];
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  lastVolume: number;
  progress: number;
  duration: number;
  seekRequest: number | null;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  showLyrics: boolean;
  showQueue: boolean;

  play: (song: PlayerSong, queue?: PlayerSong[]) => void;
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
};

export const usePlayerStore = create<PlayerStore>()(
  subscribeWithSelector((set, get) => ({
    currentSong: null,
    queue: [],
    currentIndex: 0,
    isPlaying: false,
    volume: 0.7,
    isMuted: false,
    lastVolume: 0.7,
    progress: 0,
    duration: 0,
    seekRequest: null,
    shuffleEnabled: false,
    repeatMode: "off",
    showLyrics: false,
    showQueue: false,

    play: (song, queue) => {
      const q = queue ?? get().queue;
      const idx = q.findIndex((s) => s.id === song.id);
      set({
        currentSong: song,
        queue: q,
        currentIndex: idx >= 0 ? idx : 0,
        isPlaying: true,
        progress: 0,
        duration: 0,
        seekRequest: null,
      });
    },

    pause: () => set({ isPlaying: false }),

    togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

    toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),

    next: () => {
      const { queue, currentIndex, repeatMode, shuffleEnabled } = get();
      if (queue.length === 0) return;

      let nextIdx: number;
      if (shuffleEnabled) {
        nextIdx = Math.floor(Math.random() * queue.length);
      } else {
        nextIdx = currentIndex + 1;
        if (nextIdx >= queue.length) {
          if (repeatMode === "all") {
            nextIdx = 0;
          } else {
            set({ isPlaying: false, progress: 0 });
            return;
          }
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

    toggleShuffle: () => set((s) => ({ shuffleEnabled: !s.shuffleEnabled })),

    cycleRepeat: () =>
      set((s) => ({
        repeatMode:
          s.repeatMode === "off" ? "all" : s.repeatMode === "all" ? "one" : "off",
      })),

    toggleLyrics: () => set((s) => ({ showLyrics: !s.showLyrics })),

    toggleQueue: () => set((s) => ({ showQueue: !s.showQueue })),

    setQueue: (queue) => set({ queue }),

    removeFromQueue: (index) => {
      const { queue, currentIndex } = get();
      const next = queue.filter((_, i) => i !== index);
      const newCurrentIndex = index < currentIndex ? currentIndex - 1 : currentIndex;
      set({ queue: next, currentIndex: newCurrentIndex });
    },

    jumpToIndex: (index) => {
      const { queue } = get();
      const song = queue[index];
      if (song) {
        set({ currentSong: song, currentIndex: index, isPlaying: true, progress: 0, duration: 0, seekRequest: null });
      }
    },

    setProgress: (p) => set({ progress: p }),

    setDuration: (d) => set({ duration: d }),

    clearSeekRequest: () => set({ seekRequest: null }),
  }))
);
