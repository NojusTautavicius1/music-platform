import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat, betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { embedText } from "@/lib/ai/embeddings";

// "Ask Sonara": Claude picks songs from the library through a few SQL-backed tools.
// Replaces the old Ruby/Sinatra service, so the agent runs inside the Next.js app.

const client = new Anthropic();

type SongHit = { id: string; title: string; artist: string; genre: string | null; mood: string | null; bpm: number | null };

const limit = z.number().int().min(1).max(10).optional();
const take = (n?: number) => n ?? 5;

const searchByMood = betaZodTool({
  name: "search_by_mood",
  description:
    "Songs whose audio mood matches a word like happy, sad, energetic, calm, melancholic, romantic, uplifting. Returns [] when no song is tagged with that mood.",
  inputSchema: z.object({ mood: z.string(), limit }),
  run: async ({ mood, limit }) =>
    JSON.stringify(
      await prisma.$queryRaw<SongHit[]>`
        SELECT id, title, artist, genre, mood, bpm FROM "Song"
        WHERE mood ILIKE ${mood} ORDER BY random() LIMIT ${take(limit)}`,
    ),
});

const searchByBpm = betaZodTool({
  name: "search_by_bpm",
  description:
    "Songs in a tempo range. Running is about 140-170 BPM, studying 60-90, dancing 120-140.",
  inputSchema: z.object({ min_bpm: z.number(), max_bpm: z.number(), limit }),
  run: async ({ min_bpm, max_bpm, limit }) =>
    JSON.stringify(
      await prisma.$queryRaw<SongHit[]>`
        SELECT id, title, artist, genre, mood, bpm FROM "Song"
        WHERE bpm BETWEEN ${min_bpm} AND ${max_bpm} ORDER BY random() LIMIT ${take(limit)}`,
    ),
});

const searchByLyricalTheme = betaZodTool({
  name: "search_by_lyrical_theme",
  description: "Songs whose analysed lyrics include a theme such as love, loss, freedom, rebellion.",
  inputSchema: z.object({ theme: z.string(), limit }),
  run: async ({ theme, limit }) =>
    JSON.stringify(
      await prisma.$queryRaw<SongHit[]>`
        SELECT s.id, s.title, s.artist, s.genre, s.mood, s.bpm
        FROM "Song" s JOIN "Lyrics" l ON l."songId" = s.id
        WHERE lower(${theme}) = ANY(SELECT lower(t) FROM unnest(l.themes) t)
        ORDER BY random() LIMIT ${take(limit)}`,
    ),
});

const findSimilar = betaZodTool({
  name: "find_similar",
  description: "Songs closest to a given song (by id) in embedding space. Use when the user names a song they like.",
  inputSchema: z.object({ song_id: z.string(), limit }),
  run: async ({ song_id, limit }) =>
    JSON.stringify(
      await prisma.$queryRaw<SongHit[]>`
        SELECT id, title, artist, genre, mood, bpm FROM "Song"
        WHERE id <> ${song_id} AND embedding IS NOT NULL
        ORDER BY embedding <=> (SELECT embedding FROM "Song" WHERE id = ${song_id})
        LIMIT ${take(limit)}`,
    ),
});

const findSongByTitle = betaZodTool({
  name: "find_song_by_title",
  description: "Look up songs by (part of) a title or artist name, to get the id for find_similar.",
  inputSchema: z.object({ text: z.string() }),
  run: async ({ text }) =>
    JSON.stringify(
      await prisma.$queryRaw<SongHit[]>`
        SELECT id, title, artist, genre, mood, bpm FROM "Song"
        WHERE title ILIKE ${"%" + text + "%"} OR artist ILIKE ${"%" + text + "%"} LIMIT 5`,
    ),
});

const semanticSearch = betaZodTool({
  name: "semantic_search",
  description:
    "Free-form search by meaning: describe the vibe, setting or feeling. Best default for nuanced requests like 'late-night coding' or 'rainy Sunday morning'.",
  inputSchema: z.object({ description: z.string(), limit }),
  run: async ({ description, limit }) => {
    const vector = `[${(await embedText(description)).join(",")}]`;
    return JSON.stringify(
      await prisma.$queryRaw<SongHit[]>`
        SELECT id, title, artist, genre, mood, bpm FROM "Song"
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${vector}::vector LIMIT ${take(limit)}`,
    );
  },
});

const AgentAnswer = z.object({
  explanation: z.string(),
  songs: z.array(z.object({ id: z.string(), title: z.string(), artist: z.string(), why: z.string() })),
});
export type AgentAnswer = z.infer<typeof AgentAnswer>;

const SYSTEM = `You recommend music inside Sonara, a streaming app. Turn the listener's request into 3-5 songs from the library.

Only recommend songs that a tool returned in this conversation, with the exact id, title and artist it gave. If the tools find nothing that fits, return an empty list and say so in the explanation.
Combine tools when it helps; semantic_search is the best fallback because mood and BPM tags are missing on some songs.
Keep the explanation to one or two sentences and each "why" to one short sentence, in the language the listener used.`;

export async function askSonara(query: string): Promise<AgentAnswer> {
  const final = await client.beta.messages.toolRunner({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    max_iterations: 6,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(AgentAnswer) },
    system: SYSTEM,
    tools: [searchByMood, searchByBpm, searchByLyricalTheme, findSongByTitle, findSimilar, semanticSearch],
    messages: [{ role: "user", content: query }],
  });

  if (final.stop_reason === "refusal") throw new Error("agent refused");
  const text = final.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") throw new Error(`agent returned no answer (${final.stop_reason})`);
  return AgentAnswer.parse(JSON.parse(text.text));
}
