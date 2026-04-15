"use client";

import { useActionState, useState } from "react";
import { signInWithPassword } from "@/lib/actions/auth";
import type { ActionResult } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { useT } from "@/i18n/client";

export function LoginForm() {
  const t = useT();
  const [email, setEmail] = useState("");
  const [remember, setRemember] = useState(true);
  const [state, formAction] = useActionState<ActionResult | undefined, FormData>(
    signInWithPassword,
    undefined
  );

  return (
    <form action={formAction} className="space-y-4" autoComplete="on">
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
          autoComplete="username email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
        />
      </div>
      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-medium text-stone-700 dark:text-zinc-300"
        >
          {t.auth.password}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={6}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
        />
      </div>
      <div className="flex items-start gap-2">
        <input
          id="remember"
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 dark:border-zinc-700"
        />
        <label htmlFor="remember" className="text-sm text-stone-700 dark:text-zinc-300">
          {t.auth.rememberMe}
          <span className="ml-1 text-xs text-stone-500 dark:text-zinc-500">{t.auth.rememberMeHint}</span>
        </label>
      </div>
      {state?.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      <SubmitButton className="w-full" pendingLabel={t.auth.submitLoginPending}>
        {t.auth.submitLogin}
      </SubmitButton>
    </form>
  );
}
