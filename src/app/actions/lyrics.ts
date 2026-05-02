"use server";

import { prisma } from "@/lib/prisma";

export type LRCLine = { time: number; text: string };

function parseLRC(raw: string): LRCLine[] {
  const result: LRCLine[] = [];
  for (const line of raw.split("\n")) {
    // Match [mm:ss.xx] or [mm:ss.xxx]
    const m = line.match(/\[(\d{1,2}):(\d{2})\.(\d{2,3})\](.*)/);
    if (!m) continue;
    const mins = parseInt(m[1], 10);
    const secs = parseInt(m[2], 10);
    const frac = parseInt(m[3].padEnd(3, "0"), 10); // normalise to ms
    const time = mins * 60 + secs + frac / 1000;
    const text = m[4].trim();
    if (text) result.push({ time, text });
  }
  return result.sort((a, b) => a.time - b.time);
}

function detectLanguage(text: string): string {
  if (/[一-鿿]/.test(text)) return "zh";
  if (/[぀-ゟ゠-ヿ]/.test(text)) return "ja";
  if (/[Ѐ-ӿ]/.test(text)) return "ru";
  if (/[؀-ۿ]/.test(text)) return "ar";
  if (/[ऀ-ॿ]/.test(text)) return "hi";
  return "en";
}

export async function fetchLyricsForSong(
  songId: string
): Promise<{ ok: boolean; hasSync: boolean; error?: string }> {
  const song = await prisma.song.findUnique({
    where: { id: songId },
    select: { title: true, artist: true, duration: true },
  });
  if (!song) return { ok: false, hasSync: false, error: "Song not found" };

  const params = new URLSearchParams({
    artist_name: song.artist,
    track_name: song.title,
    duration: String(song.duration),
  });

  let res: Response;
  try {
    res = await fetch(`https://lrclib.net/api/get?${params}`, {
      headers: { "Lrclib-Client": "Spotis/1.0 (https://github.com/spotis)" },
      cache: "no-store",
    });
  } catch (e) {
    return { ok: false, hasSync: false, error: `Network error: ${e}` };
  }

  if (res.status === 404) {
    // Store an empty record so we don't retry endlessly
    await prisma.lyrics.upsert({
      where: { songId },
      create: { songId, source: "lrclib" },
      update: { fetchedAt: new Date() },
    });
    return { ok: false, hasSync: false, error: "Not found in LRCLIB" };
  }

  if (!res.ok) {
    return { ok: false, hasSync: false, error: `LRCLIB ${res.status}` };
  }

  const data = await res.json();
  const plainText: string | null = data.plainLyrics ?? null;
  const rawSynced: string | null = data.syncedLyrics ?? null;

  const syncedLines = rawSynced ? parseLRC(rawSynced) : null;
  const hasSync = Boolean(syncedLines?.length);
  const language = plainText ? detectLanguage(plainText.slice(0, 300)) : null;

  await prisma.lyrics.upsert({
    where: { songId },
    create: {
      songId,
      plainText,
      syncedJson: syncedLines ?? undefined,
      language,
      source: "lrclib",
    },
    update: {
      plainText,
      syncedJson: syncedLines ?? undefined,
      language,
      fetchedAt: new Date(),
    },
  });

  return { ok: true, hasSync };
}
