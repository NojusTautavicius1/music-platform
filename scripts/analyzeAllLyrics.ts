import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { analyzeLyrics } from "../src/lib/ai/lyricsAnalyzer";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const rows = await prisma.lyrics.findMany({
    where: { analyzedAt: null, plainText: { not: null } },
    select: {
      id: true,
      songId: true,
      plainText: true,
      song: { select: { title: true, artist: true } },
    },
    orderBy: { fetchedAt: "asc" },
  });

  console.log(`Found ${rows.length} lyrics rows to analyze`);

  let ok = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const { title, artist } = row.song;
    process.stdout.write(`[${i + 1}/${rows.length}] ${artist} — ${title} ... `);

    try {
      const analysis = await analyzeLyrics(row.plainText!, { title, artist });

      await prisma.lyrics.update({
        where: { id: row.id },
        data: {
          sentiment: analysis.sentiment,
          themes: analysis.themes,
          mood: analysis.mood,
          keyPhrases: analysis.keyPhrases,
          analyzedAt: new Date(),
        },
      });

      process.stdout.write(
        `✓ mood=${analysis.mood} sentiment=${analysis.sentiment.toFixed(2)} themes=[${analysis.themes.join(", ")}]\n`
      );
      ok++;
    } catch (e) {
      process.stdout.write(`✗ ${e}\n`);
      failed++;
    }

    // 1 req/sec to stay within Anthropic free-tier limits
    if (i < rows.length - 1) await sleep(1100);
  }

  console.log(`\n─── Summary ───────────────────────────`);
  console.log(`  OK:     ${ok}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total:  ${rows.length}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
