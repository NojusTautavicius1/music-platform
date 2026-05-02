/**
 * FMA Small extraction helper.
 *
 * Extracts MP3s from fma_small.zip, reads their ID3 genre tags,
 * maps FMA genres to app genres, and places up to MAX_PER_GENRE
 * files per genre into scripts/music-source/<genre>/.
 *
 * Usage:
 *   npm run extract-fma
 *   npm run extract-fma -- --max 30   (default: 25 per genre)
 *   npm run extract-fma -- --zip path/to/other.zip
 *
 * After this, run:
 *   npm run import-music
 */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync, spawnSync } from "node:child_process";
import * as mm from "music-metadata";

// ─── Config ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const argMax    = args.indexOf("--max");
const argZip    = args.indexOf("--zip");
const MAX_PER_GENRE = argMax  !== -1 ? parseInt(args[argMax  + 1], 10) : 25;
const ZIP_PATH      = argZip  !== -1 ? path.resolve(args[argZip + 1])
                                     : path.resolve("scripts/music-source/fma_small.zip");

const MUSIC_SOURCE_DIR = path.resolve("scripts/music-source");
const TEMP_DIR         = path.join(MUSIC_SOURCE_DIR, "_fma_temp");
const SEVENZIP         = findSevenZip();

// ─── FMA genre → app genre mapping ───────────────────────────────────────────
// FMA Small balanced genres: Electronic, Experimental, Folk, Hip-Hop,
//                            Instrumental, International, Pop, Rock
const GENRE_MAP: Record<string, string> = {
  electronic:    "electronic",
  experimental:  "lo-fi",
  folk:          "indie",
  "hip-hop":     "hip-hop",
  hiphop:        "hip-hop",
  rap:           "hip-hop",
  instrumental:  "jazz",
  international: "indie",
  pop:           "pop",
  rock:          "rock",
  jazz:          "jazz",
  classical:     "classical",
  "lo-fi":       "lo-fi",
  lofi:          "lo-fi",
  indie:         "indie",
  "indie rock":  "indie",
  "indie pop":   "indie",
  soul:          "pop",
  funk:          "pop",
  blues:         "rock",
  metal:         "rock",
  punk:          "rock",
  alternative:   "rock",
  "alternative rock": "rock",
  ambient:       "lo-fi",
  country:       "indie",
  dance:         "electronic",
  techno:        "electronic",
  house:         "electronic",
  edm:           "electronic",
};

function mapGenre(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const normalized = raw.toLowerCase().trim();
  if (GENRE_MAP[normalized]) return GENRE_MAP[normalized];
  // Partial match
  for (const [key, val] of Object.entries(GENRE_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) return val;
  }
  return undefined;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function findSevenZip(): string {
  const candidates = [
    "C:/Program Files/7-Zip/7z.exe",
    "C:/Program Files (x86)/7-Zip/7z.exe",
    "7z",
    "7za",
  ];
  for (const c of candidates) {
    try {
      const r = spawnSync(c, ["i"], { encoding: "utf8" });
      if (r.status === 0 || r.stdout?.includes("7-Zip")) return c;
    } catch { /* skip */ }
  }
  console.error(
    "❌  7-Zip not found. Install from https://www.7-zip.org/ and ensure 7z.exe is in PATH."
  );
  process.exit(1);
}

function sevenZipExtract(zipPath: string, destDir: string) {
  fs.mkdirSync(destDir, { recursive: true });

  console.log(`\n📦 Extracting MP3s from zip → ${destDir}`);
  console.log("   (This may take several minutes for a 7 GB file…)\n");

  // e = extract flat (no subfolders), -y = yes to all, -r = recursive
  const result = spawnSync(
    SEVENZIP,
    ["e", zipPath, "-o" + destDir, "*.mp3", "-y", "-r"],
    { stdio: "inherit", encoding: "utf8" }
  );

  if (result.status !== 0) {
    console.error("❌  7-Zip extraction failed.");
    process.exit(1);
  }
}

function collectMp3s(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".mp3"))
    .map((f) => path.join(dir, f));
}

