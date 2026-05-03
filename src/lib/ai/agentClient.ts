import { z } from "zod";

const EnrichedSongSchema = z.object({
  id: z.string(),
  title: z.string(),
  artist: z.string(),
  why: z.string(),
  coverUrl: z.string().nullable(),
  audioUrl: z.string().nullable(),
  duration: z.number().nullable(),
});

const AgentResponseSchema = z.object({
  explanation: z.string(),
  songs: z.array(EnrichedSongSchema),
});

export type AgentSong = z.infer<typeof EnrichedSongSchema>;
export type AgentResponse = z.infer<typeof AgentResponseSchema>;

export async function askAgent(query: string): Promise<AgentResponse> {
  const res = await fetch("/api/agent/query", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (res.status === 503) {
    throw new Error("Our music agent is taking a break. Try again in a moment.");
  }
  if (!res.ok) {
    throw new Error("Something went wrong. Please rephrase your question.");
  }

  const data = await res.json();
  const validated = AgentResponseSchema.safeParse(data);

  if (!validated.success) {
    throw new Error("Something went wrong. Please rephrase your question.");
  }

  if (validated.data.songs.length === 0) {
    throw new Error("We couldn't find a perfect match. Try being more specific or different.");
  }

  return validated.data;
}
