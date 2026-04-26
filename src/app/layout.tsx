import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import Script from "next/script";
import { getSiteUrl } from "./site-url";
import "./globals.css";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Dear, Today",
    template: "%s | Dear, Today",
  },
  description:
    "조용히 감사 한 줄을 남기고, 다른 사람들의 작은 고마움을 읽는 공개 감사일기.",
  applicationName: "Dear, Today",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "감사일기",
    "감사 기록",
    "gratitude journal",
    "public gratitude journal",
    "Dear Today",
  ],
  openGraph: {
    title: "Dear, Today",
    description:
      "조용히 감사 한 줄을 남기고, 다른 사람들의 작은 고마움을 읽는 공개 감사일기.",
    url: "/",
    siteName: "Dear, Today",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Dear, Today",
    description:
      "조용히 감사 한 줄을 남기고, 다른 사람들의 작은 고마움을 읽는 공개 감사일기.",
  },
  verification: {
    google: "f8VLh3Llc8IXBYWkldrHvplHkYIt17No7Sjnuc9TexI",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
        <Script
          id="dear-today-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(() => {try {const storedTheme = localStorage.getItem("dear-today-theme"); const theme = storedTheme ? JSON.parse(storedTheme) : (matchMedia("(prefers-color-scheme: dark)").matches ? "evening" : "light"); if (theme === "evening" || theme === "light") document.documentElement.dataset.theme = theme;} catch {}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
