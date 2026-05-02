"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CreatePlaylistSchema = z.object({
  name: z.string().min(1, "Name is required").max(60, "Max 60 characters"),
  description: z.string().max(200, "Max 200 characters").optional(),
  isPublic: z.boolean().default(false),
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
        description: parsed.data.description?.trim() || null,
        isPublic: parsed.data.isPublic,
        userId: user.id,
      },
      select: { id: true },
    });

    revalidatePath("/library");
    revalidateTag("user-playlists", "default");

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

export async function createPlaylistWithSong(
  songId: string,
  name?: string
): Promise<{ ok: true; id: string; name: string } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.email) return { ok: false, error: "Not authenticated" };

  const [user, song] = await Promise.all([
    prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    }),
    prisma.song.findUnique({
      where: { id: songId },
      select: { title: true },
    }),
  ]);
  if (!user) return { ok: false, error: "User not found" };
  if (!song) return { ok: false, error: "Song not found" };

  const playlistName = name?.trim() || `${song.title} mix`;

  const playlist = await prisma.playlist.create({
    data: {
      name: playlistName,
      userId: user.id,
      isPublic: false,
      songs: { create: [{ songId, position: 1 }] },
    },
    select: { id: true },
  });

  revalidatePath("/library");
  revalidateTag("user-playlists", "default");
  return { ok: true, id: playlist.id, name: playlistName };
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

// ─── Search songs not already in a playlist ───────────────────────────────────

export type SuggestedSong = {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  genre: string | null;
  duration: number;
  coverUrl: string | null;
  audioUrl: string | null;
};

export async function searchSongsNotInPlaylist(
  playlistId: string,
  query: string,
  page: number = 1
): Promise<{ ok: true; songs: SuggestedSong[]; hasMore: boolean } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.email) return { ok: false, error: "Not authenticated" };

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    include: {
      songs: { select: { songId: true } },
      user: { select: { email: true } },
    },
  });
  if (!playlist) return { ok: false, error: "Playlist not found" };
  if (!playlist.isPublic && playlist.user.email !== session.user.email) {
    return { ok: false, error: "Playlist not found" };
  }

  const existingIds = playlist.songs.map((ps) => ps.songId);

  const take = 20;
  const skip = (page - 1) * take;

  const where = {
    id: { notIn: existingIds.length > 0 ? existingIds : ["__none__"] },
    ...(query.trim()
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            { artist: { contains: query, mode: "insensitive" as const } },
            { album: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [songs, total] = await Promise.all([
    prisma.song.findMany({
      where,
      orderBy: { title: "asc" },
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
  ]);

  return { ok: true, songs, hasMore: skip + songs.length < total };
}

// ─── Reorder songs within a playlist ─────────────────────────────────────────
// Moves the song at fromIndex to toIndex, shifting the affected range by ±1.
// Updates only the rows in [min, max] in a single transaction.

export async function reorderPlaylistSongs(
  playlistId: string,
  fromIndex: number,
  toIndex: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (fromIndex === toIndex) return { ok: true };

  const session = await auth();
  if (!session?.user?.email) return { ok: false, error: "Not authenticated" };

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    include: {
      user: { select: { email: true } },
      songs: { orderBy: { position: "asc" }, select: { songId: true, position: true } },
    },
  });
  if (!playlist || playlist.user.email !== session.user.email) {
    return { ok: false, error: "Playlist not found" };
  }

  const songs = playlist.songs;
  if (fromIndex < 0 || fromIndex >= songs.length || toIndex < 0 || toIndex >= songs.length) {
    return { ok: false, error: "Index out of range" };
  }

  // Build the reordered list and only update rows whose position changed
  const reordered = [...songs];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);

  const updates = reordered
    .map((s, i) => ({ songId: s.songId, newPosition: i }))
    .filter((u, i) => songs[i]?.songId !== u.songId || songs[i]?.position !== u.newPosition);

  await prisma.$transaction(
    updates.map(({ songId, newPosition }) =>
      prisma.playlistSong.update({
        where: { playlistId_songId: { playlistId, songId } },
        data: { position: newPosition },
      })
    )
  );

  revalidatePath(`/library/playlist/${playlistId}`);
  return { ok: true };
}

// ─── Reorder sidebar playlists ────────────────────────────────────────────────
// Receives the full ordered list of playlist IDs (as the user sees them) and
// assigns each playlist a sortOrder equal to its index in that list.

export async function reorderPlaylists(
  orderedIds: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const session = await auth();
  if (!session?.user?.email) return { ok: false, error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return { ok: false, error: "User not found" };

  // Verify all playlists belong to this user
  const count = await prisma.playlist.count({
    where: { id: { in: orderedIds }, userId: user.id },
  });
  if (count !== orderedIds.length) return { ok: false, error: "Invalid playlists" };

  await prisma.$transaction(
    orderedIds.map((id, i) =>
      prisma.playlist.update({ where: { id }, data: { sortOrder: i } })
    )
  );

  revalidatePath("/library");
  revalidatePath("/");
  return { ok: true };
}
