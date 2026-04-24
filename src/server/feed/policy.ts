export const FEED_PAGE_SIZE = 24;
export const NEW_ENTRY_BANNER_LIMIT = 6;

export type FeedCursor = {
  beforeCreatedAt?: string;
  beforeId?: string;
};

export function createStableFeedCursor(createdAt: string, id: string): FeedCursor {
  return {
    beforeCreatedAt: createdAt,
    beforeId: id,
  };
}

export function shouldShowNewEntryBanner(newEntryCount: number) {
  return newEntryCount > 0;
}

export function formatNewEntryBannerLabel(newEntryCount: number) {
  const visibleCount = Math.min(newEntryCount, NEW_ENTRY_BANNER_LIMIT);
  const suffix = newEntryCount > NEW_ENTRY_BANNER_LIMIT ? "+" : "";

  return `See ${visibleCount}${suffix} new gratitude ${
    visibleCount === 1 ? "note" : "notes"
  }`;
}

