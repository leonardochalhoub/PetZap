"use client";

import { createContext, useContext } from "react";
import type { Locale } from "./config";
import type { Messages } from "./dictionaries";

type I18nValue = { locale: Locale; t: Messages };

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale;
  messages: Messages;
  children: React.ReactNode;
}) {
  return (
    <I18nContext.Provider value={{ locale, t: messages }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT(): Messages {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useT must be used inside <I18nProvider>");
  }
  return ctx.t;
}

export function useLocale(): Locale {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useLocale must be used inside <I18nProvider>");
  }
  return ctx.locale;
}
