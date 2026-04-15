"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addSpending } from "@/lib/actions/spendings";
import type { ActionResult } from "@/lib/actions/auth";
import { SubmitButton } from "./submit-button";
import { useT } from "@/i18n/client";
import type { SpendingCategoryKey } from "@/i18n/messages/en";

const CATEGORIES: SpendingCategoryKey[] = [
  "food",
  "vet",
  "toys",
  "grooming",
  "medicine",
  "accessories",
  "hygiene",
  "other",
];

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400";

const labelCls =
  "mb-1 block text-xs font-medium text-stone-700 dark:text-zinc-300";

export function AddSpendingForm({ petId }: { petId: string }) {
  const t = useT();
  const action = addSpending.bind(null, petId);
  const [state, formAction] = useActionState<ActionResult | undefined, FormData>(
    action,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [category, setCategory] = useState<SpendingCategoryKey>("food");
  const [repeat, setRepeat] = useState(false);
  const [nextDue, setNextDue] = useState("");
  const isRepeatable = category === "medicine";

  useEffect(() => {
    if (state?.data) {
      formRef.current?.reset();
      setRepeat(false);
      setNextDue("");
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-50">
        {t.spendings.addHeading}
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="sp-amount" className={labelCls}>{t.spendings.amount}</label>
          <input
            id="sp-amount"
            name="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
            placeholder={t.placeholders.spendingAmount}
            className={inputCls}
          />
          <input type="hidden" name="currency" value="BRL" />
        </div>
        <div>
          <label htmlFor="sp-category" className={labelCls}>{t.spendings.category}</label>
          <select
            id="sp-category"
            name="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value as SpendingCategoryKey)}
            className={inputCls}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t.spendingCategories[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sp-date" className={labelCls}>{t.spendings.date}</label>
          <input
            id="sp-date"
            name="spent_at"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="sp-desc" className={labelCls}>{t.spendings.description}</label>
          <input
            id="sp-desc"
            name="description"
            maxLength={500}
            placeholder={t.placeholders.spendingDescriptionByCategory[category]}
            className={inputCls}
          />
        </div>
      </div>
      {isRepeatable ? (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={repeat}
              onChange={(e) => setRepeat(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 dark:border-zinc-700"
            />
            <span className="text-sm font-medium text-stone-900 dark:text-zinc-100">
              {t.spendings.repeat}
            </span>
          </label>
          {repeat ? (
            <div className="mt-2">
              <label htmlFor="sp-next" className={labelCls}>{t.spendings.nextDue}</label>
              <input
                id="sp-next"
                name="next_due"
                type="date"
                required={repeat}
                value={nextDue}
                onChange={(e) => setNextDue(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">{t.spendings.repeatHint}</p>
            </div>
          ) : null}
        </div>
      ) : null}
      {state?.error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      <div className="flex justify-end">
        <SubmitButton pendingLabel={t.spendings.adding}>{t.spendings.add}</SubmitButton>
      </div>
    </form>
  );
}
