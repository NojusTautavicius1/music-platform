import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { LRCLine } from "@/app/actions/lyrics";

export type LyricsPayload =
  | { status: "synced"; lines: LRCLine[]; language: string | null; analysis: LyricsAnalysis | null }
  | { status: "plain"; text: string; language: string | null; analysis: LyricsAnalysis | null }
  | { status: "none" };

export type LyricsAnalysis = {
  mood: string | null;
  themes: string[];
  sentiment: number | null;
  keyPhrases: string[];
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ songId: string }> }
) {
  const { songId } = await params;

  const row = await prisma.lyrics.findUnique({ where: { songId } });
  if (!row) {
    return NextResponse.json<LyricsPayload>({ status: "none" });
  }

  const analysis: LyricsAnalysis | null = row.analyzedAt
    ? {
        mood: row.mood,
        themes: row.themes as string[],
        sentiment: row.sentiment,
        keyPhrases: row.keyPhrases as string[],
      }
    : null;

  if (row.syncedJson) {
    return NextResponse.json<LyricsPayload>({
      status: "synced",
      lines: row.syncedJson as LRCLine[],
      language: row.language,
      analysis,
    });
  }

  if (row.plainText) {
    return NextResponse.json<LyricsPayload>({
      status: "plain",
      text: row.plainText,
      language: row.language,
      analysis,
    });
  }

  return NextResponse.json<LyricsPayload>({ status: "none" });
}
