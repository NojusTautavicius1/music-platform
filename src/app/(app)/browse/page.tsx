import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { BrowseSongsView } from "@/components/browse/BrowseSongsView";

type Props = {
  searchParams: Promise<{ genre?: string; sort?: string; q?: string; page?: string }>;
};

export default async function BrowsePage({ searchParams }: Props) {
  const { genre, sort = "recent", q, page = "1" } = await searchParams;
  const pageNum = Math.max(1, Number(page) || 1);
  const take = 50;
  const skip = (pageNum - 1) * take;

  const session = await auth();
  const email = session?.user?.email;

  const textWhere = q?.trim()
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { artist: { contains: q, mode: "insensitive" as const } },
          { album: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const where = {
    ...textWhere,
    ...(genre ? { genre } : {}),
  };

  const orderBy = (() => {
    switch (sort) {
      case "title":    return { title: "asc" as const };
      case "artist":   return { artist: "asc" as const };
      case "duration": return { duration: "asc" as const };
      default:         return { createdAt: "desc" as const };
    }
  })();

  const [songs, total, genreRows, userPlaylists] = await Promise.all([
    prisma.song.findMany({
      where,
      orderBy,
      take,
      skip,
      select: {
        id: true,
        title: true,
        artist: true,
        album: true,
        genre: true,
        duration: true,
        coverUrl: true,
        audioUrl: true,
      },
    }),
    prisma.song.count({ where }),
    prisma.song.findMany({
      where: { genre: { not: null } },
      distinct: ["genre"],
      select: { genre: true },
      orderBy: { genre: "asc" },
    }),
    email
      ? prisma.playlist.findMany({
          where: { user: { email } },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : [],
  ]);

  const genres = genreRows.map((g) => g.genre as string);

  return (
    <BrowseSongsView
      songs={songs}
      total={total}
      genres={genres}
      userPlaylists={userPlaylists}
      currentGenre={genre ?? ""}
      currentSort={sort}
      currentQuery={q ?? ""}
      currentPage={pageNum}
    />
  );
}
