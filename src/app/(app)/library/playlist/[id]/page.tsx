import { type Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatTotalDuration } from "@/lib/format";
import {
  PlaylistView,
  type SongInPlaylist,
  type SuggestedSong,
} from "@/components/playlist/PlaylistView";
import { findSimilarSongs } from "@/lib/ai/similarity";
import { ShareButton } from "@/components/shared/ShareButton";
import { CoverGradient } from "@/components/playlist/CoverGradient";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://sonara.vercel.app";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const playlist = await prisma.playlist.findUnique({
    where: { id },
    select: {
      name: true,
      description: true,
      coverUrl: true,
      user: { select: { name: true } },
    },
  });
  if (!playlist) return {};

  const creatorName = playlist.user.name ?? "Sonara";
  const ogImageUrl = `${BASE}/api/og?title=${encodeURIComponent(playlist.name)}&subtitle=${encodeURIComponent(`A playlist by ${creatorName}`)}`;

  return {
    title: `${playlist.name} · A playlist by ${creatorName}`,
    description: playlist.description ?? `Listen to ${playlist.name} on Sonara.`,
    openGraph: {
      title: playlist.name,
      description: playlist.description ?? `A playlist by ${creatorName}`,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: playlist.name,
      images: [ogImageUrl],
    },
  };
}

type Props = {
  params: Promise<{ id: string }>;
};

function shuffleTake<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

