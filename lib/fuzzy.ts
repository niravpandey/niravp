/**
 * Small fuzzy matcher for site search. Each query word must match a field either as an in-order
 * subsequence ("algo hire" -> "Algorithmic Hiring") or, for longer words, within one typo of a word
 * in the field ("algoritm"). Higher scores are better matches.
 */

export type FuzzyMatch = {
  score: number;
  /** Character indices in the text that matched, for highlighting. */
  indices: number[];
};

const WORD_BOUNDARY = /[\s\-_:,.!?"'()/]/;

/** Best in-order match of `needle` inside `haystack`, favouring word starts and consecutive runs. */
function subsequenceMatch(needle: string, haystack: string): FuzzyMatch | null {
  const lower = haystack.toLowerCase();
  let best: FuzzyMatch | null = null;

  // Try starting from every occurrence of the first character and keep the best-scoring run.
  for (let start = lower.indexOf(needle[0]); start !== -1; start = lower.indexOf(needle[0], start + 1)) {
    const indices: number[] = [];
    let score = 0;
    let position = start;

    for (const char of needle) {
      const found = lower.indexOf(char, position);
      if (found === -1) break;

      const previous = indices[indices.length - 1];
      if (previous !== undefined && found === previous + 1) score += 5; // consecutive
      if (found === 0 || WORD_BOUNDARY.test(lower[found - 1])) score += 8; // start of a word
      if (previous !== undefined) score -= Math.min(found - previous - 1, 10) * 0.5; // gaps

      indices.push(found);
      position = found + 1;
    }

    // Letters scattered across a long title aren't a meaningful match.
    const span = indices[indices.length - 1] - indices[0] + 1;
    if (indices.length === needle.length && span <= needle.length * 3) {
      score += needle.length * 2;
      if (!best || score > best.score) best = { score, indices };
    }
  }

  return best;
}

/** Damerau-Levenshtein distance, capped: returns `max + 1` as soon as it's clearly further. */
function editDistance(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) rows[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
      }
    }
  }
  return rows[a.length][b.length];
}

/** A word in `text` within one typo of `needle` (or a prefix of a longer word), as a weaker match. */
function typoMatch(needle: string, text: string): FuzzyMatch | null {
  if (needle.length < 4) return null;
  const lower = text.toLowerCase();
  const wordPattern = /[a-z0-9]+/g;

  for (let match = wordPattern.exec(lower); match; match = wordPattern.exec(lower)) {
    const word = match[0];
    const candidate = word.length > needle.length ? word.slice(0, needle.length) : word;
    if (editDistance(needle, candidate, 1) <= 1) {
      const indices = Array.from({ length: candidate.length }, (_, i) => match!.index + i);
      return { score: needle.length, indices };
    }
  }
  return null;
}

/** Match one query word against a field. */
function matchWord(word: string, text: string): FuzzyMatch | null {
  return subsequenceMatch(word, text) ?? typoMatch(word, text);
}

export type SearchField = { text: string; weight: number };

/**
 * Scores a record for `query`. Every query word must match at least one field; each word counts its
 * best field (score x weight). Returns null if any word doesn't match.
 * `indices` are the matched positions in the first field (usually the title).
 */
export function fuzzyScore(query: string, fields: SearchField[]): FuzzyMatch | null {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  let total = 0;
  const titleIndices = new Set<number>();

  for (const word of words) {
    let best: number | null = null;
    fields.forEach((field, fieldIndex) => {
      const match = matchWord(word, field.text);
      if (!match) return;
      best = Math.max(best ?? -Infinity, match.score * field.weight);
      if (fieldIndex === 0) match.indices.forEach((index) => titleIndices.add(index));
    });
    if (best === null) return null;
    total += best;
  }

  return { score: total, indices: [...titleIndices].sort((a, b) => a - b) };
}
