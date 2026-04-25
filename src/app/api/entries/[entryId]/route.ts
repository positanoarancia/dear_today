import { NextRequest } from "next/server";
import {
  removeEntry,
  updateEntry,
  verifyEntryOwnership,
} from "@/server/entries/repository";
import { getAuthProfile } from "@/server/auth/session";
import type { UpdateEntryInput } from "@/server/entries/types";
import { badRequest, serviceUnavailable } from "@/server/http/responses";

type RouteContext = {
  params: Promise<{
    entryId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { entryId } = await context.params;
  let input: Omit<UpdateEntryInput, "entryId">;

  try {
    input = (await request.json()) as Omit<UpdateEntryInput, "entryId">;
  } catch {
    return badRequest(["Request body must be valid JSON."]);
  }

  try {
    const profile = await getAuthProfile();
    const actor =
      input.actor.kind === "profile"
        ? profile
          ? {
              kind: "profile" as const,
              profileId: profile.id,
            }
          : null
        : input.actor;

    if (!actor) {
      return Response.json(
        {
          ok: false,
          errors: ["Sign in before updating an archived note."],
        },
        { status: 401 },
      );
    }

    const result = await updateEntry({
      ...input,
      entryId,
      actor,
    });

    return Response.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return serviceUnavailable(error);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { entryId } = await context.params;
  let input: Pick<UpdateEntryInput, "actor">;

  try {
    input = (await request.json()) as Pick<UpdateEntryInput, "actor">;
  } catch {
    return badRequest(["Request body must be valid JSON."]);
  }

  try {
    const profile = await getAuthProfile();
    const actor =
      input.actor.kind === "profile"
        ? profile
          ? {
              kind: "profile" as const,
              profileId: profile.id,
            }
          : null
        : input.actor;

    if (!actor) {
      return Response.json(
        {
          ok: false,
          errors: ["Sign in before managing an archived note."],
        },
        { status: 401 },
      );
    }

    const result = await verifyEntryOwnership({
      entryId,
      actor,
    });

    return Response.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return serviceUnavailable(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { entryId } = await context.params;
  let input: Pick<UpdateEntryInput, "actor">;

  try {
    input = (await request.json()) as Pick<UpdateEntryInput, "actor">;
  } catch {
    return badRequest(["Request body must be valid JSON."]);
  }

  try {
    const profile = await getAuthProfile();
    const actor =
      input.actor.kind === "profile"
        ? profile
          ? {
              kind: "profile" as const,
              profileId: profile.id,
            }
          : null
        : input.actor;

    if (!actor) {
      return Response.json(
        {
          ok: false,
          errors: ["Sign in before removing an archived note."],
        },
        { status: 401 },
      );
    }

    const result = await removeEntry({
      entryId,
      actor,
    });

    return Response.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return serviceUnavailable(error);
  }
}
