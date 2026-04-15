"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/i18n/client";

const STORAGE_KEY = "petzap:cookie-consent:v1";

export function CookieConsent() {
  const t = useT();
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== "1") setHidden(false);
    } catch {}
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setHidden(true);
  }

  if (hidden) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t.cookies.title}
      className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl ring-1 ring-stone-900/5 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white/5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex-1 text-sm text-stone-700 dark:text-zinc-300">
          <p className="font-medium text-stone-900 dark:text-zinc-50">{t.cookies.title}</p>
          <p className="mt-1 text-xs text-stone-600 dark:text-zinc-400">
            {t.cookies.body}{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-2 hover:text-stone-900 dark:hover:text-zinc-100"
            >
              {t.cookies.learnMore}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={accept}
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            {t.cookies.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
