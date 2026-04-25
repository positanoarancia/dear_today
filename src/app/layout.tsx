import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dear, Today",
  description:
    "A quiet public gratitude journal for small notes, warm reading, and gentle appreciation.",
};

export const viewport: Viewport = {
  themeColor: "#f7f1e8",
  viewportFit: "cover",
};

function readInitialLocale(value: string | undefined) {
  return value === "en" || value === "ko" ? value : "ko";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLocale = readInitialLocale(
    cookieStore.get("dear-today-locale")?.value,
  );

  return (
    <html
      lang={initialLocale}
      className="h-full antialiased"
      data-scroll-behavior="smooth"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
