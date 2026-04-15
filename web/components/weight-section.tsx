"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { addWeight, deleteWeight } from "@/lib/actions/weights";
import type { ActionResult } from "@/lib/actions/auth";
import { SubmitButton } from "./submit-button";
import { useT, useLocale } from "@/i18n/client";

type WeightRow = {
  id: string;
  weight_kg: number;
  measured_at: string;
  notes: string | null;
};

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400";

const labelCls =
  "mb-1 block text-xs font-medium text-stone-700 dark:text-zinc-300";

function formatDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function WeightSection({
  petId,
  initialWeights,
}: {
  petId: string;
  initialWeights: WeightRow[];
}) {
  const t = useT();
  const locale = useLocale();
  const [weights, setWeights] = useState<WeightRow[]>(initialWeights);
  const [isDeleting, startDeleteTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const action = addWeight.bind(null, petId);
  const [state, formAction, isAdding] = useActionState<ActionResult | undefined, FormData>(
    action,
    undefined
  );

  // After successful add, reset the form. We optimistically inserted on submit.
  useEffect(() => {
    if (state?.data) {
      formRef.current?.reset();
    }
  }, [state]);

  const current = weights[0] ?? null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const weightStr = String(fd.get("weight_kg") ?? "").replace(",", ".");
    const weightNum = Number(weightStr);
    const date = String(fd.get("measured_at") ?? "") || new Date().toISOString().slice(0, 10);
    if (!Number.isFinite(weightNum) || weightNum <= 0 || weightNum >= 200) return;
    // Optimistic insert
    const tempId = `temp-${Date.now()}`;
    const tempRow: WeightRow = {
      id: tempId,
      weight_kg: weightNum,
      measured_at: date,
      notes: (fd.get("notes") as string | null) || null,
    };
    setWeights((prev) =>
      [...prev, tempRow].sort((a, b) => (a.measured_at < b.measured_at ? 1 : -1))
    );
    startTransition(() => formAction(fd));
  };

  const handleDelete = (id: string) => {
    if (!confirm(t.pets.weightDeleteConfirm)) return;
    setWeights((prev) => prev.filter((w) => w.id !== id));
    startDeleteTransition(async () => {
      await deleteWeight(id, petId);
    });
  };

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-50">
          {t.pets.weightHistory}
        </h2>
        {current ? (
          <p className="text-sm text-stone-600 dark:text-zinc-400">
            <span className="text-2xl font-semibold text-stone-900 dark:text-zinc-50">
              {current.weight_kg}
            </span>{" "}
            {t.pets.weightUnitShort}
            <span className="ml-1 text-xs text-stone-500 dark:text-zinc-500">
              · {formatDate(current.measured_at, locale)}
            </span>
          </p>
        ) : null}
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="w-kg" className={labelCls}>{t.pets.weightKg}</label>
            <input
              id="w-kg"
              name="weight_kg"
              type="number"
              step="0.1"
              min="0.1"
              max="199"
              inputMode="decimal"
              required
              placeholder={t.placeholders.weightKg}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="w-date" className={labelCls}>{t.pets.weightDate}</label>
            <input
              id="w-date"
              name="measured_at"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="w-notes" className={labelCls}>{t.pets.weightNotes}</label>
            <input id="w-notes" name="notes" maxLength={500} className={inputCls} />
          </div>
        </div>
        {state?.error ? (
          <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
        ) : null}
        <div className="flex justify-end">
          <SubmitButton pendingLabel={t.pets.addingWeight}>{t.pets.addWeight}</SubmitButton>
        </div>
      </form>

      <div className="mt-5 border-t border-stone-100 pt-4 dark:border-zinc-800">
        {weights.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-zinc-400">{t.pets.weightEmpty}</p>
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-zinc-800">
            {weights.slice(0, 10).map((w) => (
              <li key={w.id} className="flex items-center justify-between py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-stone-900 dark:text-zinc-50">
                    <span className="font-medium">{w.weight_kg}</span>{" "}
                    <span className="text-xs text-stone-500 dark:text-zinc-500">
                      {t.pets.weightUnitShort} · {formatDate(w.measured_at, locale)}
                    </span>
                  </p>
                  {w.notes ? (
                    <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">{w.notes}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={isDeleting || isAdding || w.id.startsWith("temp-")}
                  onClick={() => handleDelete(w.id)}
                  className="shrink-0 text-xs text-red-600 hover:text-red-700 disabled:text-red-300 dark:text-red-400 dark:hover:text-red-300"
                >
                  {t.spendings.deleteBtn}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
