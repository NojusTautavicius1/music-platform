// AI INTEGRATION POINT: replace selectSongsForGenre() with embedding-based similarity search
// once the lyrics/style model is integrated. Inputs (targetGenre, count, excludeIds) and
// outputs (Song[]) stay stable.
// Move to a daily Vercel Cron job once we hit production scale.
"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const GRADIENTS = [
  { from: "#FF5500", to: "#FF0080" }, // daily-mix-1: brand orange → magenta
  { from: "#7C3AED", to: "#2563EB" }, // daily-mix-2: violet → blue
  { from: "#059669", to: "#0891B2" }, // discover-weekly: emerald → cyan
  { from: "#DC2626", to: "#EA580C" }, // on-repeat: red → orange
  { from: "#9333EA", to: "#EC4899" },
  { from: "#0EA5E9", to: "#6366F1" },
  { from: "#F59E0B", to: "#EF4444" },
  { from: "#10B981", to: "#8B5CF6" },
] as const;

// AI INTEGRATION POINT: swap this body for embedding-based similarity search.
// Inputs (targetGenre, count, excludeIds) and outputs (Song id array) stay stable.
async function selectSongsForGenre(
  targetGenre: string,
  count: number,
  excludeIds: Set<string>
): Promise<string[]> {
  const songs = await prisma.song.findMany({
    where: {
      genre: targetGenre,
      id: { notIn: [...excludeIds] },
    },
    select: { id: true },
    orderBy: { id: "asc" }, // deterministic across re-runs
    take: count,
  });
  return songs.map((s) => s.id);
}

export async function regenerateForUser(
  userId: string,
  kinds?: string[]
): Promise<void> {
  const since60 = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [history, liked] = await Promise.all([
    prisma.playHistory.findMany({
      where: { userId, playedAt: { gte: since60 } },
      select: { songId: true, playedAt: true },
    }),
    prisma.likedSong.findMany({
      where: { userId },
      select: { songId: true },
    }),
  ]);

  const playedSongIds = new Set(history.map((h) => h.songId));
  const likedSongIds = new Set(liked.map((l) => l.songId));
  const allKnownIds = new Set([...playedSongIds, ...likedSongIds]);

  const knownSongs = await prisma.song.findMany({
    where: { id: { in: [...allKnownIds] } },
    select: { id: true, genre: true },
  });

  // Count plays per song for weighting
  const playCountBySong = new Map<string, number>();
  for (const h of history) {
    playCountBySong.set(h.songId, (playCountBySong.get(h.songId) ?? 0) + 1);
  }

  // Score genres by total play weight
  const genreScores = new Map<string, number>();
  for (const song of knownSongs) {
    if (!song.genre) continue;
    const plays = playCountBySong.get(song.id) ?? 1;
    genreScores.set(song.genre, (genreScores.get(song.genre) ?? 0) + plays);
  }

  const topGenres = [...genreScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => g)
    .slice(0, 3);

  const getGradient = (idx: number) => GRADIENTS[idx % GRADIENTS.length];

  // Build a daily mix: 60% familiar songs + 40% genre discoveries
  async function buildDailyMix(genre: string, gradientIdx: number) {
    const genreSongIds = knownSongs
      .filter((s) => s.genre === genre)
      .map((s) => s.id)
      .sort(
        (a, b) => (playCountBySong.get(b) ?? 0) - (playCountBySong.get(a) ?? 0)
      );

    const familiarCount = Math.ceil(25 * 0.6); // 15
    const unfamiliarCount = 25 - familiarCount; // 10

    const familiar = genreSongIds.slice(0, familiarCount);
    const unfamiliar = await selectSongsForGenre(
      genre,
      unfamiliarCount,
      new Set(genreSongIds)
    );

    const g = getGradient(gradientIdx);
    return { songIds: [...familiar, ...unfamiliar], gradient: g };
  }

  type MixData = {
    kind: string;
    name: string;
    description: string;
    gradientFrom: string;
    gradientTo: string;
    songIds: string[];
  };

  const wantKind = (k: string) => !kinds || kinds.includes(k);

  const mixes: MixData[] = [];

  if (wantKind("daily-mix-1") && topGenres[0]) {
    const { songIds, gradient } = await buildDailyMix(topGenres[0], 0);
    mixes.push({
      kind: "daily-mix-1",
      name: "Daily Mix 1",
      description: `Your ${topGenres[0]} favorites, mixed with new discoveries`,
      gradientFrom: gradient.from,
      gradientTo: gradient.to,
      songIds,
    });
  }

  if (wantKind("daily-mix-2") && topGenres[1]) {
    const { songIds, gradient } = await buildDailyMix(topGenres[1], 2);
    mixes.push({
      kind: "daily-mix-2",
      name: "Daily Mix 2",
      description: `A blend of ${topGenres[1]} tracks you love and haven't heard yet`,
      gradientFrom: gradient.from,
      gradientTo: gradient.to,
      songIds,
    });
  }

  if (wantKind("discover-weekly")) {
    // Discover Weekly: songs in top genres never played, up to 30
    const discoverWhere =
      topGenres.length > 0
        ? { genre: { in: topGenres }, id: { notIn: [...playedSongIds] } }
        : { id: { notIn: [...playedSongIds] } };

    const discoverSongs = await prisma.song.findMany({
      where: discoverWhere,
      select: { id: true },
      orderBy: { id: "asc" },
      take: 30,
    });

    const discoverGradient = getGradient(4);
    mixes.push({
      kind: "discover-weekly",
      name: "Discover Weekly",
      description: "Fresh tracks in your taste profile you've never heard",
      gradientFrom: discoverGradient.from,
      gradientTo: discoverGradient.to,
      songIds: discoverSongs.map((s) => s.id),
    });
  }

  if (wantKind("on-repeat")) {
    // On Repeat: top 25 most-played from last 30 days
    const recentPlayCount = new Map<string, number>();
    for (const h of history) {
      if (h.playedAt >= since30) {
        recentPlayCount.set(h.songId, (recentPlayCount.get(h.songId) ?? 0) + 1);
      }
    }

    const onRepeatIds = [...recentPlayCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([id]) => id);

    const repeatGradient = getGradient(6);
    mixes.push({
      kind: "on-repeat",
      name: "On Repeat",
      description: "The songs you can't stop playing this month",
      gradientFrom: repeatGradient.from,
      gradientTo: repeatGradient.to,
      songIds: onRepeatIds,
    });
  }

  await Promise.all(
    mixes.map((mix) =>
      prisma.generatedPlaylist.upsert({
        where: { userId_kind: { userId, kind: mix.kind } },
        update: {
          name: mix.name,
          description: mix.description,
          gradientFrom: mix.gradientFrom,
          gradientTo: mix.gradientTo,
          songIds: mix.songIds,
          generatedAt: new Date(),
        },
        create: {
          userId,
          kind: mix.kind,
          name: mix.name,
          description: mix.description,
          gradientFrom: mix.gradientFrom,
          gradientTo: mix.gradientTo,
          songIds: mix.songIds,
        },
      })
    )
  );
}

/** Called from the client (fire-and-forget) to lazily refresh stale mixes. */
export async function triggerMixRefresh(kinds?: string[]): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) return;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return;

  await regenerateForUser(user.id, kinds);
}
