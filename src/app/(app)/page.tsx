import { type Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sonara — Your music, beautifully organized",
  description:
    "Pick up where you left off. Browse playlists, top genres, and discover new releases.",
};
import { prisma } from "@/lib/prisma";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";
import { MixCard } from "@/components/shared/MixCard";
import { MixRefreshTrigger } from "@/components/shared/MixRefreshTrigger";
import { GENRE_COLORS, FEATURED_GENRES } from "@/lib/genreColors";
import { getPlaylistPlayCounts, getTrendingSongs } from "@/lib/playCounts";
import { FlowDivider } from "@/components/shared/FlowDivider";
import { TryAskingSection } from "@/components/shared/TryAskingSection";

// ─── Skeleton helpers ─────────────────────────────────────────────────────────

function CardSkeleton({ size }: { size: number }) {
  return (
    <div className="shrink-0 p-3" style={{ width: size }}>
      <div
        className="rounded-md bg-white/5 animate-pulse"
        style={{ width: size - 24, height: size - 24 }}
      />
      <div className="mt-3 h-4 w-3/4 bg-white/5 rounded animate-pulse" />
      <div className="mt-1.5 h-3 w-1/2 bg-white/5 rounded animate-pulse" />
    </div>
  );
}

function SectionSkeleton({ label }: { label: string }) {
  return <div className="h-8 w-48 bg-white/5 rounded animate-pulse mb-6" aria-label={label} />;
}

function HorizontalSkeleton({ count, size }: { count: number; size: number }) {
  return (
    <section>
      <SectionSkeleton label="Loading section" />
      <div className="flex gap-1 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <CardSkeleton key={i} size={size} />
        ))}
      </div>
    </section>
  );
}

