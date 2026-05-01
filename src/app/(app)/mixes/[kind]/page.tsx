import { type Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Music2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatTotalDuration } from "@/lib/format";
import {
  PlaylistView,
  type SongInPlaylist,
} from "@/components/playlist/PlaylistView";

type Props = {
  params: Promise<{ kind: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kind } = await params;
  return {
    title: `${kindLabel(kind)} · Made for you`,
    description: "A personalized mix generated just for you.",
  };
}

function kindLabel(kind: string): string {
  switch (kind) {
    case "daily-mix-1": return "Daily Mix 1";
    case "daily-mix-2": return "Daily Mix 2";
    case "discover-weekly": return "Discover Weekly";
    case "on-repeat": return "On Repeat";
    default: return "Your Mix";
  }
}

export default async function MixPage({ params }: Props) {
  const { kind } = await params;
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, playlists: { select: { id: true, name: true } } },
  });
  if (!user) redirect("/login");

  const mix = await prisma.generatedPlaylist.findUnique({
    where: { userId_kind: { userId: user.id, kind } },
  });
  if (!mix) notFound();

  const songData = await prisma.song.findMany({
    where: { id: { in: mix.songIds } },
    select: {
      id: true,
      title: true,
      artist: true,
      album: true,
      duration: true,
      coverUrl: true,
      audioUrl: true,
      waveformPeaks: true,
      likedBy: {
        where: { userId: user.id },
        select: { userId: true },
      },
    },
  });

  const songMap = new Map(songData.map((s) => [s.id, s]));
  const songs: SongInPlaylist[] = mix.songIds
    .flatMap((id, i) => {
      const s = songMap.get(id);
      if (!s) return [];
      const row: SongInPlaylist = {
        songId: s.id,
        position: i,
        addedAt: mix.generatedAt.toISOString(),
        title: s.title,
        artist: s.artist,
        album: s.album,
        duration: s.duration,
        coverUrl: s.coverUrl,
        audioUrl: s.audioUrl,
        waveformPeaks: (s.waveformPeaks as number[] | null) ?? null,
        isLiked: s.likedBy.length > 0,
      };
      return [row];
    });

  const totalSeconds = songs.reduce((acc, s) => acc + s.duration, 0);

  return (
    <div>
      {/* ── Gradient header ───────────────────────────────────────────────── */}
      <div
        className="relative px-4 md:px-8 pt-8 md:pt-16 pb-8 md:min-h-80 flex items-end"
        style={{
          background: `linear-gradient(135deg, ${mix.gradientFrom} 0%, ${mix.gradientTo} 60%, transparent 100%)`,
        }}
      >
        {/* Fade-to-page-bg at the bottom */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-b from-transparent to-[#0A0A0F] pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-end gap-4 md:gap-6 w-full">
          {/* Cover tile */}
          <div
            className="w-45 h-45 md:w-58 md:h-58 rounded-md shadow-2xl shrink-0 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${mix.gradientFrom}, ${mix.gradientTo})`,
            }}
          >
            <Music2 size={64} className="text-white/30" />
          </div>

          {/* Meta */}
          <div className="min-w-0 md:pb-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-2">
              Made for you
            </p>
            <h1 className="text-3xl md:text-6xl font-bold text-white leading-tight mb-3 line-clamp-2">
              {mix.name}
            </h1>
            <p className="text-white/70 text-sm mb-4 line-clamp-2 max-w-xl">
              {mix.description}
            </p>
            <div className="flex items-center gap-2 text-sm text-white/60 flex-wrap">
              <span className="font-semibold text-white">
                {user.name ?? "You"}
              </span>
              <span className="text-white/30">·</span>
              <span>
                {songs.length} {songs.length === 1 ? "song" : "songs"}
              </span>
              <span className="text-white/30">·</span>
              <span>{formatTotalDuration(totalSeconds)}</span>
            </div>
          </div>
        </div>
      </div>

      <PlaylistView
        playlistId={mix.id}
        playlistName={mix.name}
        playlistDescription={mix.description}
        playlistCoverUrl={null}
        isPublic={false}
        isOwner={false}
        songs={songs}
        userPlaylists={user.playlists}
      />
    </div>
  );
}
