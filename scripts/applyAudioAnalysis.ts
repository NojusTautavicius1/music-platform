// Saves audio-analyzer/features.json to the database: bpm, key, loudness, energy, valence, mood.
// Changed songs get their embedding cleared, so `npm run gen-embeddings` rebuilds it with the new tags.
//
//   npm run analyze-audio      (runs analyze.py first, then this)

import "dotenv/config";
import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { analyseLibrary, type RawFeatures } from "../src/lib/audio/mood";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const raw: Record<string, RawFeatures> = JSON.parse(fs.readFileSync("audio-analyzer/features.json", "utf8"));

  // Rank only against songs that exist, so stray files in public/audio don't shift the scale.
  const ids = new Set((await prisma.song.findMany({ select: { id: true } })).map((s) => s.id));
  const entries = Object.entries(raw).filter(([id]) => ids.has(id));
  const analyses = analyseLibrary(entries.map(([, f]) => f));

  const counts: Record<string, number> = {};
  for (const [i, [id, f]] of entries.entries()) {
    const { energy, valence, mood } = analyses[i]!;
    await prisma.song.update({
      where: { id },
      data: {
        bpm: f.bpm,
        key: f.key,
        loudness: f.loudness,
        energy,
        valence,
        mood,
        analyzedAt: new Date(),
        embeddingAt: null,
      },
    });
    counts[mood] = (counts[mood] ?? 0) + 1;
  }

  console.log(`updated ${entries.length} songs (${ids.size - entries.length} without an audio file)`);
  console.log(counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
