import { type Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatTotalDuration } from "@/lib/format";
import { PublicPlaylistView } from "@/components/playlist/PublicPlaylistView";
import { CoverGradient } from "@/components/playlist/CoverGradient";
import { GuestBanner } from "@/components/shared/GuestBanner";
import { ReportButton } from "@/components/playlist/ReportButton";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://sonara.vercel.app";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const playlist = await prisma.playlist.findUnique({
    where: { shareSlug: slug, isPublic: true },
    select: {
      name: true,
      description: true,
      coverUrl: true,
      _count: { select: { songs: true } },
      user: { select: { name: true } },
    },
  });
  if (!playlist) return {};

  const title = `${playlist.name} — A playlist on Sonara`;
  const description =
    playlist.description ??
    `${playlist._count.songs} songs · Listen on Sonara`;
  const ogImageUrl = `${BASE}/api/og?title=${encodeURIComponent(playlist.name)}&subtitle=${encodeURIComponent(`by ${playlist.user.name ?? "Sonara"}`)}${playlist.coverUrl ? `&cover=${encodeURIComponent(playlist.coverUrl)}` : ""}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function PublicPlaylistPage({ params }: Props) {
  const { slug } = await params;

  const playlist = await prisma.playlist.findUnique({
    where: { shareSlug: slug, isPublic: true },
    include: {
      user: { select: { name: true, image: true } },
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
            },
          },
        },
      },
    },
  });

  if (!playlist) notFound();

  const totalSeconds = playlist.songs.reduce((acc, ps) => acc + ps.song.duration, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicPlaylist",
    name: playlist.name,
    description: playlist.description ?? undefined,
    image: playlist.coverUrl ?? undefined,
    numTracks: playlist.songs.length,
    url: `${BASE}/p/${slug}`,
    author: { "@type": "Person", name: playlist.user.name ?? "Unknown" },
    track: playlist.songs.slice(0, 20).map((ps) => ({
      "@type": "MusicRecording",
      name: ps.song.title,
      byArtist: { "@type": "MusicGroup", name: ps.song.artist },
    })),
  };

  const songs = playlist.songs.map((ps) => ({
    songId: ps.song.id,
    position: ps.position,
    title: ps.song.title,
    artist: ps.song.artist,
    album: ps.song.album,
    duration: ps.song.duration,
    coverUrl: ps.song.coverUrl,
    audioUrl: ps.song.audioUrl,
    waveformPeaks: ps.song.waveformPeaks as number[] | null,
  }));

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top bar */}
      <header className="sticky top-0 z-20 h-14 flex items-center justify-between px-4 md:px-8 bg-[#0A0A0F]/80 backdrop-blur-md border-b border-white/5">
        <Link href="/" className="text-xl font-bold bg-linear-to-r from-brand-orange to-brand-magenta bg-clip-text text-transparent">
          Sonara
        </Link>
        <Link
          href="/login"
          className="h-8 px-4 rounded-full bg-linear-to-r from-brand-orange to-brand-magenta text-white text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          Sign in
        </Link>
      </header>

      {/* Playlist header */}
      <CoverGradient coverUrl={playlist.coverUrl ?? ""}>
        <section className="relative px-4 md:px-8 pt-8 md:pt-16 pb-8 md:min-h-72 flex items-end">
          <div className="relative flex flex-col md:flex-row md:items-end gap-4 md:gap-6 w-full">
            <div className="w-44 h-44 md:w-56 md:h-56 rounded-md shadow-2xl overflow-hidden shrink-0">
              {playlist.coverUrl ? (
                <Image
                  src={playlist.coverUrl}
                  alt={playlist.name}
                  width={224}
                  height={224}
                  className="object-cover w-full h-full"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-brand-orange/50 to-brand-magenta/50" />
              )}
            </div>

            <div className="min-w-0 md:pb-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-300 mb-2">
                Public Playlist
              </p>
              <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-3 line-clamp-2">
                {playlist.name}
              </h1>
              {playlist.description && (
                <p className="text-zinc-400 text-sm mb-3 line-clamp-2 max-w-xl">
                  {playlist.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-sm text-zinc-300 flex-wrap mt-2">
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
                <span className="font-semibold text-white">{playlist.user.name ?? "Unknown"}</span>
                <span className="text-zinc-500">·</span>
                <span>{playlist.songs.length} {playlist.songs.length === 1 ? "song" : "songs"}</span>
                <span className="text-zinc-500">·</span>
                <span className="text-zinc-400">{formatTotalDuration(totalSeconds)}</span>
              </div>
              <div className="mt-3">
                <ReportButton playlistId={playlist.id} />
              </div>
            </div>
          </div>
        </section>
      </CoverGradient>

      <PublicPlaylistView songs={songs} playlistName={playlist.name} />

      {/* Guest floating banner */}
      <GuestBanner />
    </div>
  );
}
