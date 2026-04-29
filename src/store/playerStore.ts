import { create } from "zustand";

export type PlayerSong = {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  duration: number;
  coverUrl: string | null;
  audioUrl: string | null;
};

type PlayerStore = {
  currentSong: PlayerSong | null;
  queue: PlayerSong[];
  isPlaying: boolean;
  play: (song: PlayerSong, queue?: PlayerSong[]) => void;
  pause: () => void;
  resume: () => void;
  toggle: () => void;
};

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentSong: null,
  queue: [],
  isPlaying: false,
  play: (song, queue) =>
    set({ currentSong: song, queue: queue ?? get().queue, isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),
  toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),
}));
