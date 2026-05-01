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
import { GENRE_COLORS, FEATURED_GENRES } from "@/lib/genreColors";

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
  size: number;
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

async function MadeForYouSection() {
  const playlists = await prisma.playlist.findMany({
    where: { isPublic: true },
    take: 6,
    orderBy: { name: "asc" },
    select: { id: true, name: true, description: true, coverUrl: true },
  });

  if (playlists.length === 0) return null;

  return (
    <section>
      <h2 className="text-2xl font-bold text-zinc-100 mb-6">Made for you</h2>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-3 px-3">
        {playlists.map((p) => (
          <div key={p.id} className="shrink-0 snap-start">
            <PlaylistCard
              id={p.id}
              title={p.name}
              subtitle={p.description ?? "Playlist"}
              coverUrl={p.coverUrl}
              size="lg"
            />
          </div>
        ))}
      </div>
    </section>
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
        select: { id: true, title: true, artist: true, coverUrl: true },
      });
      const songById = new Map(songs.map((s) => [s.id, s]));
      const orderedSongs = recentDistinct
        .map((r) => songById.get(r.songId))
        .filter((s): s is NonNullable<typeof s> => !!s);

      if (orderedSongs.length > 0) {
        return (
          <section>
            <h2 className="text-2xl font-bold text-zinc-100 mb-6">Recently played</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1">
              {orderedSongs.map((s) => (
                <PlaylistCard
                  key={s.id}
                  id={s.id}
                  title={s.title}
                  subtitle={s.artist}
                  coverUrl={s.coverUrl}
                  size="md"
                  fluid
                  href={`/song/${s.id}`}
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
    select: { id: true, title: true, artist: true, coverUrl: true },
  });

  if (songs.length === 0) return null;

  return (
    <section>
      <h2 className="text-2xl font-bold text-zinc-100 mb-6">Recently played</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1">
        {songs.map((s) => (
          <PlaylistCard
            key={s.id}
            id={s.id}
            title={s.title}
            subtitle={s.artist}
            coverUrl={s.coverUrl}
            size="md"
            fluid
            href={`/song/${s.id}`}
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

  return (
    <section>
      <h2 className="text-2xl font-bold text-zinc-100 mb-6">Jump back in</h2>
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
    select: { id: true, title: true, artist: true, coverUrl: true },
  });

  if (songs.length === 0) return null;

  return (
    <section>
      <h2 className="text-2xl font-bold text-zinc-100 mb-6">New releases</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1">
        {songs.map((s) => (
          <PlaylistCard
            key={s.id}
            id={s.id}
            title={s.title}
            subtitle={s.artist}
            coverUrl={s.coverUrl}
            size="sm"
            fluid
            href={`/song/${s.id}`}
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

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-4 md:p-8 space-y-12 max-w-[1600px]">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl md:text-5xl font-bold leading-tight pb-1 bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          {greeting}, {firstName}
        </h1>
        <p className="text-zinc-500 mt-2 text-base">
          Pick up where you left off.
        </p>
      </div>

      {/* Made for you */}
      <Suspense fallback={<HorizontalSkeleton count={6} size={240} />}>
        <MadeForYouSection />
      </Suspense>

      {/* Recently played */}
      <Suspense
        fallback={
          <GridSkeleton
            count={6}
            size={180}
            gridClass="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
          />
        }
      >
        <RecentlyPlayedSection userId={userId} />
      </Suspense>

      {/* Jump back in */}
      <Suspense
        fallback={
          <GridSkeleton
            count={4}
            size={180}
            gridClass="grid-cols-2 sm:grid-cols-4"
          />
        }
      >
        <JumpBackInSection userId={userId} />
      </Suspense>

      {/* Genre chips — static, no Suspense needed */}
      <section>
        <h2 className="text-2xl font-bold text-zinc-100 mb-6">
          Your top genres
        </h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {FEATURED_GENRES.map((genre) => {
            const cfg = GENRE_COLORS[genre];
            if (!cfg) return null;
            return (
              <Link
                key={genre}
                href={`/search/${encodeURIComponent(genre)}`}
                className={`shrink-0 px-6 py-3 rounded-full bg-gradient-to-r ${cfg.gradient} text-white font-bold text-sm whitespace-nowrap hover:scale-105 transition-transform shadow-md`}
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
            size={160}
            gridClass="grid-cols-2 sm:grid-cols-4 lg:grid-cols-8"
          />
        }
      >
        <NewReleasesSection />
      </Suspense>
    </div>
  );
}
