import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { embedText } from "./embeddings";

export type SimilarSong = {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  genre: string | null;
  duration: number;
  coverUrl: string | null;
  audioUrl: string | null;
  waveformPeaks: unknown;
};

export async function findSimilarSongs(songId: string, limit = 10): Promise<SimilarSong[]> {
  const n = Prisma.raw(String(Math.min(Math.max(1, limit), 50)));
  return prisma.$queryRaw<SimilarSong[]>`
    SELECT
      s.id, s.title, s.artist, s.album, s.genre, s.duration,
      s."coverUrl", s."audioUrl", s."waveformPeaks"
    FROM "Song" s
    CROSS JOIN (
      SELECT embedding FROM "Song" WHERE id = ${songId} AND embedding IS NOT NULL
    ) ref
    WHERE s.id != ${songId}
      AND s.embedding IS NOT NULL
    ORDER BY s.embedding <=> ref.embedding
    LIMIT ${n}
  `;
}

export async function findSongsByDescription(description: string, limit = 10): Promise<SimilarSong[]> {
  const embedding = await embedText(description);
  const embeddingStr = `[${embedding.join(",")}]`;
  const n = Prisma.raw(String(Math.min(Math.max(1, limit), 50)));
  return prisma.$queryRaw<SimilarSong[]>`
    SELECT
      id, title, artist, album, genre, duration,
      "coverUrl", "audioUrl", "waveformPeaks"
    FROM "Song"
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT ${n}
  `;
}
