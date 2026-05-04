import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SearchResultsView } from "@/components/search/SearchResultsView";
import { getArtistMonthlyListeners, getPlaylistPlayCounts, getSongPlayCounts } from "@/lib/playCounts";

type Props = {
  params: Promise<{ query: string }>;
  searchParams: Promise<{ tab?: string; page?: string }>;
};

export default async function SearchResultsPage({ params, searchParams }: Props) {
  const { query: rawQuery } = await params;
  const { tab = "all", page } = await searchParams;
  const query = decodeURIComponent(rawQuery);
  const songPage = Math.max(1, Number(page ?? 1) || 1);

  const session = await auth();
  const email = session?.user?.email;

  const songWhere = {
    OR: [
      { title: { contains: query, mode: "insensitive" as const } },
      { artist: { contains: query, mode: "insensitive" as const } },
      { album: { contains: query, mode: "insensitive" as const } },
      { genre: { contains: query, mode: "insensitive" as const } },
    ],
  };

  const songTake = tab === "songs" ? songPage * 50 : 20;

  const [songs, songCount, playlists, artistRows, userPlaylists] = await Promise.all([
    prisma.song.findMany({
      where: songWhere,
      orderBy: { title: "asc" },
      take: songTake,
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
    }),

    prisma.song.count({ where: songWhere }),

    prisma.playlist.findMany({
      where: {
        name: { contains: query, mode: "insensitive" },
        isPublic: true,
      },
      take: 20,
      select: {
        id: true,
        name: true,
        description: true,
        coverUrl: true,
        _count: { select: { songs: true } },
      },
    }),

    prisma.song.findMany({
      where: { artist: { contains: query, mode: "insensitive" } },
      distinct: ["artist"],
      select: { artist: true },
      take: 10,
    }),

    email
      ? prisma.playlist.findMany({
          where: { user: { email } },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : [],
  ]);

  const playCountMap = await getSongPlayCounts(songs.map((song) => song.id));
  const artists = await getArtistMonthlyListeners(artistRows.map((r) => r.artist));
  const playlistPlayCounts = await getPlaylistPlayCounts(playlists.map((playlist) => playlist.id));

  const typedSongs = songs.map((s) => ({
    ...s,
    waveformPeaks: s.waveformPeaks as number[] | null,
    playCount: playCountMap.get(s.id) ?? 0,
  }));

  return (
    <SearchResultsView
      query={query}
      tab={tab}
      songs={typedSongs}
      playlists={playlists.map((playlist) => ({
        ...playlist,
        playCount: playlistPlayCounts.get(playlist.id) ?? 0,
      }))}
      artists={artistRows.map((row) => ({
        name: row.artist,
        monthlyListeners: artists.get(row.artist) ?? 0,
      }))}
      userPlaylists={userPlaylists}
      songCount={songCount}
      songPage={songPage}
    />
  );
}
