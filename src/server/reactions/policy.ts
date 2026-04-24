export type ReactionActor =
  | {
      kind: "profile";
      profileId: string;
    }
  | {
      kind: "device";
      deviceId: string;
    };

export function createReactionActorKey(actor: ReactionActor) {
  return actor.kind === "profile"
    ? `profile:${actor.profileId}`
    : `device:${actor.deviceId}`;
}

export function canToggleHeart(entryId: string, actor: ReactionActor) {
  return entryId.trim().length > 0 && createReactionActorKey(actor).length > 0;
}

