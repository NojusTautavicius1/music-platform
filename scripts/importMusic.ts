/**
 * Music library import pipeline.
 *
 * Usage:
 *   npm run import-music
 *
 * Prerequisites:
 *   Place audio files (mp3/flac/wav/ogg) in:
 *     scripts/music-source/<genre>/<filename>.<ext>
 *
 *   e.g.
 *     scripts/music-source/electronic/some-track.mp3
 *     scripts/music-source/jazz/another-song.flac
 *
 * Each file is:
 *   1. Read for ID3/Vorbis tags + technical metadata via music-metadata
 *   2. Copied to public/audio/<songId>.<ext>
 *   3. Cover art extracted to public/covers/<songId>.jpg (or OG fallback used)
 *   4. Upserted in the Song table (idempotent: matched by title + artist)
 *
 * Env vars used:
 *   DATABASE_URL            — PostgreSQL connection string
 *   MUSIC_STORAGE_BASE_URL  — Base URL for audio files (default: /audio)
 *   COVER_BASE_URL          — Base URL for covers (default: /covers)
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import * as mm from "music-metadata";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// ─── Config ──────────────────────────────────────────────────────────────────

const MUSIC_SOURCE_DIR = path.resolve("scripts/music-source");
const PUBLIC_AUDIO_DIR = path.resolve("public/audio");
const PUBLIC_COVERS_DIR = path.resolve("public/covers");
const AUDIO_BASE_URL = process.env.MUSIC_STORAGE_BASE_URL ?? "/audio";
const COVER_BASE_URL = process.env.COVER_BASE_URL ?? "/covers";
const SUPPORTED_EXTS = new Set([".mp3", ".flac", ".wav", ".ogg", ".aac", ".m4a"]);

// Licence strings typically embedded in FMA/Jamendo files
const LICENSE_DISPLAY_MAP: Record<string, string> = {
  "creativecommons.org/licenses/by/": "CC-BY-4.0",
  "creativecommons.org/licenses/by-sa/": "CC-BY-SA-4.0",
  "creativecommons.org/licenses/by-nd/": "CC-BY-ND-4.0",
  "creativecommons.org/licenses/by-nc/": "CC-BY-NC-4.0",
  "creativecommons.org/licenses/by-nc-sa/": "CC-BY-NC-SA-4.0",
  "creativecommons.org/licenses/by-nc-nd/": "CC-BY-NC-ND-4.0",
  "creativecommons.org/publicdomain/zero/": "CC0-1.0",
};

// ─── DB ──────────────────────────────────────────────────────────────────────

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeLicense(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  for (const [fragment, label] of Object.entries(LICENSE_DISPLAY_MAP)) {
    if (raw.toLowerCase().includes(fragment)) return label;
  }
  return raw.trim() || undefined;
}

/** Recursively walk a directory, yielding absolute file paths. */
function* walkDir(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkDir(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

/** Collect all supported audio files under MUSIC_SOURCE_DIR. */
function collectAudioFiles(): string[] {
  const files: string[] = [];
  for (const fp of walkDir(MUSIC_SOURCE_DIR)) {
    if (SUPPORTED_EXTS.has(path.extname(fp).toLowerCase())) {
      files.push(fp);
    }
  }
  return files;
}

/**
 * Derive the genre from the folder structure.
 * Expects: music-source/<genre>/...
 */
function genreFromPath(filePath: string): string | undefined {
  const rel = path.relative(MUSIC_SOURCE_DIR, filePath);
  const parts = rel.split(path.sep);
  return parts.length >= 2 ? parts[0].toLowerCase() : undefined;
}

/**
 * Extract embedded cover art and save to public/covers/<id>.jpg.
 * Returns the cover URL or the OG-gradient fallback URL.
 */
function extractCover(
  id: string,
  pictures: mm.IPicture[] | undefined
): string {
  const pic = pictures?.find(
    (p) => p.type === "Cover (front)" || p.type === "Other" || !p.type
  ) ?? pictures?.[0];

  if (pic?.data) {
    fs.mkdirSync(PUBLIC_COVERS_DIR, { recursive: true });
    const ext = pic.format?.split("/")[1] ?? "jpg";
    const coverFile = path.join(PUBLIC_COVERS_DIR, `${id}.${ext}`);
    fs.writeFileSync(coverFile, pic.data);
    return `${COVER_BASE_URL}/${id}.${ext}`;
  }

  // Gradient placeholder via the existing OG route
  return `/api/og?seed=${id}`;
}

// ─── Main ────────────────────────────────────────────────────────────────────

/** Content hash -> song id for files already in public/audio, so a fresh database gets the same ids back. */
function indexPublishedAudio(): Map<string, string> {
  const byHash = new Map<string, string>();
  if (!fs.existsSync(PUBLIC_AUDIO_DIR)) return byHash;
  for (const name of fs.readdirSync(PUBLIC_AUDIO_DIR)) {
    if (!SUPPORTED_EXTS.has(path.extname(name).toLowerCase())) continue;
    byHash.set(hashFile(path.join(PUBLIC_AUDIO_DIR, name)), path.basename(name, path.extname(name)));
  }
  return byHash;
}

function hashFile(filePath: string): string {
  return createHash("sha1").update(fs.readFileSync(filePath)).digest("hex");
}

async function main() {
  fs.mkdirSync(PUBLIC_AUDIO_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_COVERS_DIR, { recursive: true });

  const files = collectAudioFiles();

  if (files.length === 0) {
    console.log(
      `No audio files found in ${MUSIC_SOURCE_DIR}\n` +
        `Create genre subfolders and place .mp3/.flac/.wav files there:\n` +
        `  scripts/music-source/electronic/track.mp3\n` +
        `  scripts/music-source/jazz/song.flac\n`
    );
    return;
  }

  console.log(`Found ${files.length} audio file(s). Starting import…\n`);

  const published = indexPublishedAudio();

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < files.length; i++) {
    const filePath = files[i];
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath);

    try {
      // ── 1. Read metadata ─────────────────────────────────────────────────
      const meta = await mm.parseFile(filePath, { skipCovers: false });
      const { common, format } = meta;

      const title = common.title?.trim() || path.basename(filePath, ext);
      const artist = common.artist?.trim() || common.albumartist?.trim() || "Unknown Artist";
      const album = common.album?.trim() || null;
      const genre = genreFromPath(filePath) ?? common.genre?.[0]?.toLowerCase() ?? null;
      const durationSec = format.duration ? Math.round(format.duration) : 0;
      const bitrate = format.bitrate ? Math.round(format.bitrate / 1000) : null; // kbps
      const sampleRate = format.sampleRate ?? null;
      const mimeType = format.container
        ? `audio/${format.container.toLowerCase().replace("mpeg", "mpeg")}`
        : "audio/mpeg";

      const rawLicense =
        (common as unknown as Record<string, string | undefined>)["license"] ??
        undefined;
      const license = normalizeLicense(rawLicense);
      const licenseAttribution =
        license && artist !== "Unknown Artist"
          ? `${artist}${common.album ? ` — ${common.album}` : ""}`
          : undefined;

      // FMA files sometimes embed a source URL in the comment field
      const firstComment = common.comment?.[0];
      const commentText = typeof firstComment === "string" ? firstComment : firstComment?.text;
      const sourceUrl = commentText?.startsWith("http") ? commentText : undefined;

      // ── 2. Idempotency check ─────────────────────────────────────────────
      const existing = await prisma.song.findFirst({
        where: {
          title: { equals: title, mode: "insensitive" },
          artist: { equals: artist, mode: "insensitive" },
        },
        select: { id: true },
      });

      const id = existing?.id ?? published.get(hashFile(filePath)) ?? randomUUID();

      // ── 3. Copy audio to public/audio ────────────────────────────────────
      const destFilename = `${id}${ext}`;
      const destPath = path.join(PUBLIC_AUDIO_DIR, destFilename);
      if (!fs.existsSync(destPath)) {
        fs.copyFileSync(filePath, destPath);
      }
      const audioUrl = `${AUDIO_BASE_URL}/${destFilename}`;
      const fileSize = fs.statSync(filePath).size;

      // ── 4. Extract / fallback cover ──────────────────────────────────────
      const coverUrl = extractCover(id, common.picture);

      // ── 5. Insert or update Song ─────────────────────────────────────────
      const songData = {
        title,
        artist,
        album,
        genre,
        duration: durationSec,
        audioUrl,
        coverUrl,
        filePath,
        fileSize,
        mimeType,
        bitrate,
        sampleRate,
        license: license ?? null,
        licenseAttribution: licenseAttribution ?? null,
        sourceUrl: sourceUrl ?? null,
      };

      if (existing) {
        await prisma.song.update({ where: { id }, data: songData });
      } else {
        await prisma.song.create({ data: { id, ...songData } });
      }

      const fileSizeMB = (fileSize / 1_048_576).toFixed(1);
      const mins = Math.floor(durationSec / 60);
      const secs = String(durationSec % 60).padStart(2, "0");
      console.log(
        `[${i + 1}/${files.length}] ${existing ? "Updated" : "Imported"} ` +
          `'${title}' by ${artist} ` +
          `(${fileSizeMB} MB, ${mins}:${secs}${genre ? ", " + genre : ""})`
      );
      imported++;
    } catch (err) {
      console.error(`[${i + 1}/${files.length}] ERROR processing ${basename}:`, err);
      errors++;
    }
  }

  console.log(
    `\n✅ Done — ${imported} imported/updated, ${skipped} skipped, ${errors} errors.`
  );

  const total = await prisma.song.count();
  console.log(`   Total songs in DB: ${total}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
