import type { EntrySummary } from "../entries/types";

const MIN_FEATURED_LENGTH = 90;
const FEATURED_FRESHNESS_DAYS = 1;

export function selectFeaturedEntry(entries: EntrySummary[], now = new Date()) {
  const freshCutoff = now.getTime() - FEATURED_FRESHNESS_DAYS * 24 * 60 * 60 * 1000;
  const seenAuthors = new Set<string>();

  const candidates = entries
    .filter((entry) => entry.body.trim().length >= MIN_FEATURED_LENGTH)
    .filter((entry) => new Date(entry.createdAt).getTime() >= freshCutoff)
    .filter((entry) => {
      const authorKey = entry.authorName.toLowerCase();
      if (seenAuthors.has(authorKey)) {
        return false;
      }

      seenAuthors.add(authorKey);
      return true;
    });

  return [...candidates].sort((a, b) => b.heartCount - a.heartCount)[0] ?? null;
}

