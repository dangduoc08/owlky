/** Lowercase, words joined by `-`: "Icon button", "IconButton" and "icon_button" → `icon-button`. */
export function normalizeName(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Levenshtein distance, stopping early once it exceeds `max`. */
export function distance(a: string, b: string, max = Number.POSITIVE_INFINITY): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(
        (previous[j] as number) + 1,
        (current[j - 1] as number) + 1,
        (previous[j - 1] as number) + cost,
      );
      current.push(value);
      if (value < best) best = value;
    }
    if (best > max) return max + 1;
    previous = current;
  }
  return previous[b.length] as number;
}

/** Up to `limit` candidates closest to `input`: shared prefixes and substrings first, then typos. */
export function suggest(input: string, candidates: Iterable<string>, limit = 5): string[] {
  const query = input.toLowerCase();
  const scored: [string, number][] = [];
  for (const candidate of new Set(candidates)) {
    const value = candidate.toLowerCase();
    let score: number;
    if (value.includes(query) || (query.length > 2 && query.includes(value))) score = 0;
    else {
      const max = Math.max(2, Math.floor(query.length / 3));
      const d = distance(query, value, max);
      if (d > max) continue;
      score = d;
    }
    scored.push([candidate, score]);
  }
  return scored
    .sort(([a, x], [b, y]) => x - y || a.length - b.length || (a < b ? -1 : a > b ? 1 : 0))
    .slice(0, limit)
    .map(([candidate]) => candidate);
}

/** Every whitespace-separated word of `query` occurs in one of `fields` (case-insensitive). */
export function matchesAll(query: string, fields: readonly (string | undefined)[]): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const text = fields
    .filter((field): field is string => field !== undefined)
    .join("\n")
    .toLowerCase();
  return words.every((word) => text.includes(word));
}
