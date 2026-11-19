// Turns raw audio measurements (audio-analyzer/analyze.py) into energy, valence and a mood word.
//
// The raw numbers have no natural scale (how loud is "energetic"?), so each one is ranked against
// the rest of the library first: 0 = lowest in the library, 1 = highest. Moods are therefore
// relative to this catalogue, which is what search needs ("give me the calm ones").

export type RawFeatures = {
  bpm: number;
  key: string;
  loudness: number; // dBFS
  onsetStrength: number; // how hard and how often notes hit
  brightness: number; // spectral centroid, Hz
  majorness: number; // major-key fit minus minor-key fit
};

export const MOODS = ["happy", "intense", "calm", "melancholic"] as const;
export type Mood = (typeof MOODS)[number];

export type Analysis = { energy: number; valence: number; mood: Mood };

/** Percentile rank of every value in `values`, 0..1. Ties share a rank. */
export function percentileRanks(values: number[]): number[] {
  if (values.length < 2) return values.map(() => 0.5);
  const sorted = [...values].sort((a, b) => a - b);
  return values.map((v) => {
    const below = sorted.findIndex((s) => s >= v);
    const upTo = sorted.findLastIndex((s) => s <= v);
    return (below + upTo) / 2 / (values.length - 1);
  });
}

/**
 * Energy: loud and busy. Valence: major key, bright sound, quicker tempo.
 * Mood is the quadrant of the two (Russell's circumplex): energetic + positive = happy, and so on.
 */
export function moodFor(energy: number, valence: number): Mood {
  if (energy >= 0.5) return valence >= 0.5 ? "happy" : "intense";
  return valence >= 0.5 ? "calm" : "melancholic";
}

export function analyseLibrary(songs: RawFeatures[]): Analysis[] {
  const rank = (pick: (f: RawFeatures) => number) => percentileRanks(songs.map(pick));
  const loud = rank((f) => f.loudness);
  const busy = rank((f) => f.onsetStrength);
  const major = rank((f) => f.majorness);
  const bright = rank((f) => f.brightness);
  const fast = rank((f) => f.bpm);

  return songs.map((_, i) => {
    const energy = 0.5 * loud[i]! + 0.5 * busy[i]!;
    const valence = 0.5 * major[i]! + 0.25 * bright[i]! + 0.25 * fast[i]!;
    return { energy: round(energy), valence: round(valence), mood: moodFor(energy, valence) };
  });
}

const round = (n: number) => Math.round(n * 1000) / 1000;
