import { NextRequest } from "next/server";
import { toggleHeart } from "@/server/reactions/repository";
import type { ReactionActor } from "@/server/reactions/policy";
import { getAuthProfile } from "@/server/auth/session";
import { badRequest, serviceUnavailable } from "@/server/http/responses";

type ToggleHeartBody = {
  entryId: string;
  actor: ReactionActor;
};

export async function POST(request: NextRequest) {
  let input: ToggleHeartBody;

  try {
    input = (await request.json()) as ToggleHeartBody;
  } catch {
    return badRequest(["Request body must be valid JSON."]);
  }

  if (!input.entryId || !input.actor) {
    return badRequest(["entryId and actor are required."]);
  }

  try {
    let actor = input.actor;

    if (actor.kind === "profile") {
      const profile = await getAuthProfile();

      if (!profile) {
        return Response.json(
          {
            ok: false,
            errors: ["Sign in before reacting as a profile."],
          },
          { status: 401 },
        );
      }

      actor = {
        kind: "profile",
        profileId: profile.id,
      };
    }

    const result = await toggleHeart({
      entryId: input.entryId,
      actor,
    });

    return Response.json(result);
  } catch (error) {
    return serviceUnavailable(error);
  }
}
