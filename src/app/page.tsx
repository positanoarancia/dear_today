import { DearTodayApp } from "@/components/dear-today-app";
import { cookies } from "next/headers";

function readInitialLocale(value: string | undefined) {
  return value === "en" || value === "ko" ? value : "ko";
}

export default async function HomePage() {
  const cookieStore = await cookies();
  const initialLocale = readInitialLocale(
    cookieStore.get("dear-today-locale")?.value,
  );

  return <DearTodayApp initialView="home" initialLocale={initialLocale} />;
}
