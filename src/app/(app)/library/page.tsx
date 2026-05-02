import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LibraryView } from "@/components/library/LibraryView";
import { getPlaylistPlayCounts } from "@/lib/playCounts";

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");

  const playlists = await prisma.playlist.findMany({
    where: { user: { email: session.user.email } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      coverUrl: true,
      isPublic: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { songs: true } },
    },
  });

  const playCountMap = await getPlaylistPlayCounts(playlists.map((playlist) => playlist.id));

  const serialized = playlists.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    playCount: playCountMap.get(p.id) ?? 0,
  }));

  return <LibraryView playlists={serialized} />;
}
