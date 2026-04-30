"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CreatePlaylistSchema = z.object({
  name: z.string().min(1, "Name is required").max(60, "Max 60 characters"),
  description: z.string().max(200, "Max 200 characters"),
  isPublic: z.boolean(),
});

const UpdatePlaylistSchema = z.object({
  id: z.string().min(1, "Playlist id is required"),
  name: z.string().min(1, "Name is required").max(60, "Max 60 characters"),
  description: z.string().max(200, "Max 200 characters").optional(),
  isPublic: z.boolean(),
  coverUrl: z.string().url().optional().nullable(),
});

const PlaylistSongSchema = z.object({
  playlistId: z.string().min(1, "Playlist id is required"),
  songId: z.string().min(1, "Song id is required"),
});

const PlaylistIdSchema = z.object({
  playlistId: z.string().min(1, "Playlist id is required"),
});

type CreatePlaylistInput = z.infer<typeof CreatePlaylistSchema>;
type UpdatePlaylistInput = z.infer<typeof UpdatePlaylistSchema>;

export async function createPlaylist(
  input: CreatePlaylistInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.email) {
    return { ok: false, error: "Not authenticated" };
  }

  const parsed = CreatePlaylistSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input" };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    return { ok: false, error: "User not found" };
  }

  try {
    const playlist = await prisma.playlist.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        isPublic: parsed.data.isPublic,
        userId: user.id,
      },
      select: { id: true },
    });

    revalidatePath("/library");

    return { ok: true, id: playlist.id };
  } catch {
    return { ok: false, error: "Failed to create playlist" };
  }
}

// ─── Update playlist metadata ───────────────────────────────────────────────

export async function updatePlaylist(
  input: UpdatePlaylistInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.email) {
    return { ok: false, error: "Not authenticated" };
  }

  const parsed = UpdatePlaylistSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid input" };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) {
    return { ok: false, error: "User not found" };
  }

  const playlist = await prisma.playlist.findUnique({
    where: { id: parsed.data.id },
    select: { userId: true },
  });
  if (!playlist || playlist.userId !== user.id) {
    return { ok: false, error: "Playlist not found" };
  }

  const description = parsed.data.description?.trim() || null;
  const coverUrl = parsed.data.coverUrl?.trim() || null;

  try {
    await prisma.playlist.update({
      where: { id: parsed.data.id },
      data: {
        name: parsed.data.name,
        description,
        isPublic: parsed.data.isPublic,
        coverUrl,
      },
    });

    revalidatePath(`/library/playlist/${parsed.data.id}`);
    revalidatePath("/library");

    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to update playlist" };
  }
}

// ─── Add song to existing playlist ───────────────────────────────────────────

export async function addSongToPlaylist(
  playlistId: string,
  songId: string
): Promise<{ ok: true; playlistName: string } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.email) return { ok: false, error: "Not authenticated" };

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    include: { user: { select: { email: true } } },
  });
  if (!playlist || playlist.user.email !== session.user.email) {
    return { ok: false, error: "Playlist not found" };
  }

  // Idempotent — silently pass if already present
  const existing = await prisma.playlistSong.findUnique({
    where: { playlistId_songId: { playlistId, songId } },
  });
  if (existing) return { ok: true, playlistName: playlist.name };

  const agg = await prisma.playlistSong.aggregate({
    where: { playlistId },
    _max: { position: true },
  });
  const position = (agg._max.position ?? -1) + 1;

  await prisma.playlistSong.create({ data: { playlistId, songId, position } });
  revalidatePath(`/library/playlist/${playlistId}`);

  return { ok: true, playlistName: playlist.name };
}

// ─── Create new playlist with one song ───────────────────────────────────────

export async function addSongToNewPlaylist(
  songId: string
): Promise<{ ok: true; id: string; name: string } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.email) return { ok: false, error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return { ok: false, error: "User not found" };

  const count = await prisma.playlist.count({ where: { userId: user.id } });
  const name = `My Playlist #${count + 1}`;

  const playlist = await prisma.playlist.create({
    data: {
      name,
      userId: user.id,
      isPublic: false,
      songs: { create: [{ songId, position: 0 }] },
    },
    select: { id: true },
  });

  revalidatePath("/library");
  return { ok: true, id: playlist.id, name };
}

// ─── Remove song from playlist ──────────────────────────────────────────────

export async function removeSongFromPlaylist(
  playlistId: string,
  songId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.email) return { ok: false, error: "Not authenticated" };

  const parsed = PlaylistSongSchema.safeParse({ playlistId, songId });
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return { ok: false, error: "User not found" };

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    select: { userId: true },
  });
  if (!playlist || playlist.userId !== user.id) {
    return { ok: false, error: "Playlist not found" };
  }

  try {
    await prisma.playlistSong.delete({
      where: { playlistId_songId: { playlistId, songId } },
    });
    revalidatePath(`/library/playlist/${playlistId}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to remove song" };
  }
}

// ─── Delete playlist ────────────────────────────────────────────────────────

export async function deletePlaylist(
  playlistId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.email) return { ok: false, error: "Not authenticated" };

  const parsed = PlaylistIdSchema.safeParse({ playlistId });
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return { ok: false, error: "User not found" };

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    select: { userId: true },
  });
  if (!playlist || playlist.userId !== user.id) {
    return { ok: false, error: "Playlist not found" };
  }

  try {
    await prisma.playlist.delete({ where: { id: playlistId } });
    revalidatePath("/library");
    return { ok: true };
  } catch {
    return { ok: false, error: "Failed to delete playlist" };
  }
}
