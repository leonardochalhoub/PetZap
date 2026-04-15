export const LOCALES = ["en", "pt-BR"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "petzap_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

export function detectLocaleFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const first = header.split(",")[0]?.trim().toLowerCase() ?? "";
  if (first.startsWith("pt")) return "pt-BR";
  return "en";
}
