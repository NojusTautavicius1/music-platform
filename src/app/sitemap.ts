import { type MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://sonara.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const playlists = await prisma.playlist.findMany({
    where: { isPublic: true },
    select: { id: true, updatedAt: true },
  });

  return [
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE}/browse`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...playlists.map((p) => ({
      url: `${BASE}/library/playlist/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
