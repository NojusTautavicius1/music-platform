import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const visiblePlayWhere = {
  user: {
    preferences: {
      showActivity: true,
    },
  },
} as const;

/** Total global plays for a single song — cached 5 min, tagged 'play-counts'. */
export const getSongPlayCount = unstable_cache(
  async (songId: string): Promise<number> => {
    return prisma.playHistory.count({
      where: {
        songId,
        ...visiblePlayWhere,
      },
    });
  },
  ["song-play-count"],
  { revalidate: 300, tags: ["play-counts"] }
);

/**
 * Batch fetch play counts for a list of song IDs.
 * Returns a Map<songId, count>. Not individually cached — call inside a
 * server component so the whole page benefits from full-route caching.
 */
export async function getSongPlayCounts(
  songIds: string[]
): Promise<Map<string, number>> {
  if (songIds.length === 0) return new Map();
  const rows = await prisma.playHistory.groupBy({
    by: ["songId"],
    where: {
      songId: { in: songIds },
      ...visiblePlayWhere,
    },
    _count: { songId: true },
  });
  return new Map(rows.map((r) => [r.songId, r._count.songId]));
}

export async function getPlaylistPlayCounts(
  playlistIds: string[]
): Promise<Map<string, number>> {
  if (playlistIds.length === 0) return new Map();

  const playlists = await prisma.playlist.findMany({
    where: { id: { in: playlistIds } },
    select: {
      id: true,
      songs: { select: { songId: true } },
    },
  });

  const songsByPlaylist = new Map(
    playlists.map((playlist) => [
      playlist.id,
      playlist.songs.map((song) => song.songId),
    ])
  );
  const songIds = [...new Set(playlists.flatMap((playlist) => playlist.songs.map((song) => song.songId)))];
  const songCounts = await getSongPlayCounts(songIds);

  return new Map(
    playlistIds.map((playlistId) => {
      const total = (songsByPlaylist.get(playlistId) ?? []).reduce(
        (sum, songId) => sum + (songCounts.get(songId) ?? 0),
        0
      );
      return [playlistId, total] as const;
    })
  );
}

/** Total global plays for all songs in a playlist. */
export const getPlaylistPlayCount = unstable_cache(
  async (playlistId: string): Promise<number> => {
    const ps = await prisma.playlistSong.findMany({
      where: { playlistId },
      select: { songId: true },
    });
    if (ps.length === 0) return 0;
    const songCounts = await getSongPlayCounts(ps.map((p) => p.songId));
    return ps.reduce((sum, row) => sum + (songCounts.get(row.songId) ?? 0), 0);
  },
  ["playlist-play-count"],
  { revalidate: 300, tags: ["play-counts"] }
);

/** Total global plays for all songs by a given artist. */
export const getArtistPlayCount = unstable_cache(
  async (artist: string): Promise<number> => {
    const songs = await prisma.song.findMany({
      where: { artist },
      select: { id: true },
    });
    if (songs.length === 0) return 0;
    const songCounts = await getSongPlayCounts(songs.map((s) => s.id));
    return songs.reduce((sum, song) => sum + (songCounts.get(song.id) ?? 0), 0);
  },
  ["artist-play-count"],
  { revalidate: 300, tags: ["play-counts"] }
);

export async function getArtistMonthlyListeners(
  artists: string[]
): Promise<Map<string, number>> {
  if (artists.length === 0) return new Map();

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const rows = await prisma.playHistory.findMany({
    where: {
      playedAt: { gte: since },
      ...visiblePlayWhere,
      song: { artist: { in: artists } },
    },
    select: {
      userId: true,
      song: { select: { artist: true } },
    },
  });

  const listenersByArtist = new Map<string, Set<string>>();
  for (const row of rows) {
    const artist = row.song.artist;
    const listeners = listenersByArtist.get(artist) ?? new Set<string>();
    listeners.add(row.userId);
    listenersByArtist.set(artist, listeners);
  }

  return new Map(
    artists.map((artist) => [artist, listenersByArtist.get(artist)?.size ?? 0] as const)
  );
}

/** Top N songs globally by play count in the last `days` days. */
export async function getTrendingSongs(days: number, take: number) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await prisma.playHistory.groupBy({
    by: ["songId"],
    where: {
      playedAt: { gte: since },
      ...visiblePlayWhere,
    },
    _count: { songId: true },
    orderBy: { _count: { songId: "desc" } },
    take,
  });
  if (rows.length === 0) return [];
  const songs = await prisma.song.findMany({
    where: { id: { in: rows.map((r) => r.songId) } },
    select: {
      id: true,
      title: true,
      artist: true,
      coverUrl: true,
      audioUrl: true,
      waveformPeaks: true,
      duration: true,
    },
  });
  const songMap = new Map(songs.map((s) => [s.id, s]));
  return rows.flatMap((r) => {
    const song = songMap.get(r.songId);
    return song ? [{ song, playCount: r._count.songId }] : [];
  });
}
