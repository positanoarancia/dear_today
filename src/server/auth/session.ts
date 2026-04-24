import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { getProfileById, type AuthProfile } from "../profile/repository";

const SESSION_COOKIE = "dear_today_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getSessionSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dear-today-local-session";
}

function signProfileId(profileId: string) {
  return createHmac("sha256", getSessionSecret()).update(profileId).digest("hex");
}

function createSessionToken(profileId: string) {
  return `${profileId}.${signProfileId(profileId)}`;
}

function verifySessionToken(token: string) {
  const [profileId, signature] = token.split(".");

  if (!profileId || !signature) {
    return null;
  }

  const expectedSignature = signProfileId(profileId);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return null;
  }

  return profileId;
}

export async function getAuthProfile(): Promise<AuthProfile | null> {
  const session = await auth();

  if (session?.user?.id) {
    return getProfileById(session.user.id);
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const profileId = verifySessionToken(token);

  if (!profileId) {
    return null;
  }

  return getProfileById(profileId);
}

export async function setSessionProfile(profileId: string) {
  const cookieStore = await cookies();

  cookieStore.set({
    name: SESSION_COOKIE,
    value: createSessionToken(profileId),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionProfile() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE);
}
