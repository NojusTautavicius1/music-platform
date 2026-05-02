import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BrowseSongsView } from "@/components/browse/BrowseSongsView";
import { getSongPlayCounts } from "@/lib/playCounts";

type Props = {
  searchParams: Promise<{ genre?: string; sort?: string; q?: string; page?: string; mood?: string; key?: string; bpmMin?: string; bpmMax?: string }>;
};

const AUDIO_SELECT = {
  id: true,
  title: true,
  artist: true,
  album: true,
  genre: true,
  duration: true,
  coverUrl: true,
  audioUrl: true,
  waveformPeaks: true,
  bpm: true,
  key: true,
  mood: true,
  energy: true,
  valence: true,
  analyzedAt: true,
} as const;

export default async function BrowsePage({ searchParams }: Props) {
  const { genre, sort = "recent", q, page = "1", mood, key: musicalKey, bpmMin, bpmMax } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const take = 50;
  const skip = (pageNum - 1) * take;

  const session = await auth();
  const email = session?.user?.email;

  const textWhere = q?.trim()
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { artist: { contains: q, mode: "insensitive" as const } },
          { album: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const bpmWhere = bpmMin || bpmMax
    ? { bpm: { ...(bpmMin ? { gte: Number(bpmMin) } : {}), ...(bpmMax ? { lte: Number(bpmMax) } : {}) } }
    : {};

  const where = {
    ...textWhere,
    ...(genre ? { genre } : {}),
    ...(mood ? { mood } : {}),
    ...(musicalKey ? { key: musicalKey } : {}),
    ...bpmWhere,
  };

  const orderBy = (() => {
    switch (sort) {
      case "mostPlayed": return undefined;
      case "title":    return { title: "asc" as const };
      case "artist":   return { artist: "asc" as const };
      case "duration": return { duration: "asc" as const };
      default:         return { createdAt: "desc" as const };
    }
  })();

  const [songsRaw, total, genreRows, userPlaylists, moodRows, keyRows] = await Promise.all([
    sort === "mostPlayed"
      ? prisma.song.findMany({ where, select: AUDIO_SELECT })
      : prisma.song.findMany({ where, orderBy: orderBy ?? undefined, take, skip, select: AUDIO_SELECT }),
    prisma.song.count({ where }),
    prisma.song.findMany({
      where: { genre: { not: null } },
      distinct: ["genre"],
      select: { genre: true },
      orderBy: { genre: "asc" },
    }),
    email
      ? prisma.playlist.findMany({
          where: { user: { email } },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : [],
    prisma.song.findMany({
      where: { mood: { not: null } },
      distinct: ["mood"],
      select: { mood: true },
      orderBy: { mood: "asc" },
    }),
    prisma.song.findMany({
      where: { key: { not: null } },
      distinct: ["key"],
      select: { key: true },
      orderBy: { key: "asc" },
    }),
  ]);

  const genres = genreRows.map((g) => g.genre as string);
  const moods = moodRows.map((m) => m.mood as string);
  const keys = keyRows.map((k) => k.key as string);

  const playCountMap = await getSongPlayCounts(songsRaw.map((s) => s.id));
  const visibleSongs = sort === "mostPlayed"
    ? [...songsRaw].sort((a, b) => (playCountMap.get(b.id) ?? 0) - (playCountMap.get(a.id) ?? 0)).slice(skip, skip + take)
    : songsRaw;

  const typedSongs = visibleSongs.map((s) => ({
    ...s,
    waveformPeaks: s.waveformPeaks as number[] | null,
    playCount: playCountMap.get(s.id) ?? 0,
    analyzedAt: s.analyzedAt?.toISOString() ?? null,
  }));

  return (
    <BrowseSongsView
      songs={typedSongs}
      total={total}
      genres={genres}
      moods={moods}
      musicalKeys={keys}
      userPlaylists={userPlaylists}
      currentGenre={genre ?? ""}
      currentSort={sort}
      currentQuery={q ?? ""}
      currentPage={pageNum}
      currentMood={mood ?? ""}
      currentKey={musicalKey ?? ""}
      currentBpmMin={bpmMin ?? ""}
      currentBpmMax={bpmMax ?? ""}
    />
  );
}
