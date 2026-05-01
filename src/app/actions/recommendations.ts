"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type RecommendationSong = {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  genre: string | null;
  duration: number;
  coverUrl: string | null;
  audioUrl: string | null;
};

type SeededSong = RecommendationSong & {
  __score: number;
};

type SuggestSongsOptions = {
  seed?: string;
  limit?: number;
};

const DEFAULT_LIMIT = 10;

function hashString(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

function seededRandom(seed: string) {
  let state = hashString(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleBySeed<T>(items: T[], seed: string): T[] {
  const next = [...items];
  const rand = seededRandom(seed);
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rand() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function dedupeSongs(songs: RecommendationSong[]): RecommendationSong[] {
  const seen = new Set<string>();
  return songs.filter((song) => {
    if (seen.has(song.id)) return false;
    seen.add(song.id);
    return true;
  });
}

function stripScores(songs: SeededSong[]): RecommendationSong[] {
  return songs.map(({ __score: _score, ...song }) => song);
}

function rankAndShuffle(songs: SeededSong[], limit: number, seed: string): RecommendationSong[] {
  const ranked = [...songs].sort((left, right) => right.__score - left.__score);
  const shuffled = shuffleBySeed(ranked, seed).slice(0, limit);
  return stripScores(shuffled);
}

async function loadSongsByIds(songIds: string[]): Promise<RecommendationSong[]> {
  if (songIds.length === 0) return [];
  const songs = await prisma.song.findMany({
    where: { id: { in: songIds } },
    select: {
      id: true,
      title: true,
      artist: true,
      album: true,
      genre: true,
      duration: true,
      coverUrl: true,
      audioUrl: true,
    },
  });
  const byId = new Map(songs.map((song) => [song.id, song]));
  return songIds.flatMap((id) => {
    const song = byId.get(id);
    return song ? [song] : [];
  });
}

async function getUserIdOrThrow() {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Not authenticated");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user.id;
}

// FUTURE: replace this heuristic with the AI agent's recommendation pipeline. Keep this function's signature stable.
export async function suggestSongsForPlaylist(
  playlistId: string,
  options: SuggestSongsOptions = {}
): Promise<RecommendationSong[]> {
  const userId = await getUserIdOrThrow();
  const limit = options.limit ?? DEFAULT_LIMIT;
  const seed = options.seed ?? `${playlistId}:${Date.now()}`;

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    select: {
      id: true,
      userId: true,
      songs: {
        select: {
          song: {
            select: {
              id: true,
              artist: true,
              genre: true,
            },
          },
        },
      },
    },
  });

  if (!playlist || playlist.userId !== userId) {
    return [];
  }

  const existingSongIds = playlist.songs.map((entry) => entry.song.id);
  const existingArtists = [...new Set(playlist.songs.map((entry) => entry.song.artist))];
  const existingGenres = [...new Set(playlist.songs.map((entry) => entry.song.genre).filter((genre): genre is string => Boolean(genre)))];

  if (existingSongIds.length > 0) {
    const candidates = await prisma.song.findMany({
      where: {
        id: { notIn: existingSongIds },
        OR: [
          existingGenres.length > 0 ? { genre: { in: existingGenres } } : undefined,
          existingArtists.length > 0 ? { artist: { in: existingArtists } } : undefined,
        ].filter(Boolean) as Array<{ genre?: { in: string[] }; artist?: { in: string[] } }>,
      },
      select: {
        id: true,
        title: true,
        artist: true,
        album: true,
        genre: true,
        duration: true,
        coverUrl: true,
        audioUrl: true,
      },
      take: 40,
      orderBy: { createdAt: "desc" },
    });

    const scored: SeededSong[] = dedupeSongs(candidates).map((song) => ({
      ...song,
      __score: (existingArtists.includes(song.artist) ? 2 : 0) + (song.genre && existingGenres.includes(song.genre) ? 3 : 0),
    }));

    const ranked = rankAndShuffle(scored.slice(0, Math.max(limit * 2, limit)), limit, seed);
    return ranked;
  }

  const recentHistory = await prisma.playHistory.findMany({
    where: { userId },
    orderBy: { playedAt: "desc" },
    select: {
      song: {
        select: {
          genre: true,
        },
      },
    },
  });

  if (recentHistory.length > 0) {
    const genreCounts = new Map<string, number>();
    for (const row of recentHistory) {
      const genre = row.song.genre;
      if (!genre) continue;
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
    }

    const topGenres = [...genreCounts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 3)
      .map(([genre]) => genre);

    const songs = await prisma.song.findMany({
      where: {
        genre: { in: topGenres.length > 0 ? topGenres : [...genreCounts.keys()] },
      },
      select: {
        id: true,
        title: true,
        artist: true,
        album: true,
        genre: true,
        duration: true,
        coverUrl: true,
        audioUrl: true,
      },
      orderBy: { createdAt: "desc" },
      take: 40,
    });

    const scored: SeededSong[] = dedupeSongs(songs).map((song, index) => ({
      ...song,
      __score: songs.length - index,
    }));

    return rankAndShuffle(scored.slice(0, Math.max(limit * 2, limit)), limit, seed);
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const popularRows = await prisma.playHistory.groupBy({
    by: ["songId"],
    where: { playedAt: { gte: weekAgo } },
    _count: { songId: true },
    orderBy: { _count: { songId: "desc" } },
    take: Math.max(limit * 3, 20),
  });

  const popularSongs = await loadSongsByIds(popularRows.map((row) => row.songId));
  if (popularSongs.length > 0) {
    const scored: SeededSong[] = popularSongs.map((song, index) => ({
      ...song,
      __score: popularSongs.length - index,
    }));
    return rankAndShuffle(scored, limit, seed);
  }

  const fallbackSongs = await prisma.song.findMany({
    select: {
      id: true,
      title: true,
      artist: true,
      album: true,
      genre: true,
      duration: true,
      coverUrl: true,
      audioUrl: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const scored: SeededSong[] = fallbackSongs.map((song, index) => ({
    ...song,
    __score: fallbackSongs.length - index,
  }));

  return rankAndShuffle(scored, limit, seed);
}
