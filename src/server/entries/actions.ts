"use server";

import { revalidatePath } from "next/cache";
import {
  createEntry,
  removeEntry,
  updateEntry,
} from "./repository";
import type { CreateEntryInput, UpdateEntryInput } from "./types";

export async function createEntryAction(input: CreateEntryInput) {
  const result = await createEntry(input);

  if (result.ok) {
    revalidatePath("/");
    revalidatePath("/my-posts");
  }

  return result;
}

export async function updateEntryAction(input: UpdateEntryInput) {
  const result = await updateEntry(input);

  if (result.ok) {
    revalidatePath("/");
    revalidatePath("/my-posts");
  }

  return result;
}

export async function removeEntryAction(input: {
  entryId: string;
  actor: UpdateEntryInput["actor"];
}) {
  const result = await removeEntry(input);

  if (result.ok) {
    revalidatePath("/");
    revalidatePath("/my-posts");
  }

  return result;
}

