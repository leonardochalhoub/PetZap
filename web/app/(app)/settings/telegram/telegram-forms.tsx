"use client";

import { useState, useTransition } from "react";
import { createTelegramLink, unlinkTelegram } from "@/lib/actions/telegram";
import { useT } from "@/i18n/client";

export function ConnectTelegramForm() {
  const t = useT();
  const [isPending, startTransition] = useTransition();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div>
        <p className="text-sm text-stone-700 dark:text-zinc-300">{t.telegram.howItWorks}</p>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-stone-600 dark:text-zinc-400">
          <li>{t.telegram.step1}</li>
          <li>{t.telegram.step2}</li>
          <li>{t.telegram.step3}</li>
        </ol>
      </div>

      {!url ? (
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const res = await createTelegramLink();
              if (res.error) setError(res.error);
              else if (
                res.data &&
                typeof res.data === "object" &&
                "url" in res.data
              ) {
                setUrl((res.data as { url: string }).url);
              }
            });
          }}
          className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:bg-sky-300"
        >
          {isPending ? t.telegram.generating : t.telegram.generateLink}
        </button>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
        >
          {t.telegram.openTelegram}
        </a>
      )}

      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}

      {url ? (
        <p className="text-xs text-stone-500 dark:text-zinc-400">{t.telegram.afterStartHint}</p>
      ) : null}
    </div>
  );
}

export function UnlinkTelegramButton() {
  const t = useT();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm(t.telegram.unlinkConfirm)) return;
        startTransition(async () => {
          await unlinkTelegram();
        });
      }}
      className="inline-flex items-center rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:text-red-300 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/50"
    >
      {isPending ? t.telegram.unlinking : t.telegram.unlink}
    </button>
  );
}
