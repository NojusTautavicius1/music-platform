import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const RawSongSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string(),
  artist: z.string(),
  why: z.string().optional().default(""),
});

const RawAgentResponseSchema = z.object({
  explanation: z.string(),
  songs: z.array(RawSongSchema),
});

const RATE_LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.query || typeof body.query !== "string") {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  // Rate limiting — check per authenticated user
  const session = await auth().catch(() => null);
  const email = session?.user?.email;
  if (email) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } }).catch(() => null);
    if (user) {
      const windowStart = new Date(Date.now() - WINDOW_MS);
      const used = await prisma.agentQuery.count({
        where: { userId: user.id, createdAt: { gte: windowStart } },
      }).catch(() => 0);

      if (used >= RATE_LIMIT) {
        const oldest = await prisma.agentQuery.findFirst({
          where: { userId: user.id, createdAt: { gte: windowStart } },
          orderBy: { createdAt: "asc" },
          select: { createdAt: true },
        }).catch(() => null);
        const resetAt = oldest
          ? new Date(oldest.createdAt.getTime() + WINDOW_MS).toISOString()
          : new Date(Date.now() + WINDOW_MS).toISOString();
        return NextResponse.json({ error: "rate_limit", used, limit: RATE_LIMIT, resetAt }, { status: 429 });
      }
    }
  }

  const agentUrl = process.env.MUSIC_AGENT_URL ?? "http://localhost:4567";

  let agentText: string;
  try {
    const agentRes = await fetch(`${agentUrl}/agent/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: body.query }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!agentRes.ok) throw new Error("agent error");
    agentText = await agentRes.text();
  } catch {
    return NextResponse.json({ error: "agent unavailable" }, { status: 503 });
  }

  let parsed: z.infer<typeof RawAgentResponseSchema>;
  try {
    const json = typeof agentText === "string" ? JSON.parse(agentText) : agentText;
    const result = RawAgentResponseSchema.safeParse(json);
    if (!result.success) throw new Error("bad shape");
    parsed = result.data;
  } catch {
    return NextResponse.json({ error: "invalid agent response" }, { status: 502 });
  }

  const songIds = parsed.songs.map((s) => s.id);
  const dbSongs = await prisma.song.findMany({
    where: { id: { in: songIds } },
    select: { id: true, coverUrl: true, audioUrl: true, duration: true },
  });
  const songMap = new Map(dbSongs.map((s) => [s.id, s]));

  const enrichedSongs = parsed.songs.map((s) => {
    const db = songMap.get(s.id);
    return {
      id: s.id,
      title: s.title,
      artist: s.artist,
      why: s.why,
      coverUrl: db?.coverUrl ?? null,
      audioUrl: db?.audioUrl ?? null,
      duration: db?.duration ?? null,
    };
  });

  if (email) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } }).catch(() => null);
    if (user) {
      await prisma.agentQuery.create({
        data: {
          userId: user.id,
          query: body.query,
          resultCount: enrichedSongs.length,
          agentExplanation: parsed.explanation,
        },
      }).catch(() => {});
    }
  }

  return NextResponse.json({ explanation: parsed.explanation, songs: enrichedSongs });
}