// Read ID3 genre from one file. Returns the app genre or undefined.
async function readGenre(filePath: string): Promise<string | undefined> {
  try {
    const meta = await mm.parseFile(filePath, { skipCovers: true, duration: false });
    const raw = meta.common.genre?.[0];
    return mapGenre(raw);
  } catch {
    return undefined;
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🎵 FMA Small → music-source extractor");
  console.log(`   ZIP:          ${ZIP_PATH}`);
  console.log(`   Max per genre: ${MAX_PER_GENRE}`);
  console.log(`   Target total:  ~${MAX_PER_GENRE * 8} songs\n`);

  if (!fs.existsSync(ZIP_PATH)) {
    console.error(`❌  ZIP not found: ${ZIP_PATH}`);
    process.exit(1);
  }

  // ── Step 1: Extract (or reuse existing temp dir) ──────────────────────────
  const existingInTemp = fs.existsSync(TEMP_DIR)
    ? collectMp3s(TEMP_DIR)
    : [];

  if (existingInTemp.length > 100) {
    console.log(
      `♻️  Found ${existingInTemp.length} files already in temp — skipping extraction.`
    );
  } else {
    sevenZipExtract(ZIP_PATH, TEMP_DIR);
  }

  const allFiles = collectMp3s(TEMP_DIR);
  console.log(`\n✓ ${allFiles.length} MP3 files in temp folder.`);

  // ── Step 2: Read ID3 genres in parallel batches ───────────────────────────
  console.log("🔍 Reading ID3 genre tags…");

  const BATCH = 100;
  const taggedFiles: Array<{ file: string; appGenre: string }> = [];
  let noGenre = 0;

  for (let i = 0; i < allFiles.length; i += BATCH) {
    const batch = allFiles.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (f) => ({ file: f, appGenre: await readGenre(f) }))
    );
    for (const r of results) {
      if (r.appGenre) {
        taggedFiles.push(r as { file: string; appGenre: string });
      } else {
        noGenre++;
      }
    }
    process.stdout.write(
      `\r   Processed ${Math.min(i + BATCH, allFiles.length)}/${allFiles.length} ` +
        `(${taggedFiles.length} with genre, ${noGenre} without)   `
    );
  }
  console.log();

  // ── Step 3: Select up to MAX_PER_GENRE per genre ──────────────────────────
  const byGenre: Record<string, string[]> = {};
  for (const { file, appGenre } of taggedFiles) {
    if (!byGenre[appGenre]) byGenre[appGenre] = [];
    if (byGenre[appGenre].length < MAX_PER_GENRE) {
      byGenre[appGenre].push(file);
    }
  }

  // For files with no genre, distribute evenly to genres that have fewer songs
  const appGenres = ["electronic", "hip-hop", "indie", "jazz", "lo-fi", "pop", "rock"];
  for (const f of allFiles) {
    if (!taggedFiles.find((t) => t.file === f)) {
      // No genre — assign to the genre with fewest songs
      const target = appGenres.reduce((a, b) =>
        (byGenre[a]?.length ?? 0) <= (byGenre[b]?.length ?? 0) ? a : b
      );
      if (!byGenre[target]) byGenre[target] = [];
      if (byGenre[target].length < MAX_PER_GENRE) {
        byGenre[target].push(f);
      }
    }
  }

  console.log("\n📂 Genre breakdown:");
  let totalSelected = 0;
  for (const [genre, files] of Object.entries(byGenre)) {
    console.log(`   ${genre.padEnd(12)} ${files.length} songs`);
    totalSelected += files.length;
  }
  console.log(`   ${"TOTAL".padEnd(12)} ${totalSelected} songs\n`);

  // ── Step 4: Copy to music-source/<genre>/ ─────────────────────────────────
  console.log("📁 Copying to music-source/<genre>/…");
  let copied = 0;

  for (const [genre, files] of Object.entries(byGenre)) {
    const destDir = path.join(MUSIC_SOURCE_DIR, genre);
    fs.mkdirSync(destDir, { recursive: true });

    for (const src of files) {
      const destFile = path.join(destDir, path.basename(src));
      if (!fs.existsSync(destFile)) {
        fs.copyFileSync(src, destFile);
      }
      copied++;
      process.stdout.write(`\r   Copied ${copied}/${totalSelected}   `);
    }
  }
  console.log("\n");

  // ── Step 5: Clean up temp dir ──────────────────────────────────────────────
  console.log("🧹 Cleaning up temp folder…");
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });

  console.log("✅ Done!\n");
  console.log("Next steps:");
  console.log("  npm run import-music   ← reads tags, copies to public/audio, inserts DB records");
  console.log("  npx prisma db seed     ← generates playlists + play history\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
