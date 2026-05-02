import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { fetchLyricsForSong } from "../src/app/actions/lyrics";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const songs = await prisma.song.findMany({
    where: { lyrics: { is: null } },
    select: { id: true, title: true, artist: true },
    orderBy: { title: "asc" },
  });

  console.log(`Found ${songs.length} songs without lyrics`);

  let synced = 0;
  let plain = 0;
  let notFound = 0;
  let errors = 0;

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    process.stdout.write(
      `[${i + 1}/${songs.length}] ${song.artist} — ${song.title} ... `
    );

    try {
      const result = await fetchLyricsForSong(song.id);
      if (result.ok) {
        if (result.hasSync) {
          process.stdout.write("✓ synced\n");
          synced++;
        } else {
          process.stdout.write("✓ plain\n");
          plain++;
        }
      } else {
        process.stdout.write(`✗ ${result.error}\n`);
        notFound++;
      }
    } catch (e) {
      process.stdout.write(`ERROR: ${e}\n`);
      errors++;
    }

    // LRCLIB rate limit: ~1 req/sec
    if (i < songs.length - 1) await sleep(1100);
  }

  console.log("\n─── Summary ───────────────────────────");
  console.log(`  Synced:    ${synced}`);
  console.log(`  Plain:     ${plain}`);
  console.log(`  Not found: ${notFound}`);
  console.log(`  Errors:    ${errors}`);
  console.log(`  Total:     ${songs.length}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
