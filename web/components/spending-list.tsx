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

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400";

const labelCls = "mb-1 block text-xs font-medium text-stone-700 dark:text-zinc-300";

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
  const [category, setCategory] = useState<SpendingCategoryKey>(
    spending.category as SpendingCategoryKey,
  );
  const [repeat, setRepeat] = useState<boolean>(Boolean(spending.next_due));
  const [nextDue, setNextDue] = useState<string>(spending.next_due ?? "");
  const isRepeatable = category === "medicine";

  if (state?.data) {
    queueMicrotask(onDone);
  }

  const currentAmount = (spending.amount_cents / 100).toFixed(2);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="currency" value={spending.currency} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`ed-amt-${spending.id}`} className={labelCls}>
            {t.spendings.amount}
          </label>
          <input
            id={`ed-amt-${spending.id}`}
            name="amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
            defaultValue={currentAmount}
            placeholder={t.placeholders.spendingAmount}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor={`ed-cat-${spending.id}`} className={labelCls}>
            {t.spendings.category}
          </label>
          <select
            id={`ed-cat-${spending.id}`}
            name="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value as SpendingCategoryKey)}
            className={inputCls}
          >
            {CATEGORY_KEYS.map((c) => (
              <option key={c} value={c}>
                {t.spendingCategories[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`ed-date-${spending.id}`} className={labelCls}>
            {t.spendings.date}
          </label>
          <input
            id={`ed-date-${spending.id}`}
            name="spent_at"
            type="date"
            required
            defaultValue={spending.spent_at}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor={`ed-desc-${spending.id}`} className={labelCls}>
            {t.spendings.description}
          </label>
          <input
            id={`ed-desc-${spending.id}`}
            name="description"
            maxLength={500}
            defaultValue={spending.description ?? ""}
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
              <label htmlFor={`ed-next-${spending.id}`} className={labelCls}>
                {t.spendings.nextDue}
              </label>
              <input
                id={`ed-next-${spending.id}`}
                name="next_due"
                type="date"
                required={repeat}
                value={nextDue}
                onChange={(e) => setNextDue(e.target.value)}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">
                {t.spendings.repeatHint}
              </p>
            </div>
          ) : (
            <input type="hidden" name="next_due" value="" />
          )}
        </div>
      ) : (
        <input type="hidden" name="next_due" value="" />
      )}

      {state?.error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          {t.common.cancel}
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:bg-stone-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {isPending ? t.common.saving : t.common.save}
        </button>
      </div>
    </form>
  );
}
