"use client";

import { useTransition } from "react";
import { deleteSpending } from "@/lib/actions/spendings";
import type { Spending } from "@/lib/db-schemas";
import { useT } from "@/i18n/client";
import type { SpendingCategoryKey } from "@/i18n/messages/en";

type Props = {
  petId: string;
  spendings: Pick<
    Spending,
    "id" | "amount_cents" | "currency" | "category" | "spent_at" | "description" | "next_due"
  >[];
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
  const [isPending, startTransition] = useTransition();

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
        <li key={s.id} className="flex items-start justify-between gap-4 p-4">
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
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (!confirm(t.spendings.deleteConfirm)) return;
              startTransition(async () => {
                await deleteSpending(s.id, petId);
              });
            }}
            className="shrink-0 text-xs text-red-600 hover:text-red-700 disabled:text-red-300 dark:text-red-400 dark:hover:text-red-300"
          >
            {t.spendings.deleteBtn}
          </button>
        </li>
      ))}
    </ul>
  );
}
