import { DearTodayApp } from "@/components/dear-today-app";
import { cookies } from "next/headers";

function readInitialLocale(value: string | undefined) {
  return value === "en" || value === "ko" ? value : "ko";
}

function readInitialTheme(value: string | undefined) {
  return value === "evening" || value === "light" ? value : "light";
}

function getInitialNoticeDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export default async function MyPostsPage() {
  const cookieStore = await cookies();
  const initialLocale = readInitialLocale(
    cookieStore.get("dear-today-locale")?.value,
  );
  const initialTheme = readInitialTheme(
    cookieStore.get("dear-today-theme")?.value,
  );

  return (
    <DearTodayApp
      initialView="my-posts"
      initialLocale={initialLocale}
      initialTheme={initialTheme}
      initialNoticeDateKey={getInitialNoticeDateKey()}
    />
  );
}
