export const GUEST_ENTRY_RATE_LIMIT = {
  windowMs: 10 * 60 * 1000,
  maxEntries: 3,
};

export const MAX_PUBLIC_BODY_PREVIEW_LENGTH = 220;

export type ModerationSignal =
  | "guest_entry_created"
  | "rate_limited"
  | "hidden_by_admin"
  | "removed_by_owner"
  | "guest_password_failed";

export function shouldThrottleGuestEntry(attemptsInWindow: number) {
  return attemptsInWindow >= GUEST_ENTRY_RATE_LIMIT.maxEntries;
}

export function createPublicPreview(body: string) {
  const normalized = body.trim();

  if (normalized.length <= MAX_PUBLIC_BODY_PREVIEW_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, MAX_PUBLIC_BODY_PREVIEW_LENGTH).trimEnd()}...`;
}
