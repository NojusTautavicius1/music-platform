import { prisma } from "@/lib/prisma";
import { SearchResultsView } from "@/components/search/SearchResultsView";

type Props = {
  params: Promise<{ query: string }>;
  searchParams: Promise<{ tab?: string }>;
};

export default async function SearchResultsPage({ params, searchParams }: Props) {
  const { query: rawQuery } = await params;
  const { tab = "all" } = await searchParams;
  const query = decodeURIComponent(rawQuery);

  const [songs, playlists, artistRows] = await Promise.all([
    prisma.song.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { artist: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: { title: "asc" },
      take: 20,
      select: {
        id: true,
        title: true,
        artist: true,
        album: true,
        duration: true,
        coverUrl: true,
        audioUrl: true,
      },
    }),

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
  ]);

  const artists = artistRows.map((r) => r.artist);

  return (
    <SearchResultsView
      query={query}
      tab={tab}
      songs={songs}
      playlists={playlists}
      artists={artists}
    />
  );
}
