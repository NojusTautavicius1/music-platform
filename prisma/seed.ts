import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { faker } from "@faker-js/faker";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const GENRES = [
  "electronic",
  "hip-hop",
  "indie",
  "jazz",
  "lo-fi",
  "pop",
  "rock",
] as const;

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
  console.log("🌱 Seeding database...");

  // Clear in dependency order
  await prisma.playHistory.deleteMany();
  await prisma.likedSong.deleteMany();
  await prisma.playlistSong.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.song.deleteMany();

  // Upsert seed user (preserves Google OAuth accounts if already signed in)
  const user = await prisma.user.upsert({
    where: { email: SEED_EMAIL },
    update: { name: SEED_NAME },
    create: { email: SEED_EMAIL, name: SEED_NAME },
  });

  console.log(`✓ User: ${user.email}`);

  // Create 50 songs — ~7 per genre, cycling through genres
  const songs = [];
  for (let i = 0; i < 50; i++) {
    const genre = GENRES[i % GENRES.length];
    const song = await prisma.song.create({
      data: {
        title: faker.music.songName(),
        artist: faker.person.fullName(),
        album: faker.helpers.maybe(
          () =>
            faker.helpers.arrayElement([
              faker.word.adjective() + " " + faker.word.noun(),
              faker.person.lastName() + " Sessions",
              "Vol. " + faker.number.int({ min: 1, max: 4 }),
            ]),
          { probability: 0.7 }
        ) ?? null,
        genre,
        duration: faker.number.int({ min: 110, max: 360 }),
        audioUrl: "/audio/sample.mp3",
        coverUrl: `https://picsum.photos/seed/song${i}/400`,
      },
    });
    songs.push(song);
    process.stdout.write(`\r✓ Songs: ${i + 1}/50`);
  }
  console.log();

  // Create 15 playlists with 8–20 songs each
  for (let i = 0; i < 15; i++) {
    const songCount = faker.number.int({ min: 8, max: 20 });
    const selected = faker.helpers.arrayElements(songs, songCount);

    await prisma.playlist.create({
      data: {
        name: PLAYLIST_NAMES[i],
        description: faker.lorem.sentence({ min: 6, max: 14 }),
        isPublic: faker.datatype.boolean({ probability: 0.6 }),
        coverUrl: `https://picsum.photos/seed/playlist${i}/400`,
        userId: user.id,
        songs: {
          create: selected.map((song, position) => ({
            songId: song.id,
            position,
          })),
        },
      },
    });
    process.stdout.write(`\r✓ Playlists: ${i + 1}/15`);
  }
  console.log();

  const counts = await Promise.all([
    prisma.song.count(),
    prisma.playlist.count(),
    prisma.playlistSong.count(),
    prisma.user.count(),
  ]);

  console.log("\n📊 Final counts:");
  console.log(`   Songs:         ${counts[0]}`);
  console.log(`   Playlists:     ${counts[1]}`);
  console.log(`   PlaylistSongs: ${counts[2]}`);
  console.log(`   Users:         ${counts[3]}`);
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
