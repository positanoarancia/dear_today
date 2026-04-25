import { and, count, desc, eq, inArray, lt, ne, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import {
  entryReactions,
  gratitudeEntries,
  guestOwnerships,
} from "../db/drizzle-schema";
import { hashGuestPassword, verifyGuestPassword } from "../guest-authorship/password";
import { normalizeLocale } from "../i18n/locale";
import type { EntrySummary } from "./types";
import {
  normalizeAuthorName,
  normalizeEntryBody,
  validateCreateEntry,
} from "./validation";
import type { CreateEntryInput, UpdateEntryInput } from "./types";

export async function listLatestEntries(options?: {
  actorKey?: string;
  cursor?: Date;
  profileId?: string;
  limit?: number;
}): Promise<EntrySummary[]> {
  const db = getDb();
  const actorKey = options?.actorKey;
  const profileId = options?.profileId;
  const heartedExpression = actorKey
    ? sql<boolean>`coalesce(bool_or(${entryReactions.actorKey} = ${actorKey}), false)`
    : sql<boolean>`false`;

  const rows = await db
    .select({
      id: gratitudeEntries.id,
      body: gratitudeEntries.body,
      authorName: gratitudeEntries.authorName,
      ownerProfileId: gratitudeEntries.ownerProfileId,
      visibility: gratitudeEntries.visibility,
      createdAt: gratitudeEntries.createdAt,
      heartCount: count(entryReactions.id),
      viewerHasHearted: heartedExpression,
    })
    .from(gratitudeEntries)
    .leftJoin(entryReactions, eq(entryReactions.entryId, gratitudeEntries.id))
    .where(
      and(
        eq(gratitudeEntries.visibility, "public"),
        options?.cursor
          ? lt(gratitudeEntries.createdAt, options.cursor)
          : undefined,
      ),
    )
    .groupBy(gratitudeEntries.id)
    .orderBy(desc(gratitudeEntries.createdAt))
    .limit(options?.limit ?? 24);

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    authorName: row.authorName,
    heartCount: row.heartCount,
    viewerHasHearted: row.viewerHasHearted,
    createdAt: row.createdAt.toISOString(),
    visibility: row.visibility === "hidden" ? "hidden" : "public",
    canEdit: Boolean(profileId && row.ownerProfileId === profileId),
  }));
}

export async function listEntriesByIds(options: {
  ids: string[];
  actorKey?: string;
  profileId?: string;
}): Promise<EntrySummary[]> {
  if (options.ids.length === 0) {
    return [];
  }

  const db = getDb();
  const actorKey = options.actorKey;
  const profileId = options.profileId;
  const heartedExpression = actorKey
    ? sql<boolean>`coalesce(bool_or(${entryReactions.actorKey} = ${actorKey}), false)`
    : sql<boolean>`false`;

  const rows = await db
    .select({
      id: gratitudeEntries.id,
      body: gratitudeEntries.body,
      authorName: gratitudeEntries.authorName,
      ownerProfileId: gratitudeEntries.ownerProfileId,
      visibility: gratitudeEntries.visibility,
      createdAt: gratitudeEntries.createdAt,
      heartCount: count(entryReactions.id),
      viewerHasHearted: heartedExpression,
    })
    .from(gratitudeEntries)
    .leftJoin(entryReactions, eq(entryReactions.entryId, gratitudeEntries.id))
    .where(
      and(
        inArray(gratitudeEntries.id, options.ids),
        eq(gratitudeEntries.visibility, "public"),
      ),
    )
    .groupBy(gratitudeEntries.id)
    .orderBy(desc(gratitudeEntries.createdAt));

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    authorName: row.authorName,
    heartCount: row.heartCount,
    viewerHasHearted: row.viewerHasHearted,
    createdAt: row.createdAt.toISOString(),
    visibility: row.visibility === "hidden" ? "hidden" : "public",
    canEdit: Boolean(profileId && row.ownerProfileId === profileId),
  }));
}

export async function createEntry(input: CreateEntryInput) {
  const validation = validateCreateEntry(input);

  if (!validation.ok) {
    return {
      ok: false as const,
      errors: validation.errors,
    };
  }

  const db = getDb();
  const body = normalizeEntryBody(input.body);
  const authorName = normalizeAuthorName(input.owner.authorName);
  const locale = normalizeLocale(input.locale);
  const visibility =
    input.owner.kind === "profile" && input.visibility === "hidden"
      ? "hidden"
      : "public";

  if (input.owner.kind === "guest") {
    const [guestOwnership] = await db
      .insert(guestOwnerships)
      .values({
        authorName,
        passwordHash: hashGuestPassword(input.owner.password),
      })
      .returning({ id: guestOwnerships.id });

    const [entry] = await db
      .insert(gratitudeEntries)
      .values({
        body,
        authorName,
        guestOwnershipId: guestOwnership.id,
        visibility,
        locale,
      })
      .returning({ id: gratitudeEntries.id });

    return {
      ok: true as const,
      entryId: entry.id,
    };
  }

  const [entry] = await db
    .insert(gratitudeEntries)
    .values({
      body,
      authorName,
      ownerProfileId: input.owner.profileId,
      visibility,
      locale,
    })
    .returning({ id: gratitudeEntries.id });

  return {
    ok: true as const,
    entryId: entry.id,
  };
}

