import { notFound } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatTotalDuration } from "@/lib/format";
import {
  PlaylistView,
  type SongInPlaylist,
} from "@/components/playlist/PlaylistView";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PlaylistPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  const playlist = await prisma.playlist.findUnique({
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
            },
          },
        },
      },
    },
  });

  if (!playlist) notFound();

  const isOwner = session?.user?.email === playlist.user.email;
  if (!playlist.isPublic && !isOwner) notFound();

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
  }));

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <section className="relative px-8 pt-16 pb-8 min-h-[320px] flex items-end">
        {/* Gradient background */}
        <div
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{
            height: "320px",
            background:
              "linear-gradient(to bottom, rgba(124, 58, 237, 0.55) 0%, transparent 100%)",
          }}
        />

        {/* Content row */}
        <div className="relative flex gap-6 items-end w-full">
          {/* Cover */}
          <div className="shrink-0 w-[232px] h-[232px] rounded-md shadow-2xl overflow-hidden">
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
              <div className="w-full h-full bg-gradient-to-br from-[#8B5CF6]/50 to-[#EC4899]/50" />
            )}
          </div>

          {/* Meta */}
          <div className="min-w-0 pb-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-300 mb-2">
              {playlist.isPublic ? "Public Playlist" : "Private Playlist"}
            </p>

            <h1 className="text-6xl font-bold text-white leading-tight mb-4 line-clamp-2">
              {playlist.name}
            </h1>

            {playlist.description && (
              <p className="text-zinc-400 text-sm mb-4 line-clamp-2 max-w-xl">
                {playlist.description}
              </p>
            )}

            {/* Metadata row */}
            <div className="flex items-center gap-2 text-sm text-zinc-300">
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

      {/* ── Interactive section (client) ─────────────────────────────── */}
      <PlaylistView playlistId={id} songs={songs} />
    </div>
  );
}
