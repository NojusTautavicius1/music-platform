export type GenreConfig = {
  gradient: string;
  label: string;
};

export const GENRE_COLORS: Record<string, GenreConfig> = {
  electronic: { gradient: "from-cyan-500 to-blue-600", label: "Electronic" },
  "hip-hop":  { gradient: "from-orange-500 to-red-600", label: "Hip-Hop" },
  indie:      { gradient: "from-green-400 to-emerald-600", label: "Indie" },
  jazz:       { gradient: "from-amber-400 to-yellow-600", label: "Jazz" },
  "lo-fi":    { gradient: "from-purple-500 to-pink-500", label: "Lo-Fi" },
  pop:        { gradient: "from-pink-500 to-rose-600", label: "Pop" },
  rock:       { gradient: "from-red-500 to-orange-600", label: "Rock" },
  "r&b":      { gradient: "from-violet-500 to-purple-700", label: "R&B" },
};

export const FEATURED_GENRES = [
  "electronic",
  "hip-hop",
  "indie",
  "jazz",
  "lo-fi",
  "pop",
  "rock",
  "r&b",
] as const;
