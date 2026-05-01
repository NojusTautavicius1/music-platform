"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function recordPlay(songId: string): Promise<void> {
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
}
