"use server";

import { revalidatePath } from "next/cache";
import { toggleHeart } from "./repository";
import type { ReactionActor } from "./policy";

export async function toggleHeartAction(input: {
  entryId: string;
  actor: ReactionActor;
}) {
  const result = await toggleHeart(input);

  if (result.ok) {
    revalidatePath("/");
  }

  return result;
}

