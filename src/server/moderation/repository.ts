import { and, count, eq, gte } from "drizzle-orm";
import { getDb } from "../db/client";
import { moderationEvents } from "../db/drizzle-schema";
import {
  GUEST_ENTRY_RATE_LIMIT,
  shouldThrottleGuestEntry,
  type ModerationSignal,
} from "./policy";

const GUEST_ENTRY_CREATED: ModerationSignal = "guest_entry_created";

export async function canCreateGuestEntry(actorKey: string) {
  const db = getDb();
  const windowStart = new Date(Date.now() - GUEST_ENTRY_RATE_LIMIT.windowMs);
  const [result] = await db
    .select({ attempts: count(moderationEvents.id) })
    .from(moderationEvents)
    .where(
      and(
        eq(moderationEvents.eventType, GUEST_ENTRY_CREATED),
        eq(moderationEvents.actorKey, actorKey),
        gte(moderationEvents.createdAt, windowStart),
      ),
    );

  return !shouldThrottleGuestEntry(result?.attempts ?? 0);
}

export async function recordGuestEntryCreated(input: {
  actorKey: string;
  entryId: string;
}) {
  const db = getDb();

  await db.insert(moderationEvents).values({
    actorKey: input.actorKey,
    entryId: input.entryId,
    eventType: GUEST_ENTRY_CREATED,
  });
}
