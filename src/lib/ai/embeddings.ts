import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type SongForEmbedding = {
  id: string;
  title: string;
  artist: string;
  genre: string | null;
  bpm: number | null;
  mood: string | null;
  key: string | null;
  energy: number | null;
  valence: number | null;
  danceability: number | null;
  acousticness: number | null;
  instrumentalness: number | null;
  lyrics: {
    themes: string[];
    mood: string | null;
    keyPhrases: string[];
  } | null;
};

function energyLabel(v: number | null) {
  if (v === null) return "unknown";
  if (v > 0.66) return "high";
  if (v > 0.33) return "medium";
  return "low";
}

function valenceLabel(v: number | null) {
  if (v === null) return "neutral";
  if (v > 0.6) return "happy";
  if (v < 0.4) return "sad";
  return "neutral";
}

function buildSongText(song: SongForEmbedding): string {
  const lines: string[] = [
    `Title: ${song.title}`,
    `Artist: ${song.artist}`,
  ];
  if (song.genre) lines.push(`Genre: ${song.genre}`);
  if (song.bpm) lines.push(`Tempo: ${Math.round(song.bpm)} BPM`);
  if (song.mood) lines.push(`Audio mood: ${song.mood}`);
  if (song.key) lines.push(`Key: ${song.key}`);
  lines.push(`Energy: ${energyLabel(song.energy)}`);
  lines.push(`Valence: ${valenceLabel(song.valence)}`);
  if (song.danceability !== null)
    lines.push(`Danceability: ${song.danceability > 0.5 ? "high" : "low"}`);
  if (song.acousticness !== null)
    lines.push(`Acoustic: ${song.acousticness > 0.5 ? "yes" : "no"}`);
  if (song.instrumentalness !== null && song.instrumentalness > 0.5)
    lines.push("Instrumental: yes");
  if (song.lyrics) {
    if (song.lyrics.themes.length > 0)
      lines.push(`Lyrical themes: ${song.lyrics.themes.join(", ")}`);
    if (song.lyrics.mood)
      lines.push(`Lyrical mood: ${song.lyrics.mood}`);
    if (song.lyrics.keyPhrases.length > 0)
      lines.push(`Sample lyrics: ${song.lyrics.keyPhrases.slice(0, 3).join(" | ")}`);
  }
  return lines.join("\n");
}

export async function generateSongEmbedding(song: SongForEmbedding): Promise<number[]> {
  const text = buildSongText(song);
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 1536,
  });
  return response.data[0].embedding;
}

export async function embedText(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 1536,
  });
  return response.data[0].embedding;
}

export async function generateAndCacheEmbedding(songId: string): Promise<number[] | null> {
  const song = await prisma.song.findUnique({
    where: { id: songId },
    select: {
      id: true,
      title: true,
      artist: true,
      genre: true,
      bpm: true,
      mood: true,
      key: true,
      energy: true,
      valence: true,
      danceability: true,
      acousticness: true,
      instrumentalness: true,
      lyrics: { select: { themes: true, mood: true, keyPhrases: true } },
    },
  });
  if (!song) return null;

  const embedding = await generateSongEmbedding(song);
  const embeddingStr = `[${embedding.join(",")}]`;

  await prisma.$executeRaw`
    UPDATE "Song"
    SET embedding = ${embeddingStr}::vector, "embeddingAt" = NOW()
    WHERE id = ${songId}
  `;

  return embedding;
}
