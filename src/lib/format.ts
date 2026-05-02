/**
 * Formats a raw play count into a compact human-readable string.
 * < 1 000       → "847"
 * < 10 000      → "1,234"
 * < 1 000 000   → "12.4K"  (drops .0)
 * < 1 000 000 000 → "1.2M"
 * ≥ 1B          → "1.5B"
 */
export function formatPlayCount(n: number): string {
  if (n < 1_000) return String(n);
  if (n < 10_000) return n.toLocaleString("en-US");
  if (n < 1_000_000) {
    const val = (n / 1_000).toFixed(1).replace(/\.0$/, "");
    return `${val}K`;
  }
  if (n < 1_000_000_000) {
    const val = (n / 1_000_000).toFixed(1).replace(/\.0$/, "");
    return `${val}M`;
  }
  const val = (n / 1_000_000_000).toFixed(1).replace(/\.0$/, "");
  return `${val}B`;
}

/** "3:45" */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** "1h 12min" or "45 min" */
export function formatTotalDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  return `${h}h ${m}min`;
}
