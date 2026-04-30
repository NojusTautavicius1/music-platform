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
  progress: number;
  duration: number;
  seekRequest: number | null;
  shuffleEnabled: boolean;
  repeatMode: RepeatMode;
  showLyrics: boolean;

  play: (song: PlayerSong, queue?: PlayerSong[]) => void;
  pause: () => void;
  togglePlay: () => void;
  /** @deprecated use togglePlay */
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (progress: number) => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  toggleLyrics: () => void;
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
    progress: 0,
    duration: 0,
    seekRequest: null,
    shuffleEnabled: false,
    repeatMode: "off",
    showLyrics: false,

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
        // Restart the current song by seeking to 0
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

    setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),

    toggleShuffle: () => set((s) => ({ shuffleEnabled: !s.shuffleEnabled })),

    cycleRepeat: () =>
      set((s) => ({
        repeatMode:
          s.repeatMode === "off" ? "all" : s.repeatMode === "all" ? "one" : "off",
      })),

    toggleLyrics: () => set((s) => ({ showLyrics: !s.showLyrics })),

    setProgress: (p) => set({ progress: p }),

    setDuration: (d) => set({ duration: d }),

    clearSeekRequest: () => set({ seekRequest: null }),
  }))
);
