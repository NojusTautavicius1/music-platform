"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SearchResult = {
  id: string;
  title: string;
  subtitle?: string | null;
  coverUrl?: string | null;
  audioUrl?: string | null;
  duration?: number | null;
  album?: string | null;
};

type GlobalSearchResult = {
  songs: SearchResult[];
  playlists: SearchResult[];
  artists: SearchResult[];
  ownPlaylists: SearchResult[];
};

export async function globalSearch(query: string): Promise<GlobalSearchResult> {
  const session = await auth();
  if (!session?.user?.email) return { songs: [], playlists: [], artists: [], ownPlaylists: [] };

  const trimmed = query.trim();
  if (!trimmed) return { songs: [], playlists: [], artists: [], ownPlaylists: [] };

  const [songs, playlists, artists, user] = await Promise.all([
    prisma.song.findMany({
      where: {
        OR: [
          { title: { contains: trimmed, mode: "insensitive" } },
          { artist: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      take: 5,
      select: {
        id: true,
        title: true,
        artist: true,
        coverUrl: true,
        audioUrl: true,
        duration: true,
        album: true,
      },
    }),
    prisma.playlist.findMany({
      where: { name: { contains: trimmed, mode: "insensitive" } },
      take: 5,
      select: { id: true, name: true, description: true, coverUrl: true },
    }),
    prisma.song.findMany({
      where: { artist: { contains: trimmed, mode: "insensitive" } },
      distinct: ["artist"],
      take: 3,
      select: { artist: true },
    }),
    prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    }),
  ]);

  const ownPlaylists = user
    ? await prisma.playlist.findMany({
        where: {
          userId: user.id,
          name: { contains: trimmed, mode: "insensitive" },
        },
        take: 3,
        select: { id: true, name: true, description: true, coverUrl: true },
      })
    : [];

  return {
    songs: songs.map((s) => ({
      id: s.id,
      title: s.title,
      subtitle: s.artist,
      coverUrl: s.coverUrl,
      audioUrl: s.audioUrl,
      duration: s.duration,
      album: s.album,
    })),
    playlists: playlists.map((p) => ({
      id: p.id,
      title: p.name,
      subtitle: p.description,
      coverUrl: p.coverUrl,
    })),
    artists: artists.map((a) => ({
      id: a.artist,
      title: a.artist,
    })),
    ownPlaylists: ownPlaylists.map((p) => ({
      id: p.id,
      title: p.name,
      subtitle: p.description,
      coverUrl: p.coverUrl,
    })),
  };
}

export async function getRecentPlays(): Promise<SearchResult[]> {
  const session = await auth();
  if (!session?.user?.email) return [];

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return [];

  const rows = await prisma.playHistory.findMany({
    where: { userId: user.id },
    orderBy: { playedAt: "desc" },
    distinct: ["songId"],
    take: 5,
    select: {
      song: {
        select: {
          id: true,
          title: true,
          artist: true,
          coverUrl: true,
          audioUrl: true,
          duration: true,
          album: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.song.id,
    title: row.song.title,
    subtitle: row.song.artist,
    coverUrl: row.song.coverUrl,
    audioUrl: row.song.audioUrl,
    duration: row.song.duration,
    album: row.song.album,
  }));
}
