"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  album: z.string().max(200).optional(),
  genre: z.string().max(100).optional(),
  duration: z.number().int().positive(),
  audioUrl: z.string().url(),
  coverUrl: z.string().url().optional(),
});

export async function uploadSong(input: z.infer<typeof schema>) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const { title, artist, album, genre, duration, audioUrl, coverUrl } = parsed.data;

  try {
    const song = await prisma.song.create({
      data: { title, artist, album, genre, duration, audioUrl, coverUrl },
    });

    revalidatePath("/");
    revalidatePath("/browse");
    return { success: true, songId: song.id };
  } catch (err) {
    console.error("[uploadSong]", err);
    return { error: "Failed to save song" };
  }
}
