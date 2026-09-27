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
    const newRank = next > 0 ? next / 2 : next - 1000;
    return newRank.toFixed(6);
  }

  // Case 3: Insert after the last item
  if (prev !== null && next === null) {
    return (prev + 1000).toFixed(6);
  }

  // Case 4: Insert between two existing items
  if (prev !== null && next !== null) {
    if (prev >= next) {
      return (prev + 0.000001).toFixed(6);
    }
    const mid = (prev + next) / 2;
    const diff = next - prev;
    if (diff < 0.00001) {
      return mid.toFixed(10);
    }
    return mid.toFixed(6);
  }

  return (1000).toFixed(6);
}

export function compareRanks(rankA?: string | null, rankB?: string | null): number {
  const a = rankA != null && rankA !== '' ? parseFloat(rankA) : 0;
  const b = rankB != null && rankB !== '' ? parseFloat(rankB) : 0;
  if (isNaN(a)) return -1;
  if (isNaN(b)) return 1;
  return a - b;
}
