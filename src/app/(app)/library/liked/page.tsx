import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatTotalDuration } from "@/lib/format";
import {
  PlaylistView,
  type SongInPlaylist,
} from "@/components/playlist/PlaylistView";

export default async function LikedSongsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true },
  });
  if (!user) redirect("/login");

  const [likedRows, userPlaylists] = await Promise.all([
    prisma.likedSong.findMany({
      where: { userId: user.id },
      orderBy: { likedAt: "desc" },
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
    }),
    prisma.playlist.findMany({
      where: { userId: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const totalSeconds = likedRows.reduce((acc, r) => acc + r.song.duration, 0);

  const songs: SongInPlaylist[] = likedRows.map((r, i) => ({
    songId: r.song.id,
    position: i,
    addedAt: r.likedAt.toISOString(),
    title: r.song.title,
    artist: r.song.artist,
    album: r.song.album,
    duration: r.song.duration,
    coverUrl: r.song.coverUrl,
    audioUrl: r.song.audioUrl,
    waveformPeaks: r.song.waveformPeaks as number[] | null,
    isLiked: true,
  }));

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <section className="relative px-8 pt-16 pb-8 min-h-80 flex items-end">
        {/* Gradient background */}
        <div
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{
            height: "320px",
            background:
              "linear-gradient(to bottom, rgba(59, 130, 246, 0.6) 0%, transparent 100%)",
          }}
        />

        <div className="relative flex gap-6 items-end w-full">
          {/* Cover — gradient square with heart */}
          <div className="shrink-0 w-58 h-58 rounded-md shadow-2xl overflow-hidden bg-linear-to-br from-[#8B5CF6] to-[#3B82F6] flex items-center justify-center">
            <Heart size={72} fill="white" className="text-white opacity-90" />
          </div>

          {/* Meta */}
          <div className="min-w-0 pb-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-300 mb-2">
              Playlist
            </p>
            <h1 className="text-6xl font-bold text-white leading-tight mb-4">
              Liked Songs
            </h1>
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <span className="font-semibold text-white">
                {user.name ?? "You"}
              </span>
              <span className="text-zinc-500">·</span>
              <span>
                {likedRows.length}{" "}
                {likedRows.length === 1 ? "song" : "songs"}
              </span>
              {likedRows.length > 0 && (
                <>
                  <span className="text-zinc-500">·</span>
                  <span className="text-zinc-400">
                    {formatTotalDuration(totalSeconds)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <PlaylistView
        playlistId="liked"
        playlistName="Liked Songs"
        playlistDescription={null}
        playlistCoverUrl={null}
        isPublic={false}
        isOwner={false}
        songs={songs}
        userPlaylists={userPlaylists}
      />
    </div>
  );
}
