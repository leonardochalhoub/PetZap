"use client";

import { useTransition } from "react";
import { setLocale } from "@/lib/actions/locale";
import { useLocale, useT } from "@/i18n/client";
import type { Locale } from "@/i18n/config";
import { USFlag } from "./flags/us-flag";
import { BRFlag } from "./flags/br-flag";

type FlagButton = {
  locale: Locale;
  Flag: (p: { className?: string }) => React.JSX.Element;
  ariaKey: "switchToEnglish" | "switchToPortuguese";
};

const BUTTONS: FlagButton[] = [
  { locale: "en", Flag: USFlag, ariaKey: "switchToEnglish" },
  { locale: "pt-BR", Flag: BRFlag, ariaKey: "switchToPortuguese" },
];

export function LocaleToggle() {
  const active = useLocale();
  const t = useT();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="inline-flex items-center gap-1.5" role="group" aria-label="Language">
      {BUTTONS.map((b) => {
        const isActive = active === b.locale;
        return (
          <button
            key={b.locale}
            type="button"
            disabled={isPending}
            aria-label={t.locale[b.ariaKey]}
            aria-pressed={isActive}
            title={t.locale[b.ariaKey]}
            onClick={() => {
              if (isActive) return;
              startTransition(async () => {
                await setLocale(b.locale);
              });
            }}
            className={`inline-flex h-6 w-8 items-center justify-center overflow-hidden rounded-sm ring-offset-2 ring-offset-white transition dark:ring-offset-zinc-950 ${
              isActive
                ? "ring-2 ring-stone-900 dark:ring-white"
                : "opacity-60 hover:opacity-100"
            } disabled:cursor-not-allowed`}
          >
            <b.Flag className="h-full w-full" />
          </button>
        );
      })}
    </div>
  );
}
