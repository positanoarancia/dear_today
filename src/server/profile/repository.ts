import { and, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { profiles } from "../db/drizzle-schema";

const DISPLAY_NAME_CHANGE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

export type AuthProfile = {
  id: string;
  provider: "google";
  providerAccountId: string;
  displayName: string;
  displayNameChangedAt: string | null;
  nextDisplayNameChangeAt: string | null;
};

type ProfileRecord = {
  id: string;
  provider: string;
  providerAccountId: string;
  displayName: string;
  displayNameChangedAt: Date | null;
};

export type UpdateProfileDisplayNameResult =
  | {
      ok: true;
      profile: AuthProfile;
    }
  | {
      ok: false;
      reason: "cooldown";
      nextDisplayNameChangeAt: string;
    }
  | {
      ok: false;
      reason: "not_found";
    };

function getNextDisplayNameChangeAt(changedAt: Date | null) {
  if (!changedAt) {
    return null;
  }

  return new Date(changedAt.getTime() + DISPLAY_NAME_CHANGE_COOLDOWN_MS).toISOString();
}

function mapProfile(record: ProfileRecord): AuthProfile | null {
  if (record.provider !== "google") {
    return null;
  }

  return {
    id: record.id,
    provider: "google",
    providerAccountId: record.providerAccountId,
    displayName: record.displayName,
    displayNameChangedAt: record.displayNameChangedAt?.toISOString() ?? null,
    nextDisplayNameChangeAt: getNextDisplayNameChangeAt(record.displayNameChangedAt),
  };
}

const profileSelection = {
  id: profiles.id,
  provider: profiles.provider,
  providerAccountId: profiles.providerAccountId,
  displayName: profiles.displayName,
  displayNameChangedAt: profiles.displayNameChangedAt,
};

export async function upsertProfile(input: {
  provider: "google";
  providerAccountId: string;
  displayName: string;
}): Promise<AuthProfile> {
  const db = getDb();
  const [existingProfile] = await db
    .select(profileSelection)
    .from(profiles)
    .where(
      and(
        eq(profiles.provider, input.provider),
        eq(profiles.providerAccountId, input.providerAccountId),
      ),
    )
    .limit(1);

  if (existingProfile) {
    const [updatedProfile] = await db
      .update(profiles)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, existingProfile.id))
      .returning(profileSelection);

    const mappedProfile = mapProfile(updatedProfile);

    if (!mappedProfile) {
      throw new Error("Unsupported auth provider.");
    }

    return mappedProfile;
  }

  const [createdProfile] = await db
    .insert(profiles)
    .values({
      provider: input.provider,
      providerAccountId: input.providerAccountId,
      displayName: input.displayName,
    })
    .returning(profileSelection);

  const mappedProfile = mapProfile(createdProfile);

  if (!mappedProfile) {
    throw new Error("Unsupported auth provider.");
  }

  return mappedProfile;
}

export async function updateProfileDisplayName(input: {
  profileId: string;
  displayName: string;
}): Promise<UpdateProfileDisplayNameResult> {
  const db = getDb();
  const [currentProfile] = await db
    .select(profileSelection)
    .from(profiles)
    .where(eq(profiles.id, input.profileId))
    .limit(1);

  const currentMappedProfile = currentProfile ? mapProfile(currentProfile) : null;

  if (!currentMappedProfile || !currentProfile) {
    return {
      ok: false,
      reason: "not_found",
    };
  }

  if (currentProfile.displayName === input.displayName) {
    return {
      ok: true,
      profile: currentMappedProfile,
    };
  }

  const now = new Date();
  const nextDisplayNameChangeAt = getNextDisplayNameChangeAt(
    currentProfile.displayNameChangedAt,
  );

  if (nextDisplayNameChangeAt && new Date(nextDisplayNameChangeAt).getTime() > now.getTime()) {
    return {
      ok: false,
      reason: "cooldown",
      nextDisplayNameChangeAt,
    };
  }

  const [profile] = await db
    .update(profiles)
    .set({
      displayName: input.displayName,
      displayNameChangedAt: now,
      updatedAt: now,
    })
    .where(eq(profiles.id, input.profileId))
    .returning(profileSelection);

  const mappedProfile = profile ? mapProfile(profile) : null;

  if (!mappedProfile) {
    return {
      ok: false,
      reason: "not_found",
    };
  }

  return {
    ok: true,
    profile: mappedProfile,
  };
}

export async function getProfileById(profileId: string): Promise<AuthProfile | null> {
  const db = getDb();
  const [profile] = await db
    .select(profileSelection)
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);

  if (!profile) {
    return null;
  }

  return mapProfile(profile);
}
