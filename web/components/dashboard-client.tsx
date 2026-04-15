"use client";

import { startTransition, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useT, useLocale } from "@/i18n/client";
import { ExpensesChart, type MonthlyBucket } from "./expenses-chart";
import { WeightChart, type WeightSeriesRow } from "./weight-chart";
import { AddSpendingDialog } from "./add-spending-dialog";
import { reorderPets } from "@/lib/actions/pets";
import type { SpendingCategoryKey } from "@/i18n/messages/en";

type Pet = {
  id: string;
  name: string;
  species: string;
  photo_url: string | null;
  photo_zoom?: number | null;
};

type ChartSpending = {
  amount_cents: number;
  category: string;
  spent_at: string;
  pet_id: string;
};

type ChartWeight = {
  measured_at: string;
  weight_kg: number;
  pet_id: string;
  pet_name: string;
};

const speciesEmoji: Record<string, string> = {
  dog: "🐶", cat: "🐱", bird: "🐦", rabbit: "🐰", other: "🐾",
};

const CATEGORY_KEYS: SpendingCategoryKey[] = [
  "food", "vet", "toys", "grooming", "medicine", "accessories", "hygiene", "other",
];

const CHART_MONTHS = 24;

function buildMonthly(spendings: ChartSpending[], monthsShort: string[]): MonthlyBucket[] {
  const now = new Date();
  const buckets: MonthlyBucket[] = [];
  for (let i = CHART_MONTHS - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel =
      i % 3 === 0 || i === CHART_MONTHS - 1
        ? `${monthsShort[d.getMonth()] ?? ""} ${String(d.getFullYear()).slice(-2)}`
        : monthsShort[d.getMonth()] ?? "";
    buckets.push({
      month, monthLabel,
      food: 0, vet: 0, toys: 0, grooming: 0, medicine: 0, accessories: 0, hygiene: 0, other: 0,
    });
  }
  const idx: Record<string, MonthlyBucket> = {};
  for (const b of buckets) idx[b.month] = b;
  for (const s of spendings) {
    const m = s.spent_at.slice(0, 7);
    const bucket = idx[m];
    if (!bucket) continue;
    const cat = (CATEGORY_KEYS as readonly string[]).includes(s.category)
      ? (s.category as SpendingCategoryKey)
      : "other";
    bucket[cat] += s.amount_cents / 100;
  }
  return buckets;
}

function buildWeight(weights: ChartWeight[]): { series: WeightSeriesRow[]; petNames: string[] } {
  const byDate = new Map<string, Record<string, number>>();
  const namesSet = new Set<string>();
  for (const w of weights) {
    namesSet.add(w.pet_name);
    const row = byDate.get(w.measured_at) ?? {};
    row[w.pet_name] = w.weight_kg;
    byDate.set(w.measured_at, row);
  }
  const series: WeightSeriesRow[] = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, row]) => ({ date, ...row }));
  return { series, petNames: Array.from(namesSet).sort() };
}

function PetThumbToggle({
  pet,
  selected,
  dimmed,
  isDragSource,
  isDropTarget,
  onToggle,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  openLabel,
}: {
  pet: Pet;
  selected: boolean;
  dimmed: boolean;
  isDragSource: boolean;
  isDropTarget: boolean;
  onToggle: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  openLabel: string;
}) {
  return (
    <div
      className="group flex flex-col items-center gap-2"
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className="relative w-full">
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={selected}
          className={`block aspect-square w-full overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
            isDragSource
              ? "opacity-30"
              : isDropTarget
                ? "border-indigo-500 ring-2 ring-indigo-400 ring-offset-2 ring-offset-stone-200 dark:ring-indigo-300 dark:ring-offset-zinc-950"
                : selected
                  ? "border-amber-500 ring-2 ring-amber-500 ring-offset-2 ring-offset-stone-100 dark:ring-amber-400 dark:ring-offset-zinc-950"
                  : dimmed
                    ? "border-stone-200 opacity-40 hover:opacity-70 dark:border-zinc-800"
                    : "border-stone-200 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800"
          } dark:bg-zinc-900`}
        >
          {pet.photo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={pet.photo_url}
              alt={pet.name}
              className="h-full w-full object-cover"
              style={(pet.photo_zoom ?? 1) !== 1 ? { transform: `scale(${pet.photo_zoom ?? 1})` } : undefined}
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-100 to-pink-100 text-4xl dark:from-indigo-500/20 dark:to-pink-500/20">
              {speciesEmoji[pet.species] ?? "🐾"}
            </div>
          )}
        </button>
        <Link
          href={`/pets/${pet.id}`}
          aria-label={openLabel}
          title={openLabel}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-stone-700 opacity-0 shadow-sm transition-opacity hover:bg-white hover:text-stone-900 group-hover:opacity-100 dark:bg-zinc-900/90 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17 17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </Link>
      </div>
      <p className={`w-full truncate text-center text-sm font-medium ${
        dimmed ? "text-stone-500 dark:text-zinc-500" : "text-stone-900 dark:text-zinc-50"
      }`}>
        {pet.name}
      </p>
    </div>
  );
}

