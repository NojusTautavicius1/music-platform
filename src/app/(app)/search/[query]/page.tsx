import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { SearchResultsView } from "@/components/search/SearchResultsView";

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

  const artists = artistRows.map((r) => r.artist);

  const typedSongs = songs.map((s) => ({
    ...s,
    waveformPeaks: s.waveformPeaks as number[] | null,
  }));

  return (
    <SearchResultsView
      query={query}
      tab={tab}
      songs={typedSongs}
      playlists={playlists}
      artists={artists}
      userPlaylists={userPlaylists}
      songCount={songCount}
      songPage={songPage}
    />
  );
}
