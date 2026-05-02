// This is the v1 of lyrical analysis. The Ruby agent in /agent will consume these features alongside audio features. Future: train a custom model on aggregated user feedback.

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const AnalysisSchema = z.object({
  sentiment: z.number().min(-1).max(1),
  themes: z.array(z.string()).min(1).max(5),
  mood: z.enum([
    "happy", "sad", "angry", "longing", "celebratory",
    "melancholic", "energetic", "peaceful", "romantic", "anxious",
  ]),
  keyPhrases: z.array(z.string()).min(1).max(5),
});

export type LyricsAnalysis = z.infer<typeof AnalysisSchema>;

function buildPrompt(lyricsText: string, title: string, artist: string, strict = false): string {
  const prefix = strict
    ? "RETURN ONLY VALID JSON. NO OTHER TEXT WHATSOEVER.\n\n"
    : "";
  return `${prefix}Analyze the following song lyrics. Return ONLY valid JSON matching this exact shape:
{
  "sentiment": number from -1 (very negative/sad) to 1 (very positive/happy),
  "themes": array of 3-5 short strings (e.g., "love", "loss", "rebellion"),
  "mood": one of: "happy", "sad", "angry", "longing", "celebratory", "melancholic", "energetic", "peaceful", "romantic", "anxious",
  "keyPhrases": array of 3-5 most striking or representative short phrases from the lyrics (each 3-8 words)
}

Song: "${title}" by ${artist}

Lyrics:
${lyricsText}`;
}

async function callClaude(prompt: string): Promise<string> {
  const msg = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });
  const block = msg.content.find((b) => b.type === "text");
  return block?.type === "text" ? block.text.trim() : "";
}

function parseJson(raw: string): LyricsAnalysis | null {
  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    const result = AnalysisSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export async function analyzeLyrics(
  lyricsText: string,
  songMeta: { title: string; artist: string }
): Promise<LyricsAnalysis> {
  const { title, artist } = songMeta;

  const raw = await callClaude(buildPrompt(lyricsText, title, artist));
  const first = parseJson(raw);
  if (first) return first;

  // Retry once with stricter framing
  const raw2 = await callClaude(buildPrompt(lyricsText, title, artist, true));
  const second = parseJson(raw2);
  if (second) return second;

  throw new Error(`Failed to parse Claude response: ${raw2.slice(0, 200)}`);
}
