"use client";

import { useActionState, useState, useTransition } from "react";
import { deleteVaccine, updateVaccine } from "@/lib/actions/vaccines";
import type { ActionResult } from "@/lib/actions/auth";
import type { Vaccine } from "@/lib/db-schemas";
import { useT } from "@/i18n/client";

type VaccineRow = Pick<Vaccine, "id" | "name" | "given_date" | "next_date" | "notes">;

type Props = {
  petId: string;
  vaccines: VaccineRow[];
};

export function VaccineList({ petId, vaccines }: Props) {
  const t = useT();
  const [isDeleting, startDelete] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);

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
        <li key={v.id} className="p-4">
          {editingId === v.id ? (
            <EditVaccineForm
              petId={petId}
              vaccine={v}
              onDone={() => setEditingId(null)}
            />
          ) : (
            <div className="flex items-start justify-between gap-4">
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
              <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setEditingId(v.id)}
                  className="text-stone-600 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  {t.common.edit}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    if (!confirm(t.vaccines.deleteConfirm)) return;
                    startDelete(async () => {
                      await deleteVaccine(v.id, petId);
                    });
                  }}
                  className="text-red-600 hover:text-red-700 disabled:text-red-300 dark:text-red-400 dark:hover:text-red-300"
                >
                  {t.vaccines.deleteBtn}
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

function EditVaccineForm({
  petId,
  vaccine,
  onDone,
}: {
  petId: string;
  vaccine: VaccineRow;
  onDone: () => void;
}) {
  const t = useT();
  const [state, formAction, isPending] = useActionState<ActionResult | undefined, FormData>(
    (prev, fd) => updateVaccine(vaccine.id, petId, prev, fd),
    undefined,
  );

  if (state?.data) {
    queueMicrotask(onDone);
  }

  const inputClass =
    "w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400";

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-stone-600 dark:text-zinc-400">
          {t.vaccines.nameLabel}
          <input
            name="name"
            type="text"
            required
            defaultValue={vaccine.name}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="block text-xs text-stone-600 dark:text-zinc-400">
          {t.vaccines.givenLabel}
          <input
            name="given_date"
            type="date"
            required
            defaultValue={vaccine.given_date}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="block text-xs text-stone-600 dark:text-zinc-400">
          {t.vaccines.nextLabel}
          <input
            name="next_date"
            type="date"
            defaultValue={vaccine.next_date ?? ""}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="block text-xs text-stone-600 dark:text-zinc-400 sm:col-span-2">
          {t.vaccines.notesLabel}
          <input
            name="notes"
            type="text"
            defaultValue={vaccine.notes ?? ""}
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
