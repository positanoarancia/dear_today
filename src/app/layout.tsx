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

function readInitialTheme(value: string | undefined) {
  return value === "evening" || value === "light" ? value : "light";
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
  const initialTheme = readInitialTheme(
    cookieStore.get("dear-today-theme")?.value,
  );

  return (
    <html
      lang={initialLocale}
      data-theme={initialTheme}
      className="h-full antialiased"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {try {const storedTheme = localStorage.getItem("dear-today-theme"); const theme = storedTheme ? JSON.parse(storedTheme) : (matchMedia("(prefers-color-scheme: dark)").matches ? "evening" : "light"); if (theme === "evening" || theme === "light") document.documentElement.dataset.theme = theme;} catch {}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