export async function updateEntry(input: UpdateEntryInput) {
  const db = getDb();
  const body = normalizeEntryBody(input.body);

  if (body.length < 12 || body.length > 1000) {
    return {
      ok: false as const,
      errors: ["Entry length is outside the allowed range."],
    };
  }

  const [entry] = await db
    .select({
      id: gratitudeEntries.id,
      ownerProfileId: gratitudeEntries.ownerProfileId,
      passwordHash: guestOwnerships.passwordHash,
    })
    .from(gratitudeEntries)
    .leftJoin(
      guestOwnerships,
      eq(guestOwnerships.id, gratitudeEntries.guestOwnershipId),
    )
    .where(eq(gratitudeEntries.id, input.entryId))
    .limit(1);

  if (!entry) {
    return {
      ok: false as const,
      errors: ["Entry not found."],
    };
  }

  const isProfileOwner =
    input.actor.kind === "profile" &&
    entry.ownerProfileId === input.actor.profileId;
  const isGuestOwner =
    input.actor.kind === "guest" &&
    entry.passwordHash &&
    verifyGuestPassword(input.actor.password, entry.passwordHash);

  if (!isProfileOwner && !isGuestOwner) {
    return {
      ok: false as const,
      errors: ["You do not have permission to update this entry."],
    };
  }

  if (
    input.visibility &&
    input.visibility !== "public" &&
    input.visibility !== "hidden"
  ) {
    return {
      ok: false as const,
      errors: ["Visibility must be public or hidden."],
    };
  }

  if (input.visibility === "hidden" && !isProfileOwner) {
    return {
      ok: false as const,
      errors: ["Guest entries cannot be hidden."],
    };
  }

  await db
    .update(gratitudeEntries)
    .set({
      body,
      ...(isProfileOwner && input.visibility
        ? { visibility: input.visibility }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(gratitudeEntries.id, input.entryId));

  return {
    ok: true as const,
  };
}

export async function verifyEntryOwnership(input: {
  entryId: string;
  actor: UpdateEntryInput["actor"];
}) {
  const db = getDb();
  const [entry] = await db
    .select({
      id: gratitudeEntries.id,
      ownerProfileId: gratitudeEntries.ownerProfileId,
      passwordHash: guestOwnerships.passwordHash,
    })
    .from(gratitudeEntries)
    .leftJoin(
      guestOwnerships,
      eq(guestOwnerships.id, gratitudeEntries.guestOwnershipId),
    )
    .where(eq(gratitudeEntries.id, input.entryId))
    .limit(1);

  if (!entry) {
    return {
      ok: false as const,
      errors: ["Entry not found."],
    };
  }

  const isProfileOwner =
    input.actor.kind === "profile" &&
    entry.ownerProfileId === input.actor.profileId;
  const isGuestOwner =
    input.actor.kind === "guest" &&
    entry.passwordHash &&
    verifyGuestPassword(input.actor.password, entry.passwordHash);

  if (!isProfileOwner && !isGuestOwner) {
    return {
      ok: false as const,
      errors: ["You do not have permission to manage this entry."],
    };
  }

  return {
    ok: true as const,
  };
}

export async function removeEntry(input: {
  entryId: string;
  actor: UpdateEntryInput["actor"];
}) {
  const db = getDb();
  const [entry] = await db
    .select({
      id: gratitudeEntries.id,
      ownerProfileId: gratitudeEntries.ownerProfileId,
      passwordHash: guestOwnerships.passwordHash,
    })
    .from(gratitudeEntries)
    .leftJoin(
      guestOwnerships,
      eq(guestOwnerships.id, gratitudeEntries.guestOwnershipId),
    )
    .where(eq(gratitudeEntries.id, input.entryId))
    .limit(1);

  if (!entry) {
    return {
      ok: false as const,
      errors: ["Entry not found."],
    };
  }

  const isProfileOwner =
    input.actor.kind === "profile" &&
    entry.ownerProfileId === input.actor.profileId;
  const isGuestOwner =
    input.actor.kind === "guest" &&
    entry.passwordHash &&
    verifyGuestPassword(input.actor.password, entry.passwordHash);

  if (!isProfileOwner && !isGuestOwner) {
    return {
      ok: false as const,
      errors: ["You do not have permission to remove this entry."],
    };
  }

  await db
    .update(gratitudeEntries)
    .set({
      visibility: "removed",
      updatedAt: new Date(),
    })
    .where(eq(gratitudeEntries.id, input.entryId));

  return {
    ok: true as const,
  };
}

export async function listProfileEntries(profileId: string) {
  const db = getDb();
  const rows = await db
    .select({
      id: gratitudeEntries.id,
      body: gratitudeEntries.body,
      authorName: gratitudeEntries.authorName,
      visibility: gratitudeEntries.visibility,
      createdAt: gratitudeEntries.createdAt,
      heartCount: count(entryReactions.id),
    })
    .from(gratitudeEntries)
    .leftJoin(entryReactions, eq(entryReactions.entryId, gratitudeEntries.id))
    .where(
      and(
        eq(gratitudeEntries.ownerProfileId, profileId),
        ne(gratitudeEntries.visibility, "removed"),
      ),
    )
    .groupBy(gratitudeEntries.id)
    .orderBy(desc(gratitudeEntries.createdAt));

  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    authorName: row.authorName,
    heartCount: row.heartCount,
    viewerHasHearted: false,
    createdAt: row.createdAt.toISOString(),
    visibility: row.visibility === "hidden" ? "hidden" : "public",
    canEdit: true,
  }));
}
