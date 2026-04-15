"use client";

import { useTransition } from "react";
import { deleteVaccine } from "@/lib/actions/vaccines";
import type { Vaccine } from "@/lib/db-schemas";
import { useT } from "@/i18n/client";

type Props = {
  petId: string;
  vaccines: Pick<Vaccine, "id" | "name" | "given_date" | "next_date" | "notes">[];
};

export function VaccineList({ petId, vaccines }: Props) {
  const t = useT();
  const [isPending, startTransition] = useTransition();

  if (vaccines.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        {t.vaccines.emptyInline}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {vaccines.map((v) => (
        <li key={v.id} className="flex items-start justify-between gap-4 p-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-stone-900 dark:text-zinc-50">{v.name}</p>
            <p className="mt-0.5 text-xs text-stone-600 dark:text-zinc-400">
              {t.vaccines.given} {v.given_date}
              {v.next_date ? ` · ${t.vaccines.next} ${v.next_date}` : ""}
            </p>
            {v.notes ? (
              <p className="mt-1 text-xs text-stone-500 dark:text-zinc-500">{v.notes}</p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (!confirm(t.vaccines.deleteConfirm)) return;
              startTransition(async () => {
                await deleteVaccine(v.id, petId);
              });
            }}
            className="shrink-0 text-xs text-red-600 hover:text-red-700 disabled:text-red-300 dark:text-red-400 dark:hover:text-red-300"
          >
            {t.vaccines.deleteBtn}
          </button>
        </li>
      ))}
    </ul>
  );
}
