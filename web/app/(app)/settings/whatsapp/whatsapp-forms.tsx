"use client";

import { useActionState, useTransition } from "react";
import { linkPhone, verifyPhone, unlinkPhone } from "@/lib/actions/whatsapp";
import type { ActionResult } from "@/lib/actions/auth";
import { SubmitButton } from "@/components/submit-button";
import { useT } from "@/i18n/client";

export function LinkPhoneForm() {
  const t = useT();
  const [state, formAction] = useActionState<ActionResult | undefined, FormData>(
    linkPhone,
    undefined
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div>
        <label
          htmlFor="phone"
          className="mb-1 block text-sm font-medium text-stone-700 dark:text-zinc-300"
        >
          {t.whatsapp.phoneLabel}
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          placeholder={t.placeholders.phone}
          pattern="^\+\d{8,15}$"
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
        />
        <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">{t.whatsapp.phoneHint}</p>
      </div>
      {state?.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      {state?.data ? (
        <p className="text-sm text-green-700 dark:text-green-400">{t.whatsapp.otpGenerated}</p>
      ) : null}
      <SubmitButton pendingLabel={t.whatsapp.sending}>{t.whatsapp.sendCode}</SubmitButton>
    </form>
  );
}

export function VerifyOtpForm() {
  const t = useT();
  const [state, formAction] = useActionState<ActionResult | undefined, FormData>(
    verifyPhone,
    undefined
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div>
        <label
          htmlFor="otp"
          className="mb-1 block text-sm font-medium text-stone-700 dark:text-zinc-300"
        >
          {t.whatsapp.otpLabel}
        </label>
        <input
          id="otp"
          name="otp"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          required
          placeholder={t.placeholders.otp}
          className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm tracking-widest text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
        />
      </div>
      {state?.error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      <SubmitButton pendingLabel={t.whatsapp.verifying}>{t.whatsapp.verify}</SubmitButton>
    </form>
  );
}

export function UnlinkPhoneButton() {
  const t = useT();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm(t.whatsapp.unlinkConfirm)) return;
        startTransition(async () => {
          await unlinkPhone();
        });
      }}
      className="inline-flex items-center rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:text-red-300 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/50"
    >
      {isPending ? t.whatsapp.unlinking : t.whatsapp.unlink}
    </button>
  );
}
