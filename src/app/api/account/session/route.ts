import { clearSessionProfile, getAuthProfile } from "@/server/auth/session";
import { auth } from "@/auth";
import {
  MAX_AUTHOR_LENGTH,
  MIN_AUTHOR_LENGTH,
} from "@/server/entries/types";
import { normalizeAuthorName } from "@/server/entries/validation";
import { badRequest, ok, serviceUnavailable } from "@/server/http/responses";
import { updateProfileDisplayName } from "@/server/profile/repository";

export async function GET() {
  try {
    const profile = await getAuthProfile();
    const session = await auth();

    return ok({
      ok: true,
      profile: profile
        ? {
            ...profile,
            avatarUrl: session?.user?.image ?? null,
          }
        : null,
    });
  } catch (error) {
    return serviceUnavailable(error);
  }
}

export async function PATCH(request: Request) {
  let payload: { displayName?: string };

  try {
    payload = (await request.json()) as { displayName?: string };
  } catch {
    return badRequest(["Request body must be valid JSON."]);
  }

  const displayName = normalizeAuthorName(payload.displayName ?? "");

  if (displayName.length < MIN_AUTHOR_LENGTH) {
    return badRequest([
      `Nickname must be at least ${MIN_AUTHOR_LENGTH} characters.`,
    ]);
  }

  if (displayName.length > MAX_AUTHOR_LENGTH) {
    return badRequest([
      `Nickname must be ${MAX_AUTHOR_LENGTH} characters or fewer.`,
    ]);
  }

  try {
    const profile = await getAuthProfile();

    if (!profile) {
      return Response.json(
        {
          ok: false,
          errors: ["Sign in before updating your nickname."],
        },
        { status: 401 },
      );
    }

    const updateResult = await updateProfileDisplayName({
      profileId: profile.id,
      displayName,
    });

    if (!updateResult.ok && updateResult.reason === "cooldown") {
      return Response.json(
        {
          ok: false,
          errors: ["Nickname can only be changed once every 7 days."],
          nextDisplayNameChangeAt: updateResult.nextDisplayNameChangeAt,
        },
        { status: 429 },
      );
    }

    if (!updateResult.ok) {
      return Response.json(
        {
          ok: false,
          errors: ["Profile not found."],
        },
        { status: 404 },
      );
    }

    return ok({
      ok: true,
      profile: updateResult.profile,
    });
  } catch (error) {
    return serviceUnavailable(error);
  }
}

export async function DELETE() {
  await clearSessionProfile();

  return ok({
    ok: true,
  });
}
