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
    isLiked: likedSongIds.has(ps.song.id),
  }));

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <section className="relative px-4 md:px-8 pt-8 md:pt-16 pb-8 md:min-h-80 flex items-end">
        <div
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{
            height: "320px",
            background:
              "linear-gradient(to bottom, rgba(124, 58, 237, 0.55) 0%, transparent 100%)",
          }}
        />

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
              <div className="w-full h-full bg-linear-to-br from-[#8B5CF6]/50 to-[#EC4899]/50" />
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
            <div className="flex items-center gap-2 text-sm text-zinc-300 flex-wrap">
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

      <PlaylistView
        playlistId={id}
        songs={songs}
        userPlaylists={userPlaylists}
      />
    </div>
  );
}