export function DashboardClient({
  pets,
  vaccinesUpcoming,
  spendingsRecent,
  spendingsForChart,
  weightsForChart,
}: {
  pets: Pet[];
  vaccinesUpcoming: { id: string; pet_id: string }[];
  spendingsRecent: { id: string; pet_id: string }[];
  spendingsForChart: ChartSpending[];
  weightsForChart: ChartWeight[];
}) {
  const t = useT();
  const locale = useLocale();
  const [orderedPets, setOrderedPets] = useState<Pet[]>(pets);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dropIdx, setDropIdx] = useState<number | null>(null);
  const [spendDialogOpen, setSpendDialogOpen] = useState(false);
  const [, startSaveTransition] = useTransition();

  // Re-sync if upstream prop changes (e.g. revalidation after add/delete pet).
  useEffect(() => {
    setOrderedPets(pets);
  }, [pets]);

  const isFiltered = selected.size > 0;
  const matches = (petId: string) => !isFiltered || selected.has(petId);

  const upcomingCount = useMemo(
    () => vaccinesUpcoming.filter((v) => matches(v.pet_id)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vaccinesUpcoming, selected]
  );
  const recentCount = useMemo(
    () => spendingsRecent.filter((s) => matches(s.pet_id)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spendingsRecent, selected]
  );
  const monthly = useMemo(
    () =>
      buildMonthly(
        spendingsForChart.filter((s) => matches(s.pet_id)),
        t.dashboard.monthsShort
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spendingsForChart, selected, t.dashboard.monthsShort]
  );
  const { series: weightSeries, petNames: weightPetNames } = useMemo(
    () => buildWeight(weightsForChart.filter((w) => matches(w.pet_id))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weightsForChart, selected]
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDragStart = (i: number) => (e: React.DragEvent) => {
    setDragIdx(i);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(i));
  };

  const handleDragOver = (i: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragIdx !== null && i !== dragIdx) setDropIdx(i);
  };

  const handleDragLeave = () => {
    // intentionally noop; drop indicator clears on next over or end
  };

  const handleDrop = (toIdx: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const fromIdx = dragIdx ?? Number(e.dataTransfer.getData("text/plain"));
    setDragIdx(null);
    setDropIdx(null);
    if (!Number.isFinite(fromIdx) || fromIdx === toIdx) return;

    // Compute new order from current state (outside setState reducer to allow
    // calling startTransition without "Cannot call startTransition while rendering").
    const next = [...orderedPets];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setOrderedPets(next);
    startSaveTransition(() => {
      reorderPets(next.map((p) => p.id));
    });
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setDropIdx(null);
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-zinc-50">
          {t.dashboard.title}
        </h1>
        <div className="flex items-center gap-2">
          {orderedPets.length > 0 ? (
            <button
              type="button"
              onClick={() => setSpendDialogOpen(true)}
              className="inline-flex items-center rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 shadow-sm transition-colors hover:bg-stone-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              {t.dashboard.addSpending}
            </button>
          ) : null}
          <Link
            href="/pets/new"
            className="inline-flex items-center rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            {t.dashboard.addPet}
          </Link>
        </div>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-50">
            {t.pets.listTitle}{" "}
            <span className="text-sm font-normal text-stone-500 dark:text-zinc-400">
              · {isFiltered ? `${selected.size}/${orderedPets.length}` : orderedPets.length}
            </span>
          </h2>
          {isFiltered ? (
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-sm text-stone-600 underline hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {t.dashboard.clearFilter}
            </button>
          ) : orderedPets.length > 1 ? (
            <span className="text-xs text-stone-500 dark:text-zinc-400">
              {t.dashboard.filterHint}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {orderedPets.map((p, i) => (
            <PetThumbToggle
              key={p.id}
              pet={p}
              selected={selected.has(p.id)}
              dimmed={isFiltered && !selected.has(p.id)}
              isDragSource={dragIdx === i}
              isDropTarget={dropIdx === i && dragIdx !== i}
              onToggle={() => toggle(p.id)}
              onDragStart={handleDragStart(i)}
              onDragOver={handleDragOver(i)}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop(i)}
              onDragEnd={handleDragEnd}
              openLabel={t.dashboard.open}
            />
          ))}
        </div>
      </section>

      <AddSpendingDialog
        pets={orderedPets.map((p) => ({
          id: p.id,
          name: p.name,
          species: p.species,
          photo_url: p.photo_url,
        }))}
        initialSelectedIds={isFiltered ? Array.from(selected) : []}
        open={spendDialogOpen}
        onClose={() => setSpendDialogOpen(false)}
        locale={locale}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-zinc-400">
            {t.dashboard.statsUpcoming}
          </p>
          <p className="mt-1 text-2xl font-semibold text-stone-900 dark:text-zinc-50">
            {upcomingCount}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-zinc-400">
            {t.dashboard.statsRecent}
          </p>
          <p className="mt-1 text-2xl font-semibold text-stone-900 dark:text-zinc-50">
            {recentCount}
          </p>
        </div>
      </section>

      <ExpensesChart monthly={monthly} />

      <WeightChart
        series={weightSeries}
        petNames={weightPetNames}
        heading={t.dashboard.weightChartHeading}
        subtitle={t.dashboard.weightChartSubtitle}
        emptyText={t.dashboard.weightChartEmpty}
      />
    </div>
  );
}
