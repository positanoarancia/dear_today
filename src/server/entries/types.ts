import { MAX_POST_LENGTH } from "@/lib/dear-today-data";
export {
  MAX_AUTHOR_LENGTH,
  MIN_AUTHOR_LENGTH,
} from "@/lib/dear-today-data";

export const MIN_ENTRY_LENGTH = 12;
export const MAX_ENTRY_LENGTH = MAX_POST_LENGTH;

export type EntryVisibility = "public" | "hidden";

export type EntryOwner =
  | {
      kind: "guest";
      authorName: string;
      password: string;
    }
  | {
      kind: "profile";
      profileId: string;
      authorName: string;
    };

export type CreateEntryInput = {
  body: string;
  owner: EntryOwner;
  visibility?: EntryVisibility;
  locale?: string;
};

export type UpdateEntryInput = {
  entryId: string;
  body: string;
  visibility?: EntryVisibility;
  actor:
    | {
        kind: "guest";
        password: string;
      }
    | {
        kind: "profile";
        profileId: string;
      };
};

export type EntrySummary = {
  id: string;
  body: string;
  authorName: string;
  heartCount: number;
  viewerHasHearted: boolean;
  createdAt: string;
  visibility: EntryVisibility;
  canEdit: boolean;
};
