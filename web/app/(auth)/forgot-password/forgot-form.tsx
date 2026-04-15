"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/lib/actions/auth";
import type { ActionResult } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { useT } from "@/i18n/client";

export function ForgotForm() {
  const t = useT();
  const [state, formAction] = useActionState<ActionResult | undefined, FormData>(
    requestPasswordReset,
    undefined
  );

  if (state?.data) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/40">
        <p className="font-medium text-emerald-900 dark:text-emerald-200">
          {t.auth.forgotSentTitle}
        </p>
        <p className="mt-1 text-emerald-800 dark:text-emerald-300">{t.auth.forgotSentDesc}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium text-stone-700 dark:text-zinc-300"
        >
          {t.auth.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
        />
      </div>
      {state?.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      <SubmitButton className="w-full" pendingLabel={t.auth.forgotSubmitPending}>
        {t.auth.forgotSubmit}
      </SubmitButton>
    </form>
  );
}
