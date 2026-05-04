import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const RATE_LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

export async function GET() {
  const session = await auth().catch(() => null);
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ used: 0, limit: RATE_LIMIT, resetAt: null });
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } }).catch(() => null);
  if (!user) {
    return NextResponse.json({ used: 0, limit: RATE_LIMIT, resetAt: null });
  }

  const windowStart = new Date(Date.now() - WINDOW_MS);
  const used = await prisma.agentQuery.count({
    where: { userId: user.id, createdAt: { gte: windowStart } },
  }).catch(() => 0);

  const oldest = used > 0
    ? await prisma.agentQuery.findFirst({
        where: { userId: user.id, createdAt: { gte: windowStart } },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      }).catch(() => null)
    : null;

  const resetAt = oldest
    ? new Date(oldest.createdAt.getTime() + WINDOW_MS).toISOString()
    : null;

  return NextResponse.json({ used, limit: RATE_LIMIT, resetAt });
}
