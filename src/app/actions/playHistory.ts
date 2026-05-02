"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSongPlayCount } from "@/lib/playCounts";

const SongIdSchema = z.object({ songId: z.string().min(1) });

export async function recordPlay(songId: string): Promise<void> {
  const parsed = SongIdSchema.safeParse({ songId });
  if (!parsed.success) return;

  const session = await auth();
  if (!session?.user?.email) return;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return;

  // Skip if this song was already recorded in the last 30 seconds
  const recent = await prisma.playHistory.findFirst({
    where: {
      userId: user.id,
      songId,
      playedAt: { gte: new Date(Date.now() - 30_000) },
    },
    select: { id: true },
  });
  if (recent) return;

  await prisma.playHistory.create({ data: { userId: user.id, songId } });
  revalidatePath("/");
  revalidatePath("/stats");
  revalidateTag("play-counts", "default");
}

/** Returns the total global play count for a song (for client components). */
export async function fetchSongPlayCount(songId: string): Promise<number> {
  return getSongPlayCount(songId);
}