export default async function PlaylistPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  const [playlist, user] = await Promise.all([
    prisma.playlist.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, image: true, email: true } },
        songs: {
          orderBy: { position: "asc" },
          include: {
            song: {
              select: {
                id: true,
                title: true,
                artist: true,
                album: true,
                duration: true,
                coverUrl: true,
                audioUrl: true,
                waveformPeaks: true,
                license: true,
                licenseAttribution: true,
              },
            },
          },
        },
      },
    }),
    session?.user?.email
      ? prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        })
      : null,
  ]);

  if (!playlist) notFound();

  const isOwner = session?.user?.email === playlist.user.email;
  if (!playlist.isPublic && !isOwner) notFound();

  const likedSongIds = user
    ? new Set(
        (
          await prisma.likedSong.findMany({
            where: {
              userId: user.id,
              songId: { in: playlist.songs.map((ps) => ps.song.id) },
            },
            select: { songId: true },
          })
        ).map((ls) => ls.songId)
      )
    : new Set<string>();

  const userPlaylists = user
    ? await prisma.playlist.findMany({
        where: { userId: user.id },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      })
    : [];

  const playlistSongIds = playlist.songs.map((ps) => ps.song.id);

  // Genre-based suggestions (shown in playlist empty state / suggestions panel)
  const suggestedSongs: SuggestedSong[] = [];
  if (isOwner && playlist.songs.length > 0) {
    const genreRows = await prisma.song.findMany({
      where: { id: { in: playlistSongIds }, genre: { not: null } },
      distinct: ["genre"],
      select: { genre: true },
    });
    const genres = genreRows.map((r) => r.genre as string);
    if (genres.length > 0) {
      const candidates = await prisma.song.findMany({
        where: {
          genre: { in: genres },
          id: { notIn: playlistSongIds },
        },
        take: 30,
        select: {
          id: true, title: true, artist: true, album: true,
          genre: true, duration: true, coverUrl: true, audioUrl: true, waveformPeaks: true,
          license: true, licenseAttribution: true,
        },
      });
      suggestedSongs.push(...shuffleTake(candidates, 5).map((c) => ({
        ...c,
        waveformPeaks: c.waveformPeaks as number[] | null,
      })));
    }
  }

  // Embedding-based "More like this" from the first song that has an embedding
  let moreLikeSongs: SuggestedSong[] = [];
  if (playlist.songs.length > 0) {
    const seedSong = await prisma.song.findFirst({
      where: { id: { in: playlistSongIds }, embeddingAt: { not: null } },
      select: { id: true },
    });
    if (seedSong) {
      const similar = await findSimilarSongs(seedSong.id, 8).catch(() => []);
      moreLikeSongs = similar
        .filter((s) => !playlistSongIds.includes(s.id))
        .slice(0, 6)
        .map((s) => ({
          id: s.id,
          title: s.title,
          artist: s.artist,
          album: s.album,
          genre: s.genre,
          duration: s.duration,
          coverUrl: s.coverUrl,
          audioUrl: s.audioUrl,
          waveformPeaks: s.waveformPeaks as number[] | null,
        }));
    }
  }

  const totalSeconds = playlist.songs.reduce(
    (acc, ps) => acc + ps.song.duration,
    0
  );

  const songs: SongInPlaylist[] = playlist.songs.map((ps) => ({
    songId: ps.song.id,
    position: ps.position,
    addedAt: ps.addedAt.toISOString(),
    title: ps.song.title,
    artist: ps.song.artist,
    album: ps.song.album,
    duration: ps.song.duration,
    coverUrl: ps.song.coverUrl,
    audioUrl: ps.song.audioUrl,
    waveformPeaks: ps.song.waveformPeaks as number[] | null,
    isLiked: likedSongIds.has(ps.song.id),
    license: ps.song.license,
    licenseAttribution: ps.song.licenseAttribution,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicPlaylist",
    name: playlist.name,
    description: playlist.description ?? undefined,
    image: playlist.coverUrl ?? undefined,
    numTracks: playlist.songs.length,
    url: `${BASE}/library/playlist/${id}`,
    author: {
      "@type": "Person",
      name: playlist.user.name ?? "Unknown",
    },
    track: playlist.songs.slice(0, 20).map((ps) => ({
      "@type": "MusicRecording",
      name: ps.song.title,
      byArtist: { "@type": "MusicGroup", name: ps.song.artist },
    })),
  };

  const shareUrl = `${BASE}/library/playlist/${id}`;

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <CoverGradient coverUrl={playlist.coverUrl ?? ""}>
        <section className="relative px-4 md:px-8 pt-8 md:pt-16 pb-8 md:min-h-80 flex items-end">
          <div className="relative flex flex-col md:flex-row md:items-end gap-4 md:gap-6 w-full">
          {/* Cover */}
          <div className="w-[180px] h-[180px] md:w-58 md:h-58 rounded-md shadow-2xl overflow-hidden shrink-0">
            {playlist.coverUrl ? (
              <Image
                src={playlist.coverUrl}
                alt={playlist.name}
                width={232}
                height={232}
                className="object-cover w-full h-full"
                priority
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-brand-orange/50 to-brand-magenta/50" />
            )}
          </div>

          {/* Meta */}
          <div className="min-w-0 md:pb-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-300 mb-2">
              {playlist.isPublic ? "Public Playlist" : "Private Playlist"}
            </p>
            <h1 className="text-3xl md:text-6xl font-bold text-white leading-tight mb-4 line-clamp-2">
              {playlist.name}
            </h1>
            {playlist.description && (
              <p className="text-zinc-400 text-sm mb-4 line-clamp-2 max-w-xl">
                {playlist.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <ShareButton url={shareUrl} />
            </div>

            <div className="flex items-center gap-2 text-sm text-zinc-300 flex-wrap mt-3">
              {playlist.user.image && (
                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                  <Image
                    src={playlist.user.image}
                    alt={playlist.user.name ?? "Creator"}
                    width={24}
                    height={24}
                    className="object-cover"
                  />
                </div>
              )}
              <span className="font-semibold text-white">
                {playlist.user.name ?? "Unknown"}
              </span>
              <span className="text-zinc-500">·</span>
              <span>
                {playlist.songs.length}{" "}
                {playlist.songs.length === 1 ? "song" : "songs"}
              </span>
              <span className="text-zinc-500">·</span>
              <span className="text-zinc-400">
                {formatTotalDuration(totalSeconds)}
              </span>
            </div>
          </div>
          </div>
        </section>
      </CoverGradient>

      <PlaylistView
        playlistId={id}
        playlistName={playlist.name}
        playlistDescription={playlist.description}
        playlistCoverUrl={playlist.coverUrl}
        isPublic={playlist.isPublic}
        isOwner={isOwner}
        songs={songs}
        userPlaylists={userPlaylists}
        suggestedSongs={suggestedSongs}
        moreLikeSongs={moreLikeSongs}
      />
    </div>
  );
}
