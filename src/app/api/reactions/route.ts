import { NextRequest } from "next/server";
import { toggleHeart } from "@/server/reactions/repository";
import type { ReactionActor } from "@/server/reactions/policy";
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
    const result = await toggleHeart(input);

    return Response.json(result);
  } catch (error) {
    return serviceUnavailable(error);
  }
}

