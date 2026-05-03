import "dotenv/config";
import { prisma } from "../src/lib/prisma";

async function main() {
  const result = await prisma.song.updateMany({
    where: { coverUrl: { contains: "/api/og" } },
    data: { coverUrl: null },
  });
  console.log(`Cleared ${result.count} OG image cover URLs`);
  await prisma.$disconnect();
}

main();
