import { NextRequest } from "next/server";
import {
  createEntry,
  listEntriesByIds,
  listLatestEntries,
  listProfileEntries,
} from "@/server/entries/repository";
import { getAuthProfile } from "@/server/auth/session";
import type { CreateEntryInput } from "@/server/entries/types";
import { badRequest, ok, serviceUnavailable } from "@/server/http/responses";
import { createGuestRateLimitKey } from "@/server/moderation/actor-key";
import {
  canCreateGuestEntry,
  recordGuestEntryCreated,
} from "@/server/moderation/repository";

function defaultGuestName(locale?: string) {
  return locale?.toLowerCase().startsWith("ko") ? "익명의 마음" : "Quiet guest";
}

export async function GET(request: NextRequest) {
  try {
    const actorKey = request.nextUrl.searchParams.get("actorKey") ?? undefined;
    const mine = request.nextUrl.searchParams.get("mine") === "1";
    const ids = request.nextUrl.searchParams
      .get("ids")
      ?.split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? 24);
    const cursorParam = request.nextUrl.searchParams.get("cursor");
    const cursor = cursorParam ? new Date(cursorParam) : undefined;
    const profile = await getAuthProfile();
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 48) : 24;

    if (mine) {
      if (!profile) {
        return ok({
          ok: true,
          entries: [],
        });
      }

      const entries = await listProfileEntries(profile.id);

      return ok({
        ok: true,
        entries,
      });
    }

    const entries = ids
      ? await listEntriesByIds({
          ids,
          actorKey,
          profileId: profile?.id,
        })
      : await listLatestEntries({
          actorKey,
          cursor:
            cursor && Number.isFinite(cursor.getTime()) ? cursor : undefined,
          profileId: profile?.id,
          limit: safeLimit + 1,
        });
    const visibleEntries = ids ? entries : entries.slice(0, safeLimit);
    const nextCursor =
      !ids && entries.length > safeLimit
        ? visibleEntries.at(-1)?.createdAt
        : null;

    return ok({
      ok: true,
      entries: visibleEntries,
      nextCursor,
    });
  } catch (error) {
    return serviceUnavailable(error);
  }
}

export async function POST(request: NextRequest) {
  let input: CreateEntryInput;

  try {
    input = (await request.json()) as CreateEntryInput;
  } catch {
    return badRequest(["Request body must be valid JSON."]);
  }

  try {
    const profile = await getAuthProfile();

    const guestRateLimitKey =
      input.owner.kind === "guest" ? createGuestRateLimitKey(request) : null;

    if (guestRateLimitKey) {
      const canCreate = await canCreateGuestEntry(guestRateLimitKey);

      if (!canCreate) {
        return Response.json(
          {
            ok: false,
            errors: [
              "Too many guest notes. Please wait a little before writing again.",
            ],
          },
          { status: 429 },
        );
      }
    }

    if (input.owner.kind === "profile") {
      if (!profile) {
        return Response.json(
          {
            ok: false,
            errors: ["Sign in before creating an archived note."],
          },
          { status: 401 },
        );
      }

      input = {
        ...input,
        owner: {
          kind: "profile",
          profileId: profile.id,
          authorName: input.owner.authorName,
        },
      };
    } else if (input.owner.authorName.trim().length === 0) {
      input = {
        ...input,
        owner: {
          ...input.owner,
          authorName: defaultGuestName(input.locale),
        },
      };
    }

    const result = await createEntry(input);

    if (result.ok && guestRateLimitKey) {
      await recordGuestEntryCreated({
        actorKey: guestRateLimitKey,
        entryId: result.entryId,
      });
    }

    return Response.json(result, { status: result.ok ? 201 : 400 });
  } catch (error) {
    return serviceUnavailable(error);
  }
}
