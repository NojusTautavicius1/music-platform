"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SongIdSchema = z.object({ songId: z.string().min(1) });

export async function toggleLike(
  songId: string
): Promise<{ ok: true; isLiked: boolean } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.email) {
    return { ok: false, error: "Not authenticated" };
  }

  const parsed = SongIdSchema.safeParse({ songId });
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return { ok: false, error: "User not found" };

  const existing = await prisma.likedSong.findUnique({
    where: { userId_songId: { userId: user.id, songId } },
  });

  if (existing) {
    await prisma.likedSong.delete({
      where: { userId_songId: { userId: user.id, songId } },
    });
    revalidatePath("/library/liked");
    return { ok: true, isLiked: false };
  } else {
    await prisma.likedSong.create({
      data: { userId: user.id, songId },
    });
    revalidatePath("/library/liked");
    return { ok: true, isLiked: true };
  }
}
