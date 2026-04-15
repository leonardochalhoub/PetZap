"use client";

import { useActionState, useState } from "react";
import { signUp } from "@/lib/actions/auth";
import type { ActionResult } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { useT } from "@/i18n/client";

type Treatment = "male" | "female" | "neutral";

export function SignupForm() {
  const t = useT();
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [state, formAction] = useActionState<ActionResult | undefined, FormData>(
    signUp,
    undefined
  );

  const inputCls =
    "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400";
  const labelCls =
    "mb-1 block text-sm font-medium text-stone-700 dark:text-zinc-300";

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="full_name" className={labelCls}>{t.auth.fullName}</label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          autoComplete="name"
          required
          minLength={1}
          maxLength={80}
          placeholder={t.auth.fullNamePlaceholder}
          className={inputCls}
        />
      </div>

      <div>
        <span className={labelCls}>{t.auth.treatmentLabel}</span>
        <div role="radiogroup" aria-label={t.auth.treatmentLabel} className="flex flex-wrap gap-2">
          {([
            { v: "male" as Treatment,    label: t.auth.treatmentMale    },
            { v: "female" as Treatment,  label: t.auth.treatmentFemale  },
            { v: "neutral" as Treatment, label: t.auth.treatmentNeutral },
          ]).map((opt) => {
            const active = treatment === opt.v;
            return (
              <button
                key={opt.v}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setTreatment(opt.v)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  active
                    ? "border-stone-900 bg-stone-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                    : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <input type="hidden" name="treatment" value={treatment ?? ""} required />
        <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">{t.auth.treatmentHint}</p>
      </div>

      <div>
        <label htmlFor="email" className={labelCls}>{t.auth.email}</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor="password" className={labelCls}>{t.auth.password}</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          className={inputCls}
        />
        <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">{t.auth.passwordHint}</p>
      </div>
      {state?.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      <SubmitButton className="w-full" pendingLabel={t.auth.submitSignupPending}>
        {t.auth.submitSignup}
      </SubmitButton>
    </form>
  );
}
