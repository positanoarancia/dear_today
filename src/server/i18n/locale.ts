export const DEFAULT_LOCALE = "en";
export const SUPPORTED_LOCALES = ["en", "ko"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function normalizeLocale(locale: string | undefined): SupportedLocale {
  if (!locale) {
    return DEFAULT_LOCALE;
  }

  const language = locale.toLowerCase().split("-")[0];

  return SUPPORTED_LOCALES.includes(language as SupportedLocale)
    ? (language as SupportedLocale)
    : DEFAULT_LOCALE;
}

