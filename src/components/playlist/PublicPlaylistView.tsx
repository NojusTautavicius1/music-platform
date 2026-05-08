"use client";

import Image from "next/image";
import { usePlayerStore } from "@/store/playerStore";
import { formatDuration } from "@/lib/format";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

type PublicSong = {
  songId: string;
  position: number;
  title: string;
  artist: string;
  album: string | null;
  duration: number;
  coverUrl: string | null;
  audioUrl: string | null;
  waveformPeaks: number[] | null;
};

type Props = {
  songs: PublicSong[];
  playlistName: string;
};

export function PublicPlaylistView({ songs, playlistName }: Props) {
  const { play, currentSong, toggle } = usePlayerStore();

  const playerSongs = songs.map((s) => ({
    id: s.songId,
    title: s.title,
    artist: s.artist,
    album: s.album,
    duration: s.duration,
    coverUrl: s.coverUrl,
    audioUrl: s.audioUrl,
    waveformPeaks: s.waveformPeaks,
  }));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handlePlay(song: PublicSong, _index: number) {
    if (currentSong?.id === song.songId) {
      toggle();
      return;
    }
    play(
      { id: song.songId, title: song.title, artist: song.artist, album: song.album, duration: song.duration, coverUrl: song.coverUrl, audioUrl: song.audioUrl, waveformPeaks: song.waveformPeaks },
      playerSongs.map((s) => ({ ...s, waveformPeaks: s.waveformPeaks })),
      `public-${playlistName}`
    );
  }

  if (songs.length === 0) {
    return <p className="px-8 py-12 text-center text-zinc-500">This playlist is empty.</p>;
  }

  return (
    <div className="px-4 md:px-8 pb-32">
      {/* Play all button */}
      <div className="py-6">
        <button
          onClick={() => handlePlay(songs[0], 0)}
          className="flex items-center gap-2 h-12 px-6 rounded-full bg-brand-orange text-white font-semibold hover:bg-brand-orange/90 transition-colors"
        >
          <Play size={16} fill="white" />
          Play all
        </button>
      </div>

      {/* Song table */}
      <div className="space-y-1">
        {songs.map((song, i) => {
          const isActive = currentSong?.id === song.songId;
          return (
            <div
              key={song.songId}
              onClick={() => handlePlay(song, i)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer group transition-colors",
                isActive ? "bg-white/10" : "hover:bg-white/5"
              )}
            >
              <span className={cn("w-6 text-center text-sm shrink-0", isActive ? "text-brand-orange" : "text-zinc-500 group-hover:hidden")}>
                {i + 1}
              </span>
              <Play size={14} className={cn("w-6 shrink-0 hidden", !isActive && "group-hover:block text-zinc-300")} />

              <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-white/5">
                {song.coverUrl && (
                  <Image src={song.coverUrl} alt={song.title} width={40} height={40} className="object-cover w-full h-full" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", isActive ? "text-brand-orange" : "text-zinc-100")}>
                  {song.title}
                </p>
                <p className="text-xs text-zinc-500 truncate">{song.artist}</p>
              </div>

              <span className="text-xs text-zinc-500 shrink-0 hidden sm:block">
                {song.album}
              </span>

              <span className="text-xs text-zinc-500 shrink-0 ml-4">
                {formatDuration(song.duration)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
