import { and, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { profiles } from "../db/drizzle-schema";

export type AuthProfile = {
  id: string;
  provider: "google";
  providerAccountId: string;
  displayName: string;
};

export async function upsertProfile(input: {
  provider: "google";
  providerAccountId: string;
  displayName: string;
}): Promise<AuthProfile> {
  const db = getDb();
  const [existingProfile] = await db
    .select({
      id: profiles.id,
      provider: profiles.provider,
      providerAccountId: profiles.providerAccountId,
      displayName: profiles.displayName,
    })
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
      .returning({
        id: profiles.id,
        provider: profiles.provider,
        providerAccountId: profiles.providerAccountId,
        displayName: profiles.displayName,
      });

    return {
      id: updatedProfile.id,
      provider: "google",
      providerAccountId: updatedProfile.providerAccountId,
      displayName: updatedProfile.displayName,
    };
  }

  const [createdProfile] = await db
    .insert(profiles)
    .values({
      provider: input.provider,
      providerAccountId: input.providerAccountId,
      displayName: input.displayName,
    })
    .returning({
      id: profiles.id,
      provider: profiles.provider,
      providerAccountId: profiles.providerAccountId,
      displayName: profiles.displayName,
    });

  return {
    id: createdProfile.id,
    provider: "google",
    providerAccountId: createdProfile.providerAccountId,
    displayName: createdProfile.displayName,
  };
}

export async function updateProfileDisplayName(input: {
  profileId: string;
  displayName: string;
}): Promise<AuthProfile | null> {
  const db = getDb();
  const [profile] = await db
    .update(profiles)
    .set({
      displayName: input.displayName,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, input.profileId))
    .returning({
      id: profiles.id,
      provider: profiles.provider,
      providerAccountId: profiles.providerAccountId,
      displayName: profiles.displayName,
    });

  if (!profile || profile.provider !== "google") {
    return null;
  }

  return {
    id: profile.id,
    provider: "google",
    providerAccountId: profile.providerAccountId,
    displayName: profile.displayName,
  };
}

export async function getProfileById(profileId: string): Promise<AuthProfile | null> {
  const db = getDb();
  const [profile] = await db
    .select({
      id: profiles.id,
      provider: profiles.provider,
      providerAccountId: profiles.providerAccountId,
      displayName: profiles.displayName,
    })
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);

  if (!profile || profile.provider !== "google") {
    return null;
  }

  return {
    id: profile.id,
    provider: "google",
    providerAccountId: profile.providerAccountId,
    displayName: profile.displayName,
  };
}
