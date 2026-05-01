import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlaylistCard } from "@/components/playlist/PlaylistCard";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, email: true, image: true, createdAt: true },
  });
  if (!user) redirect("/login");

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [publicPlaylists, likedCount, playCount, publicPlaylistsList, recentPlayCounts] =
    await Promise.all([
      prisma.playlist.count({
        where: { userId: user.id, isPublic: true },
      }),
      prisma.likedSong.count({
        where: { userId: user.id },
      }),
      prisma.playHistory.count({
        where: { userId: user.id },
      }),
      prisma.playlist.findMany({
        where: { userId: user.id, isPublic: true },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: { id: true, name: true, description: true, coverUrl: true },
      }),
      prisma.playHistory.groupBy({
        by: ["songId"],
        where: { userId: user.id, playedAt: { gte: thirtyDaysAgo } },
        _count: { songId: true },
      }),
    ]);

  const recentSongIds = recentPlayCounts.map((row) => row.songId);
  const recentSongs = recentSongIds.length
    ? await prisma.song.findMany({
        where: { id: { in: recentSongIds } },
        select: { id: true, artist: true },
      })
    : [];

  const songById = new Map(recentSongs.map((s) => [s.id, s]));
  const artistCounts = new Map<string, number>();
  for (const row of recentPlayCounts) {
    const artist = songById.get(row.songId)?.artist;
    if (!artist) continue;
    artistCounts.set(artist, (artistCounts.get(artist) ?? 0) + row._count.songId);
  }

  const topArtists = [...artistCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxArtistCount = topArtists[0]?.[1] ?? 1;

  const memberSince = user.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="pb-16">
      <section className="relative">
        <div className="h-64 w-full bg-gradient-to-r from-purple-500/40 via-pink-500/30 to-rose-500/40" />
        <div className="max-w-[1200px] mx-auto px-4 md:px-8">
          <div className="-mt-16 flex flex-col md:flex-row gap-6 items-start">
            <div className="relative w-36 h-36 rounded-2xl overflow-hidden ring-4 ring-[#0A0A0F] bg-white/10">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name ?? "User"}
                  fill
                  sizes="144px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="pt-2">
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Profile</p>
              <h1 className="text-4xl md:text-6xl font-extrabold text-zinc-100">
                {user.name ?? user.email}
              </h1>
              <p className="text-sm text-zinc-500 mt-2">Member since {memberSince}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-4 md:px-8 space-y-12 mt-10">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Public playlists</p>
            <p className="text-3xl font-bold text-zinc-100 mt-3">
              {publicPlaylists.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Liked songs</p>
            <p className="text-3xl font-bold text-zinc-100 mt-3">
              {likedCount.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total plays</p>
            <p className="text-3xl font-bold text-zinc-100 mt-3">
              {playCount.toLocaleString()}
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-100">Your public playlists</h2>
          </div>
          {publicPlaylistsList.length === 0 ? (
            <p className="text-sm text-zinc-500">No public playlists yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {publicPlaylistsList.map((playlist) => (
                <PlaylistCard
                  key={playlist.id}
                  id={playlist.id}
                  title={playlist.name}
                  subtitle={playlist.description ?? "Playlist"}
                  coverUrl={playlist.coverUrl}
                  size="md"
                  fluid
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-zinc-100">Top artists</h2>
          {topArtists.length === 0 ? (
            <p className="text-sm text-zinc-500">No plays in the last 30 days yet.</p>
          ) : (
            <div className="space-y-3">
              {topArtists.map(([artist, count], idx) => (
                <div key={artist} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-600 w-5">{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm text-zinc-200">
                      <span className="truncate">{artist}</span>
                      <span className="text-xs text-zinc-500">{count} plays</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-purple-500 to-pink-500"
                        style={{ width: `${Math.round((count / maxArtistCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
