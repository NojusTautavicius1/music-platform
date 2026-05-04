/**
 * Uploads all local audio files to UploadThing and updates DB audioUrl fields.
 * Run: npx tsx --env-file=.env scripts/uploadAudioToUT.ts
 */
import fs from "node:fs";
import path from "node:path";
import { UTApi } from "uploadthing/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const utapi = new UTApi({ token: process.env.UPLOADTHING_TOKEN! });

const AUDIO_DIR = path.join(process.cwd(), "public", "audio");

async function main() {
  const files = fs.readdirSync(AUDIO_DIR).filter((f) => f.endsWith(".mp3"));
  console.log(`Found ${files.length} audio files`);

  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const filePath = path.join(AUDIO_DIR, filename);

    // Check if song in DB still uses local URL for this file
    const song = await prisma.song.findFirst({
      where: { audioUrl: { endsWith: filename } },
      select: { id: true, audioUrl: true },
    });

    if (!song) {
      console.log(`[${i + 1}/${files.length}] SKIP (not in DB): ${filename}`);
      skipped++;
      continue;
    }

    // Already uploaded (URL contains uploadthing/utfs)
    if (song.audioUrl?.includes("utfs.io") || song.audioUrl?.includes("ufs.sh")) {
      console.log(`[${i + 1}/${files.length}] SKIP (already UT): ${filename}`);
      skipped++;
      continue;
    }

    console.log(`[${i + 1}/${files.length}] Uploading: ${filename}`);

    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer], { type: "audio/mpeg" });
    const file = new File([blob], filename, { type: "audio/mpeg" });

    const res = await utapi.uploadFiles(file);

    if (res.error) {
      console.error(`  ERROR: ${res.error.message}`);
      continue;
    }

    const newUrl = res.data.ufsUrl ?? res.data.url;
    await prisma.song.update({
      where: { id: song.id },
      data: { audioUrl: newUrl },
    });

    console.log(`  ✓ ${newUrl}`);
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