function GridSkeleton({
  count,
  gridClass,
}: {
  count: number;
  gridClass: string;
}) {
  return (
    <section>
      <SectionSkeleton label="Loading section" />
      <div className={`grid gap-1 ${gridClass}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="p-3">
            <div className="aspect-square rounded-md bg-white/5 animate-pulse" />
            <div className="mt-3 h-4 w-3/4 bg-white/5 rounded animate-pulse" />
            <div className="mt-1.5 h-3 w-1/2 bg-white/5 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Section: Made for you ────────────────────────────────────────────────────

const STALE_MS = 24 * 60 * 60 * 1000; // 24 h

async function MadeForYouSection({ userId, serverNow }: { userId?: string | null; serverNow: number }) {
  if (!userId) {
    // Unauthenticated: show public playlists as a teaser
    const playlists = await prisma.playlist.findMany({
      where: { isPublic: true },
      take: 6,
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true, coverUrl: true },
    });
    if (playlists.length === 0) return null;
    const playCountMap = await getPlaylistPlayCounts(playlists.map((playlist) => playlist.id));
    return (
      <section>
        <h2 className="text-2xl font-bold text-zinc-100 mb-2 section-heading">Made for you</h2>
        <FlowDivider className="mb-4" />
        <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-3 px-3">
          {playlists.map((p) => (
            <div key={p.id} className="shrink-0 snap-start">
              <PlaylistCard
                id={p.id}
                title={p.name}
                subtitle={p.description ?? "Playlist"}
                coverUrl={p.coverUrl}
                size="lg"
                playCount={playCountMap.get(p.id) ?? 0}
              />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const mixes = await prisma.generatedPlaylist.findMany({
    where: { userId },
    orderBy: { kind: "asc" },
  });

  const needsRefresh =
    mixes.length < 4 ||
    mixes.some((m) => serverNow - m.generatedAt.getTime() > STALE_MS);

  if (mixes.length === 0) {
    return (
      <>
        <MixRefreshTrigger needsRefresh />
        <section>
          <h2 className="text-2xl font-bold text-zinc-100 mb-2 section-heading">Made for you</h2>
        <FlowDivider className="mb-4" />
          <p className="text-zinc-500 text-sm">
            Your personalized mixes are being prepared…
          </p>
        </section>
      </>
    );
  }

  return (
    <>
      <MixRefreshTrigger needsRefresh={needsRefresh} />
      <section>
        <h2 className="text-2xl font-bold text-zinc-100 mb-2 section-heading">Made for you</h2>
        <FlowDivider className="mb-4" />
        <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-3 px-3">
          {mixes.map((mix) => (
            <div key={mix.kind} className="snap-start">
              <MixCard
                kind={mix.kind}
                name={mix.name}
                description={mix.description}
                gradientFrom={mix.gradientFrom}
                gradientTo={mix.gradientTo}
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

// ─── Section: Recently played ─────────────────────────────────────────────────

async function RecentlyPlayedSection({ userId }: { userId?: string | null }) {
  if (userId) {
    const recentDistinct = await prisma.playHistory.groupBy({
      by: ["songId"],
      where: { userId },
      _max: { playedAt: true },
      orderBy: { _max: { playedAt: "desc" } },
      take: 6,
    });

    const songIds = recentDistinct.map((r) => r.songId);
    if (songIds.length > 0) {
      const songs = await prisma.song.findMany({
        where: { id: { in: songIds } },
        select: { id: true, title: true, artist: true, coverUrl: true, audioUrl: true, duration: true, waveformPeaks: true },
      });
      const songById = new Map(songs.map((s) => [s.id, s]));
      const orderedSongs = recentDistinct
        .map((r) => songById.get(r.songId))
        .filter((s): s is NonNullable<typeof s> => !!s);

      if (orderedSongs.length > 0) {
        const queue = orderedSongs.map((s) => ({ id: s.id, title: s.title, artist: s.artist, album: null, duration: s.duration, coverUrl: s.coverUrl, audioUrl: s.audioUrl, waveformPeaks: s.waveformPeaks as number[] | null }));
        return (
          <section>
            <h2 className="text-2xl font-bold text-zinc-100 mb-2 section-heading">Recently played</h2>
        <FlowDivider className="mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1">
              {orderedSongs.map((s, i) => (
                <PlaylistCard
                  key={s.id}
                  id={s.id}
                  title={s.title}
                  subtitle={s.artist}
                  coverUrl={s.coverUrl}
                  size="md"
                  fluid
                  song={queue[i]}
                  songs={queue}
                />
              ))}
            </div>
          </section>
        );
      }
    }
  }

  // Fallback: newest songs for unauthenticated or no history
  const songs = await prisma.song.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    select: { id: true, title: true, artist: true, coverUrl: true, audioUrl: true, duration: true, waveformPeaks: true },
  });

  if (songs.length === 0) return null;
  const queue = songs.map((s) => ({ id: s.id, title: s.title, artist: s.artist, album: null, duration: s.duration, coverUrl: s.coverUrl, audioUrl: s.audioUrl, waveformPeaks: s.waveformPeaks as number[] | null }));

  return (
    <section>
      <h2 className="text-2xl font-bold text-zinc-100 mb-6 section-heading">New arrivals</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1">
        {songs.map((s, i) => (
          <PlaylistCard
            key={s.id}
            id={s.id}
            title={s.title}
            subtitle={s.artist}
            coverUrl={s.coverUrl}
            size="md"
            fluid
            song={queue[i]}
            songs={queue}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Section: Jump back in ─────────────────────────────────────────────────────

async function JumpBackInSection({ userId }: { userId?: string | null }) {
  if (!userId) return null;

  // Find playlists the user owns that contain songs they recently played
  const rows = await prisma.playHistory.findMany({
    where: { userId },
    orderBy: { playedAt: "desc" },
    select: { songId: true, playedAt: true },
    take: 200,
  });

  if (rows.length === 0) return null;

  const latestBySong = new Map<string, Date>();
  for (const row of rows) {
    if (!latestBySong.has(row.songId)) {
      latestBySong.set(row.songId, row.playedAt);
    }
  }

  const playlistSongs = await prisma.playlistSong.findMany({
    where: {
      songId: { in: [...latestBySong.keys()] },
      playlist: { userId },
    },
    select: {
      songId: true,
      playlist: { select: { id: true, name: true, coverUrl: true } },
    },
  });

  const playlistMap = new Map<string, { id: string; name: string; coverUrl: string | null; latestPlay: Date }>();
  for (const ps of playlistSongs) {
    const latest = latestBySong.get(ps.songId);
    if (!latest) continue;
    const existing = playlistMap.get(ps.playlist.id);
    if (!existing || latest > existing.latestPlay) {
      playlistMap.set(ps.playlist.id, { ...ps.playlist, latestPlay: latest });
    }
  }

  const playlists = [...playlistMap.values()]
    .sort((a, b) => b.latestPlay.getTime() - a.latestPlay.getTime())
    .slice(0, 4);

  if (playlists.length === 0) return null;
  const playCountMap = await getPlaylistPlayCounts(playlists.map((playlist) => playlist.id));

  return (
    <section>
      <h2 className="text-2xl font-bold text-zinc-100 mb-2 section-heading">Jump back in</h2>
      <FlowDivider className="mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
        {playlists.map((p) => (
          <PlaylistCard
            key={p.id}
            id={p.id}
            title={p.name}
            subtitle="Playlist"
            coverUrl={p.coverUrl}
            size="md"
            fluid
            playCount={playCountMap.get(p.id) ?? 0}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Section: Trending now ───────────────────────────────────────────────────

async function TrendingNowSection() {
  const trending = await getTrendingSongs(7, 8);
  if (trending.length === 0) return null;
  const queue = trending.map(({ song }) => ({ id: song.id, title: song.title, artist: song.artist, album: null, duration: song.duration, coverUrl: song.coverUrl, audioUrl: song.audioUrl, waveformPeaks: song.waveformPeaks as number[] | null }));

  return (
    <section>
      <h2 className="text-2xl font-bold text-zinc-100 mb-2 section-heading">Trending now</h2>
      <FlowDivider className="mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1">
        {trending.map(({ song, playCount }, i) => (
          <PlaylistCard
            key={song.id}
            id={song.id}
            title={song.title}
            subtitle={song.artist}
            coverUrl={song.coverUrl}
            size="md"
            fluid
            song={queue[i]}
            songs={queue}
            playCount={playCount}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Section: New releases ────────────────────────────────────────────────────

async function NewReleasesSection() {
  const songs = await prisma.song.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { id: true, title: true, artist: true, coverUrl: true, audioUrl: true, duration: true, waveformPeaks: true },
  });

  if (songs.length === 0) return null;
  const queue = songs.map((s) => ({ id: s.id, title: s.title, artist: s.artist, album: null, duration: s.duration, coverUrl: s.coverUrl, audioUrl: s.audioUrl, waveformPeaks: s.waveformPeaks as number[] | null }));

  return (
    <section>
      <h2 className="text-2xl font-bold text-zinc-100 mb-2 section-heading">New releases</h2>
      <FlowDivider className="mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1">
        {songs.map((s, i) => (
          <PlaylistCard
            key={s.id}
            id={s.id}
            title={s.title}
            subtitle={s.artist}
            coverUrl={s.coverUrl}
            size="sm"
            fluid
            song={queue[i]}
            songs={queue}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const email = session?.user?.email;
  const userId = email
    ? (await prisma.user.findUnique({ where: { email }, select: { id: true } }))?.id
    : null;

  // Capture a single server-side timestamp to avoid impure Date.now() calls in sub-components
  // eslint-disable-next-line react-hooks/purity -- async server component, not a client render cycle
  const serverNow = Date.now();
  const hour = new Date(serverNow).getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-4 md:p-8 space-y-12 max-w-400">
      {/* Greeting */}
      <div>
        {userId ? (
          <>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight pb-1 greeting-shimmer">
              {greeting}, {firstName}
            </h1>
            <p className="text-zinc-500 mt-2 text-base">Pick up where you left off.</p>
          </>
        ) : (
          <>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight pb-1 greeting-shimmer">
              Discover music
            </h1>
            <p className="text-zinc-500 mt-2 text-base">
              Explore trending tracks and public playlists — no account needed.
            </p>
          </>
        )}
      </div>

      {/* Made for you */}
      <Suspense fallback={<HorizontalSkeleton count={4} size={216} />}>
        <MadeForYouSection userId={userId} serverNow={serverNow} />
      </Suspense>

      {/* Recently played */}
      <Suspense
        fallback={
          <GridSkeleton
            count={6}
            gridClass="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
          />
        }
      >
        <RecentlyPlayedSection userId={userId} />
      </Suspense>

      {/* Trending now */}
      <Suspense
        fallback={
          <GridSkeleton
            count={8}
            gridClass="grid-cols-2 sm:grid-cols-4 lg:grid-cols-8"
          />
        }
      >
        <TrendingNowSection />
      </Suspense>

      {/* Jump back in */}
      <Suspense
        fallback={
          <GridSkeleton
            count={4}
            gridClass="grid-cols-2 sm:grid-cols-4"
          />
        }
      >
        <JumpBackInSection userId={userId} />
      </Suspense>

      {/* Genre chips — static, no Suspense needed */}
      <section>
        <h2 className="text-2xl font-bold text-zinc-100 mb-2">
          Your top genres
        </h2>
        <FlowDivider className="mb-4" />
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {FEATURED_GENRES.map((genre) => {
            const cfg = GENRE_COLORS[genre];
            if (!cfg) return null;
            return (
              <Link
                key={genre}
                href={`/search/${encodeURIComponent(genre)}`}
                className="shrink-0 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-zinc-300 font-semibold text-sm whitespace-nowrap hover:border-[#FF5500]/60 hover:text-[#FF5500] hover:bg-orange-500/5 transition-all duration-200"
              >
                {cfg.label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* New releases */}
      <Suspense
        fallback={
          <GridSkeleton
            count={8}
            gridClass="grid-cols-2 sm:grid-cols-4 lg:grid-cols-8"
          />
        }
      >
        <NewReleasesSection />
      </Suspense>

      {/* Try asking — AI agent showcase */}
      <TryAskingSection />
    </div>
  );
}
