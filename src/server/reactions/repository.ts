import { and, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { entryReactions } from "../db/drizzle-schema";
import { createReactionActorKey, type ReactionActor } from "./policy";

export async function toggleHeart(input: {
  entryId: string;
  actor: ReactionActor;
}) {
  const db = getDb();
  const actorKey = createReactionActorKey(input.actor);
  const [existingReaction] = await db
    .select({ id: entryReactions.id })
    .from(entryReactions)
    .where(
      and(
        eq(entryReactions.entryId, input.entryId),
        eq(entryReactions.actorKey, actorKey),
      ),
    )
    .limit(1);

  if (existingReaction) {
    await db
      .delete(entryReactions)
      .where(eq(entryReactions.id, existingReaction.id));

    return {
      ok: true as const,
      hearted: false,
    };
  }

  await db.insert(entryReactions).values({
    entryId: input.entryId,
    actorKey,
  });

  return {
    ok: true as const,
    hearted: true,
  };
}

