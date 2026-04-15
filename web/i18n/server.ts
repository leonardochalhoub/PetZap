import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { getDictionaryFor, type Messages } from "./dictionaries";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const raw = store.get(LOCALE_COOKIE)?.value;
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}

export async function getDictionary(): Promise<Messages> {
  const locale = await getLocale();
  return getDictionaryFor(locale);
}
