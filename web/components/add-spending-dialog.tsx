"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { addSpendingMulti } from "@/lib/actions/spendings";
import type { ActionResult } from "@/lib/actions/auth";
import { useT } from "@/i18n/client";
import { SubmitButton } from "./submit-button";
import type { SpendingCategoryKey, Messages } from "@/i18n/messages/en";

type DialogPet = { id: string; name: string; species: string; photo_url: string | null };

const CATEGORIES: SpendingCategoryKey[] = [
  "food", "vet", "toys", "grooming", "medicine", "accessories", "hygiene", "other",
];

const speciesEmoji: Record<string, string> = {
  dog: "🐶", cat: "🐱", bird: "🐦", rabbit: "🐰", other: "🐾",
};

const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400";

const labelCls = "mb-1 block text-xs font-medium text-stone-700 dark:text-zinc-300";

function resolveError(t: Messages, key: string | undefined): string | null {
  if (!key) return null;
  if (key.startsWith("errors.")) {
    const k = key.slice("errors.".length) as keyof Messages["errors"];
    return t.errors[k] ?? key;
  }
  return key;
}

function formatBRL(cents: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" }).format(cents / 100);
  } catch {
    return `R$ ${(cents / 100).toFixed(2)}`;
  }
}

export function AddSpendingDialog({
  pets,
  initialSelectedIds,
  open,
  onClose,
  locale,
}: {
  pets: DialogPet[];
  initialSelectedIds: string[];
  open: boolean;
  onClose: () => void;
  locale: string;
}) {
  const t = useT();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelectedIds));
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<SpendingCategoryKey>("food");

  const [state, formAction] = useActionState<ActionResult | undefined, FormData>(
    addSpendingMulti,
    undefined
  );

  // Open/close native dialog imperatively in sync with prop.
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      setSelected(new Set(initialSelectedIds));
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open, initialSelectedIds]);

  // After successful submit, close + reset.
  useEffect(() => {
    if (state?.data) {
      formRef.current?.reset();
      setAmount("");
      setSelected(new Set());
      onClose();
    }
  }, [state, onClose]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const amountCents = useMemo(() => {
    const n = Number(amount.replace(",", "."));
    return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0;
  }, [amount]);

  const splitPreview = useMemo(() => {
    if (amountCents === 0 || selected.size === 0) return null;
    const N = selected.size;
    const base = Math.floor(amountCents / N);
    const remainder = amountCents - base * N;
    if (N === 1) return null;
    if (remainder === 0) return formatBRL(base, locale);
    return `${formatBRL(base, locale)} – ${formatBRL(base + 1, locale)}`;
  }, [amountCents, selected, locale]);

  const errorMsg = resolveError(t, state?.error);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selected.size === 0) return;
    const fd = new FormData(e.currentTarget);
    // Make sure pet_id values reflect current selection
    fd.delete("pet_id");
    selected.forEach((id) => fd.append("pet_id", id));
    startTransition(() => formAction(fd));
  };

  const handleCancel = () => {
    formRef.current?.reset();
    setSelected(new Set(initialSelectedIds));
    setAmount("");
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        handleCancel();
      }}
      className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-0 shadow-xl backdrop:bg-stone-900/40 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 p-6">
        <header className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-zinc-50">
            {t.spendings.dialogTitle}
          </h2>
          <button
            type="button"
            onClick={handleCancel}
            aria-label={t.spendings.cancel}
            className="-m-2 rounded-md p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div>
          <span className={labelCls}>{t.spendings.selectPets}</span>
          <div className="grid max-h-48 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
            {pets.map((p) => {
              const active = selected.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  aria-pressed={active}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-2 transition-colors ${
                    active
                      ? "border-stone-900 bg-stone-50 dark:border-white dark:bg-zinc-800"
                      : "border-stone-200 hover:bg-stone-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="aspect-square w-12 overflow-hidden rounded-lg bg-gradient-to-br from-indigo-100 to-pink-100 dark:from-indigo-500/20 dark:to-pink-500/20">
                    {p.photo_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">
                        {speciesEmoji[p.species] ?? "🐾"}
                      </div>
                    )}
                  </div>
                  <span className="w-full truncate text-xs text-stone-700 dark:text-zinc-200">
                    {p.name}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">{t.spendings.splitHint}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="dlg-amount" className={labelCls}>{t.spendings.amount}</label>
            <input
              id="dlg-amount"
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t.placeholders.spendingAmount}
              className={inputCls}
            />
            <input type="hidden" name="currency" value="BRL" />
            {splitPreview ? (
              <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">
                {t.spendings.splitInfo} <span className="font-medium text-stone-700 dark:text-zinc-200">{splitPreview}</span>
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="dlg-category" className={labelCls}>{t.spendings.category}</label>
            <select
              id="dlg-category"
              name="category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value as SpendingCategoryKey)}
              className={inputCls}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{t.spendingCategories[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dlg-date" className={labelCls}>{t.spendings.date}</label>
            <input
              id="dlg-date"
              name="spent_at"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="dlg-desc" className={labelCls}>{t.spendings.description}</label>
            <input
              id="dlg-desc"
              name="description"
              maxLength={500}
              placeholder={t.placeholders.spendingDescriptionByCategory[category]}
              className={inputCls}
            />
          </div>
        </div>

        {selected.size === 0 ? (
          <p className="text-xs text-amber-700 dark:text-amber-400">{t.spendings.atLeastOnePet}</p>
        ) : null}
        {errorMsg ? (
          <p className="text-xs text-red-600 dark:text-red-400">{errorMsg}</p>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {t.spendings.cancel}
          </button>
          <SubmitButton pendingLabel={t.spendings.adding}>{t.spendings.add}</SubmitButton>
        </div>
      </form>
    </dialog>
  );
}
