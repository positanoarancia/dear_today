export const tables = {
  profiles: "profiles",
  entries: "gratitude_entries",
  guestOwnerships: "guest_ownerships",
  reactions: "entry_reactions",
  moderationEvents: "moderation_events",
} as const;

export type EntryVisibility = "public" | "hidden" | "removed";

export type EntryRow = {
  id: string;
  body: string;
  authorName: string;
  ownerProfileId: string | null;
  guestOwnershipId: string | null;
  visibility: EntryVisibility;
  locale: string;
  createdAt: Date;
  updatedAt: Date;
};

export type EntryReactionRow = {
  id: string;
  entryId: string;
  actorKey: string;
  createdAt: Date;
};

export type GuestOwnershipRow = {
  id: string;
  authorName: string;
  passwordHash: string;
  createdAt: Date;
};

