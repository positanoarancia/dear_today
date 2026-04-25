import { createHmac } from "crypto";
import { NextRequest } from "next/server";

function moderationSecret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "dear-today-local-session"
  );
}

export function createGuestRateLimitKey(request: NextRequest) {
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();
  const ip =
    forwardedFor ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown-ip";
  const userAgent = request.headers.get("user-agent") || "unknown-agent";
  const rawKey = `${ip}:${userAgent}`;

  return `guest:${createHmac("sha256", moderationSecret())
    .update(rawKey)
    .digest("hex")}`;
}
