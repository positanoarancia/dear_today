const DEFAULT_SITE_URL = "http://localhost:3000";

export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    DEFAULT_SITE_URL;

  const url = configuredUrl.startsWith("http")
    ? configuredUrl
    : `https://${configuredUrl}`;

  return new URL(url);
}
