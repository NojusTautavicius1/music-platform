import { NextRequest, NextResponse } from "next/server";
import { findSimilarSongs } from "@/lib/ai/similarity";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ songs: [] });

  try {
    const songs = await findSimilarSongs(id, 10);
    return NextResponse.json({ songs });
  } catch {
    return NextResponse.json({ songs: [] });
  }
}
