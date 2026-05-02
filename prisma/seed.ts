/**
 * Seed script — generates users, playlists, and play history.
 *
 * Run AFTER `npm run import-music` so real songs exist in the DB.
 * Songs are NOT created here; they come from the import pipeline.
 *
 * Usage:
 *   npx prisma db seed
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { faker } from "@faker-js/faker";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  keepAlive: true,
  idleTimeoutMillis: 60_000,
  connectionTimeoutMillis: 10_000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const PLAYLIST_NAMES = [
  "Late Night Vibes",
  "Morning Coffee",
  "Workout Anthems",
  "Chill Sunday",
  "Focus Mode",
  "Road Trip Hits",
  "Rainy Day Jazz",
  "Golden Hour",
  "Deep Focus",
  "Party Starters",
  "Indie Discoveries",
  "Electronic Dreams",
  "Hip Hop Classics",
  "Lo-Fi Study Session",
  "Rock Legends",
];

const SEED_EMAIL = "nojustautavicius007@gmail.com";
const SEED_NAME = "Nojus";

async function main() {
  console.log("🌱 Seeding database…");

  // ── 1. Load real songs from DB ────────────────────────────────────────────
  const songs = await prisma.song.findMany({ select: { id: true, genre: true, coverUrl: true } });

  if (songs.length === 0) {
    console.error(
      "\n❌  No songs found in the database.\n" +
        "    Run `npm run import-music` first, then re-run the seed.\n"
    );
    process.exit(1);
  }

  console.log(`✓ Found ${songs.length} imported song(s).`);

  // ── 2. Clear per-user data (preserves Songs) ──────────────────────────────
  await prisma.generatedPlaylist.deleteMany();
  await prisma.playHistory.deleteMany();
  await prisma.likedSong.deleteMany();
  await prisma.playlistSong.deleteMany();
  await prisma.playlist.deleteMany();

  // ── 3. Upsert primary user (preserves Google OAuth if already signed in) ──
  const user = await prisma.user.upsert({
    where: { email: SEED_EMAIL },
    update: { name: SEED_NAME },
    create: { email: SEED_EMAIL, name: SEED_NAME },
  });
  console.log(`✓ User: ${user.email}`);

  // ── 4. Ghost listener accounts for play-history distribution ─────────────
  const ghostIds: string[] = [];
  for (let g = 0; g < 10; g++) {
    const ghost = await prisma.user.upsert({
      where: { email: `listener${g}@sonara.internal` },
      update: {},
      create: { email: `listener${g}@sonara.internal`, name: faker.person.firstName() },
    });
    ghostIds.push(ghost.id);
  }
  const allUserIds = [user.id, ...ghostIds];

  // ── 5. Playlists ──────────────────────────────────────────────────────────
  for (let i = 0; i < Math.min(PLAYLIST_NAMES.length, 15); i++) {
    const songCount = faker.number.int({ min: 8, max: Math.min(20, songs.length) });
    const selected = faker.helpers.arrayElements(songs, songCount);

    // Pick a cover from one of the selected songs, or fall back to a gradient
    const coverSong = selected.find((s) => s.coverUrl && !s.coverUrl.startsWith("/api/og"));
    const coverUrl =
      coverSong?.coverUrl ??
      `https://picsum.photos/seed/playlist${i}/400`;

    await prisma.playlist.create({
      data: {
        name: PLAYLIST_NAMES[i],
        description: faker.lorem.sentence({ min: 6, max: 14 }),
        isPublic: faker.datatype.boolean({ probability: 0.6 }),
        coverUrl,
        userId: user.id,
        songs: {
          create: selected.map((song, position) => ({
            songId: song.id,
            position,
          })),
        },
      },
    });
    process.stdout.write(`\r✓ Playlists: ${i + 1}/${Math.min(PLAYLIST_NAMES.length, 15)}`);
  }
  console.log();

  // ── 6. Like a random subset of songs for the primary user ────────────────
  const likeCount = Math.min(30, Math.floor(songs.length * 0.3));
  const tolike = faker.helpers.arrayElements(songs, likeCount);
  await prisma.likedSong.createMany({
    data: tolike.map((s) => ({
      userId: user.id,
      songId: s.id,
      likedAt: faker.date.recent({ days: 90 }),
    })),
    skipDuplicates: true,
  });
  console.log(`✓ Liked ${likeCount} songs`);

  // ── 7. Play history with heavy-tail popularity distribution ──────────────
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const popularityOrder = faker.helpers.shuffle([...songs]);
  const batch: Array<{ userId: string; songId: string; playedAt: Date }> = [];

  async function flushBatch() {
    if (batch.length === 0) return;
    const payload = batch.splice(0, batch.length);
    await prisma.playHistory.createMany({ data: payload });
  }

  for (let index = 0; index < popularityOrder.length; index++) {
    const song = popularityOrder[index];
    const bucket = index / Math.max(1, popularityOrder.length - 1);
    let playCount: number;

    if (index === 0) {
      playCount = 8_000;
    } else if (index === 1) {
      playCount = 4_000;
    } else if (index === 2) {
      playCount = 2_000;
    } else if (bucket < 0.15) {
      playCount = faker.number.int({ min: 500, max: 1_500 });
    } else if (bucket < 0.45) {
      playCount = faker.number.int({ min: 100, max: 500 });
    } else {
      playCount = faker.number.int({ min: 10, max: 100 });
    }

    for (let i = 0; i < playCount; i++) {
      batch.push({
        userId: faker.helpers.arrayElement(allUserIds),
        songId: song.id,
        playedAt: faker.date.between({ from: ninetyDaysAgo, to: new Date() }),
      });
      if (batch.length >= 2000) await flushBatch();
    }
    process.stdout.write(`\r✓ Plays seeded for ${index + 1}/${popularityOrder.length} songs`);
  }
  await flushBatch();
  console.log();

  const counts = await Promise.all([
    prisma.song.count(),
    prisma.playlist.count(),
    prisma.playlistSong.count(),
    prisma.user.count(),
    prisma.playHistory.count(),
    prisma.likedSong.count(),
  ]);

  console.log("\n📊 Final counts:");
  console.log(`   Songs:         ${counts[0]}`);
  console.log(`   Playlists:     ${counts[1]}`);
  console.log(`   PlaylistSongs: ${counts[2]}`);
  console.log(`   Users:         ${counts[3]}`);
  console.log(`   PlayHistory:   ${counts[4]}`);
  console.log(`   LikedSongs:    ${counts[5]}`);
  console.log("\n✅ Seed complete.");
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
