import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDuration, formatPlayCount } from "@/lib/format";
import { GENRE_COLORS } from "@/lib/genreColors";
import { Headphones, Music2, Users, Activity } from "lucide-react";

export default async function StatsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) redirect("/login");

  const userId = user.id;
  const now = Date.now();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  // Raw query: prisma.playHistory.groupBy({ by: ["songId"], where: { userId }, _count: { songId: true } })
  const allPlayCounts = await prisma.playHistory.groupBy({
    by: ["songId"],
    where: { userId },
    _count: { songId: true },
  });

  const allSongIds = allPlayCounts.map((row) => row.songId);
  const allSongs = allSongIds.length
    ? await prisma.song.findMany({
        where: { id: { in: allSongIds } },
        select: { id: true, duration: true, artist: true },
      })
    : [];

  const allSongById = new Map(allSongs.map((s) => [s.id, s]));
  const totalSeconds = allPlayCounts.reduce((sum, row) => {
    const song = allSongById.get(row.songId);
    if (!song) return sum;
    return sum + song.duration * row._count.songId;
  }, 0);
  const totalMinutes = Math.round(totalSeconds / 60);
  const uniqueSongCount = allPlayCounts.length;
  const uniqueArtistCount = new Set(allSongs.map((s) => s.artist)).size;

  // Raw query: prisma.playHistory.groupBy({ by: ["songId"], where: { userId, playedAt: { gte: thirtyDaysAgo } }, _count: { songId: true } })
  const recentPlayCounts = await prisma.playHistory.groupBy({
    by: ["songId"],
    where: { userId, playedAt: { gte: thirtyDaysAgo } },
    _count: { songId: true },
  });

  const recentSongIds = recentPlayCounts.map((row) => row.songId);
  const recentSongs = recentSongIds.length
    ? await prisma.song.findMany({
        where: { id: { in: recentSongIds } },
        select: { id: true, artist: true, genre: true },
      })
    : [];

  const recentSongById = new Map(recentSongs.map((s) => [s.id, s]));

  const artistCounts = new Map<string, number>();
  for (const row of recentPlayCounts) {
    const artist = recentSongById.get(row.songId)?.artist;
    if (!artist) continue;
    artistCounts.set(artist, (artistCounts.get(artist) ?? 0) + row._count.songId);
  }

  const topArtists = [...artistCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxArtistCount = topArtists[0]?.[1] ?? 1;

  const genreCounts = new Map<string, number>();
  for (const row of recentPlayCounts) {
    const genre = recentSongById.get(row.songId)?.genre ?? "Unknown";
    genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + row._count.songId);
  }

  const topGenres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([genre, count]) => {
      const key = genre.toLowerCase();
      const gradient = GENRE_COLORS[key]?.gradient ?? "from-brand-orange to-brand-magenta";
      return { genre, count, gradient };
    });

  const totalGenrePlays = topGenres.reduce((sum, g) => sum + g.count, 0) || 1;

  // Raw query: prisma.playHistory.groupBy({ by: ["songId"], where: { userId }, _count: { songId: true }, orderBy: { _count: { songId: "desc" } }, take: 10 })
  const topSongCounts = await prisma.playHistory.groupBy({
    by: ["songId"],
    where: { userId },
    _count: { songId: true },
    orderBy: { _count: { songId: "desc" } },
    take: 10,
  });

  const topSongIds = topSongCounts.map((row) => row.songId);
  const topSongs = topSongIds.length
    ? await prisma.song.findMany({
        where: { id: { in: topSongIds } },
        select: { id: true, title: true, artist: true, coverUrl: true, duration: true },
      })
    : [];

  const topSongById = new Map(topSongs.map((s) => [s.id, s]));
  const mostPlayedSongs = topSongCounts.flatMap((row) => {
    const song = topSongById.get(row.songId);
    return song ? [{ song, plays: row._count.songId }] : [];
  });

  // Raw query: prisma.playHistory.groupBy({ by: ["playedAt"], where: { userId, playedAt: { gte: sevenDaysAgo } }, _count: { _all: true } })
  const activityRows = await prisma.playHistory.groupBy({
    by: ["playedAt"],
    where: { userId, playedAt: { gte: sevenDaysAgo } },
    _count: { _all: true },
  });

  const activityMap = new Map<string, number>();
  for (const row of activityRows) {
    const dateKey = row.playedAt.toISOString().slice(0, 10);
    activityMap.set(dateKey, (activityMap.get(dateKey) ?? 0) + row._count._all);
  }

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const activityDays = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date(now - (6 - idx) * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    return {
      key,
      label: dayLabels[d.getDay()],
      count: activityMap.get(key) ?? 0,
    };
  });

  const maxActivity = Math.max(...activityDays.map((d) => d.count), 1);

  const thisWeekRows = await prisma.playHistory.groupBy({
    by: ["songId"],
    where: {
      playedAt: { gte: sevenDaysAgo },
      user: { preferences: { showActivity: true } },
    },
    _count: { songId: true },
  });

  const previousWeekRows = await prisma.playHistory.groupBy({
    by: ["songId"],
    where: {
      playedAt: { gte: new Date(now - 14 * 24 * 60 * 60 * 1000), lt: sevenDaysAgo },
      user: { preferences: { showActivity: true } },
    },
    _count: { songId: true },
  });

  const weekCounts = new Map(thisWeekRows.map((row) => [row.songId, row._count.songId] as const));
  const previousCounts = new Map(previousWeekRows.map((row) => [row.songId, row._count.songId] as const));
  const trendingRows = [...weekCounts.entries()]
    .map(([songId, plays]) => ({
      songId,
      plays,
      growth: plays - (previousCounts.get(songId) ?? 0),
    }))
    .filter((row) => row.plays > 0)
    .sort((a, b) => b.growth - a.growth || b.plays - a.plays)
    .slice(0, 8);

  const trendingSongIds = trendingRows.map((row) => row.songId);
  const trendingSongs = trendingSongIds.length
    ? await prisma.song.findMany({
        where: { id: { in: trendingSongIds } },
        select: { id: true, title: true, artist: true, coverUrl: true, duration: true },
      })
    : [];
  const trendingSongById = new Map(trendingSongs.map((s) => [s.id, s]));
  const trendingSongsOrdered = trendingRows.flatMap((row) => {
    const song = trendingSongById.get(row.songId);
    return song ? [{ song, plays: row.plays, growth: row.growth }] : [];
  });

  // Audio analysis stats — average BPM, top mood, most-played key from user's listened songs
  const listenedSongIds = allPlayCounts.map((r) => r.songId);
  const analyzedSongs = listenedSongIds.length
    ? await prisma.song.findMany({
        where: { id: { in: listenedSongIds }, analyzedAt: { not: null } },
        select: { id: true, bpm: true, mood: true, key: true },
      })
    : [];

  let avgBpm: number | null = null;
  let topMood: string | null = null;
  let topKey: string | null = null;

  if (analyzedSongs.length > 0) {
    const bpms = analyzedSongs.filter((s) => s.bpm != null).map((s) => s.bpm as number);
    if (bpms.length > 0) avgBpm = Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length);

    const moodMap = new Map<string, number>();
    const keyMap = new Map<string, number>();
    for (const s of analyzedSongs) {
      if (s.mood) moodMap.set(s.mood, (moodMap.get(s.mood) ?? 0) + 1);
      if (s.key) keyMap.set(s.key, (keyMap.get(s.key) ?? 0) + 1);
    }
    topMood = [...moodMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    topKey = [...keyMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }

  function activityStyle(count: number) {
    const intensity = count === 0 ? 0.08 : 0.2 + (count / maxActivity) * 0.8;
    return {
      background: `linear-gradient(135deg, rgba(139,92,246,${intensity}) 0%, rgba(236,72,153,${intensity}) 100%)`,
    };
  }

  return (
    <div className="p-4 md:p-8 space-y-12 max-w-[1200px]">
      <section className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Your music year</p>
          <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-brand-orange to-brand-magenta bg-clip-text text-transparent">
            Your music year
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <Headphones size={18} className="text-purple-300" />
            <p className="mt-3 text-3xl font-bold text-zinc-100">
              {totalMinutes.toLocaleString()}
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total minutes listened</p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <Music2 size={18} className="text-pink-300" />
            <p className="mt-3 text-3xl font-bold text-zinc-100">
              {uniqueSongCount.toLocaleString()}
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Unique songs played</p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <Users size={18} className="text-rose-300" />
            <p className="mt-3 text-3xl font-bold text-zinc-100">
              {uniqueArtistCount.toLocaleString()}
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Unique artists</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-zinc-100">Top artists this month</h2>
          <div className="space-y-3">
            {topArtists.length === 0 && (
              <p className="text-sm text-zinc-500">No plays in the last 30 days yet.</p>
            )}
            {topArtists.map(([artist, count], idx) => (
              <div key={artist} className="flex items-center gap-3">
                <span className="text-xs text-zinc-500 w-5">{idx + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm text-zinc-200">
                    <span className="truncate">{artist}</span>
                      <span className="text-xs text-zinc-500">{formatPlayCount(count)} plays</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-brand-orange to-brand-magenta"
                      style={{ width: `${Math.round((count / maxArtistCount) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-zinc-100">Top genres</h2>
          <div className="flex h-6 rounded-full overflow-hidden gap-px bg-white/5">
            {topGenres.map((genre) => (
              <div
                key={genre.genre}
                className={`bg-gradient-to-r ${genre.gradient}`}
                style={{ width: `${Math.round((genre.count / totalGenrePlays) * 100)}%` }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {topGenres.map((genre) => (
              <div key={genre.genre} className="flex items-center gap-2 text-sm text-zinc-400">
                <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${genre.gradient}`} />
                <span className="capitalize">{genre.genre}</span>
                <span className="text-zinc-600">·</span>
                <span>{Math.round((genre.count / totalGenrePlays) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-100">Trending this week</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {trendingSongsOrdered.length === 0 && (
            <p className="text-sm text-zinc-500">No global trend yet.</p>
          )}
          {trendingSongsOrdered.map((row, idx) => (
            <div
              key={row.song.id}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2"
            >
              <span className="w-6 text-right text-sm text-zinc-500">{idx + 1}</span>
              <div className="relative w-10 h-10 shrink-0 rounded overflow-hidden bg-white/10">
                {row.song.coverUrl ? (
                  <Image
                    src={row.song.coverUrl}
                    alt={row.song.title}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-200 truncate">{row.song.title}</p>
                <p className="text-xs text-zinc-500 truncate">{row.song.artist}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">{formatPlayCount(row.plays)} plays</p>
                <p className="text-xs text-zinc-600">+{Math.max(0, row.growth).toLocaleString()} growth</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-100">Most played by you</h2>
        <div className="space-y-2">
          {mostPlayedSongs.length === 0 && (
            <p className="text-sm text-zinc-500">No listening history yet.</p>
          )}
          {mostPlayedSongs.map((row, idx) => (
            <div
              key={row.song.id}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-3 py-2"
            >
              <span className="w-6 text-right text-sm text-zinc-500">{idx + 1}</span>
              <div className="relative w-10 h-10 shrink-0 rounded overflow-hidden bg-white/10">
                {row.song.coverUrl ? (
                  <Image
                    src={row.song.coverUrl}
                    alt={row.song.title}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-zinc-200 truncate">{row.song.title}</p>
                <p className="text-xs text-zinc-500 truncate">{row.song.artist}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-500">{formatPlayCount(row.plays)} plays</p>
                <p className="text-xs text-zinc-600">{formatDuration(row.song.duration)}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-100">Listening activity</h2>
        <div className="grid grid-cols-7 gap-2">
          {activityDays.map((day) => (
            <div key={day.key} className="flex flex-col items-center gap-2">
              <div
                className="w-10 h-10 rounded-lg border border-white/5"
                style={activityStyle(day.count)}
                title={`${day.count} plays`}
              />
              <span className="text-xs text-zinc-500">{day.label}</span>
            </div>
          ))}
        </div>
      </section>

      {(avgBpm != null || topMood || topKey) && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-purple-400" />
            <h2 className="text-xl font-bold text-zinc-100">Your music in numbers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {avgBpm != null && (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Avg BPM you listen to</p>
                <p className="mt-3 text-4xl font-bold text-zinc-100 tabular-nums">{avgBpm}</p>
                <p className="text-xs text-zinc-600 mt-1">
                  {avgBpm < 80 ? "slow & chill" : avgBpm < 110 ? "mid-tempo" : avgBpm < 140 ? "upbeat" : "high energy"}
                </p>
              </div>
            )}
            {topMood && (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Top mood</p>
                <p className="mt-3 text-4xl font-bold text-zinc-100 capitalize">{topMood}</p>
                <p className="text-xs text-zinc-600 mt-1">most common in your history</p>
              </div>
            )}
            {topKey && (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Most-played key</p>
                <p className="mt-3 text-4xl font-bold text-zinc-100">{topKey}</p>
                <p className="text-xs text-zinc-600 mt-1">musical key you gravitate to</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
