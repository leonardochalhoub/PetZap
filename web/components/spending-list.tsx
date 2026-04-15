"use client";

import { useActionState, useState, useTransition } from "react";
import { deleteSpending, updateSpending } from "@/lib/actions/spendings";
import type { ActionResult } from "@/lib/actions/auth";
import type { Spending } from "@/lib/db-schemas";
import { useT } from "@/i18n/client";
import type { SpendingCategoryKey } from "@/i18n/messages/en";

type SpendingRow = Pick<
  Spending,
  "id" | "amount_cents" | "currency" | "category" | "spent_at" | "description" | "next_due"
>;

type Props = {
  petId: string;
  spendings: SpendingRow[];
};

export function formatMoney(amountCents: number, currency: string): string {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(amountCents / 100);
  } catch {
    return `${currency} ${(amountCents / 100).toFixed(2)}`;
  }
}

export function SpendingList({ petId, spendings }: Props) {
  const t = useT();
  const [isDeleting, startDelete] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (spendings.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        {t.spendings.emptyInline}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {spendings.map((s) => (
        <li key={s.id} className="p-4">
          {editingId === s.id ? (
            <EditSpendingForm
              petId={petId}
              spending={s}
              onDone={() => setEditingId(null)}
            />
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-900 dark:text-zinc-50">
                  {formatMoney(s.amount_cents, s.currency)}{" "}
                  <span className="text-xs font-normal text-stone-500 dark:text-zinc-400">
                    · {t.spendingCategories[s.category as SpendingCategoryKey] ?? s.category}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-stone-600 dark:text-zinc-400">{s.spent_at}</p>
                {s.description ? (
                  <p className="mt-1 text-xs text-stone-500 dark:text-zinc-500">{s.description}</p>
                ) : null}
                {s.next_due ? (
                  <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                    {t.spendings.nextDueShort} {s.next_due}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setEditingId(s.id)}
                  className="text-stone-600 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  {t.common.edit}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    if (!confirm(t.spendings.deleteConfirm)) return;
                    startDelete(async () => {
                      await deleteSpending(s.id, petId);
                    });
                  }}
                  className="text-red-600 hover:text-red-700 disabled:text-red-300 dark:text-red-400 dark:hover:text-red-300"
                >
                  {t.spendings.deleteBtn}
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

const CATEGORY_KEYS: SpendingCategoryKey[] = [
  "food",
  "vet",
  "toys",
  "grooming",
  "medicine",
  "accessories",
  "hygiene",
  "other",
];

function EditSpendingForm({
  petId,
  spending,
  onDone,
}: {
  petId: string;
  spending: SpendingRow;
  onDone: () => void;
}) {
  const t = useT();
  const [state, formAction, isPending] = useActionState<ActionResult | undefined, FormData>(
    (prev, fd) => updateSpending(spending.id, petId, prev, fd),
    undefined,
  );
  const [category, setCategory] = useState<string>(spending.category);

  if (state?.data) {
    queueMicrotask(onDone);
  }

  const inputClass =
    "w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400";

  const currentAmount = (spending.amount_cents / 100).toFixed(2);
  // next_due only applies to medications — mirror the Add dialog's behaviour.
  const showNextDue = category === "medicine";

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="currency" value={spending.currency} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-stone-600 dark:text-zinc-400">
          {t.spendings.amountLabel}
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            required
            defaultValue={currentAmount}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="block text-xs text-stone-600 dark:text-zinc-400">
          {t.spendings.categoryLabel}
          <select
            name="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`mt-1 ${inputClass}`}
          >
            {CATEGORY_KEYS.map((k) => (
              <option key={k} value={k}>
                {t.spendingCategories[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-stone-600 dark:text-zinc-400">
          {t.spendings.spentAtLabel}
          <input
            name="spent_at"
            type="date"
            required
            defaultValue={spending.spent_at}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        {showNextDue ? (
          <label className="block text-xs text-stone-600 dark:text-zinc-400">
            {t.spendings.nextDue}
            <input
              name="next_due"
              type="date"
              defaultValue={spending.next_due ?? ""}
              className={`mt-1 ${inputClass}`}
            />
          </label>
        ) : (
          <input type="hidden" name="next_due" value="" />
        )}
        <label className="block text-xs text-stone-600 dark:text-zinc-400 sm:col-span-2">
          {t.spendings.descriptionLabel}
          <input
            name="description"
            type="text"
            defaultValue={spending.description ?? ""}
            className={`mt-1 ${inputClass}`}
          />
        </label>
      </div>
      {state?.error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-stone-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-stone-800 disabled:bg-stone-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {isPending ? t.common.saving : t.common.save}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-stone-300 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}
