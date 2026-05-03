import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { generateSongEmbedding } from "../src/lib/ai/embeddings";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const songs = await prisma.song.findMany({
    where: { embeddingAt: null },
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
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${songs.length} songs without embeddings`);

  let ok = 0;
  let failed = 0;

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    process.stdout.write(`[${i + 1}/${songs.length}] ${song.artist} — ${song.title} ... `);

    try {
      const embedding = await generateSongEmbedding(song);
      const embeddingStr = `[${embedding.join(",")}]`;

      await prisma.$executeRaw`
        UPDATE "Song"
        SET embedding = ${embeddingStr}::vector, "embeddingAt" = NOW()
        WHERE id = ${song.id}
      `;

      process.stdout.write(`✓\n`);
      ok++;
    } catch (e) {
      process.stdout.write(`✗ ${e}\n`);
      failed++;
    }

    // ~3 req/sec to stay within OpenAI rate limits
    if (i < songs.length - 1) await sleep(350);
  }

  console.log(`\n─── Summary ───────────────────────────`);
  console.log(`  OK:     ${ok}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total:  ${songs.length}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
