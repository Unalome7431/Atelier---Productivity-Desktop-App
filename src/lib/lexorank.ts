/**
 * Fractional indexing / Lexorank utilities for O(1) card reordering.
 * Generates float-based rank strings (e.g. "1000.000000", "1500.000000", "2000.000000")
 * or midpoints between any two arbitrary ranks.
 */

export function getInitialRank(index: number): string {
  return ((index + 1) * 1000).toFixed(6);
}

export function getRankBetween(prevRank?: string | null, nextRank?: string | null): string {
  const prev = prevRank != null && prevRank !== '' ? parseFloat(prevRank) : null;
  const next = nextRank != null && nextRank !== '' ? parseFloat(nextRank) : null;

  // Case 1: Empty list or no bounds
  if (prev === null && next === null) {
    return (1000).toFixed(6);
  }

  // Case 2: Insert before the first item
  if (prev === null && next !== null) {
    const newRank = next > 1 ? next / 2 : next / 2;
    return newRank.toFixed(6);
  }

  // Case 3: Insert after the last item
  if (prev !== null && next === null) {
    return (prev + 1000).toFixed(6);
  }

  // Case 4: Insert between two existing items
  if (prev !== null && next !== null) {
    const mid = (prev + next) / 2;
    if (mid === prev || mid === next) {
      // Floating-point delta in case numbers converge closely
      return (prev + 0.000001).toFixed(6);
    }
    return mid.toFixed(6);
  }

  return (1000).toFixed(6);
}

export function compareRanks(rankA?: string | null, rankB?: string | null): number {
  const a = rankA != null && rankA !== '' ? parseFloat(rankA) : 0;
  const b = rankB != null && rankB !== '' ? parseFloat(rankB) : 0;
  return a - b;
}
