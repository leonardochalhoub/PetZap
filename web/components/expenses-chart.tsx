"use client";

import { useT, useLocale } from "@/i18n/client";
import type { SpendingCategoryKey } from "@/i18n/messages/en";
import { PlotChart } from "./charts/plot";
import type { PlotData } from "plotly.js";

export type MonthlyBucket = {
  month: string; // YYYY-MM
  monthLabel: string;
  food: number;
  vet: number;
  toys: number;
  grooming: number;
  medicine: number;
  accessories: number;
  hygiene: number;
  other: number;
};

const CATEGORY_COLORS: Record<SpendingCategoryKey, string> = {
  vet: "#3b82f6",
  food: "#10b981",
  medicine: "#ef4444",
  grooming: "#14b8a6",
  toys: "#8b5cf6",
  accessories: "#ec4899",
  hygiene: "#06b6d4",
  other: "#78716C",
};

const STACK_ORDER: SpendingCategoryKey[] = [
  "vet",
  "food",
  "medicine",
  "grooming",
  "hygiene",
  "toys",
  "accessories",
  "other",
];

function formatBRL(value: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `R$ ${value.toFixed(0)}`;
  }
}

export function ExpensesChart({ monthly }: { monthly: MonthlyBucket[] }) {
  const t = useT();
  const locale = useLocale();

  const total = monthly.reduce(
    (sum, m) => sum + m.food + m.vet + m.toys + m.grooming + m.medicine + m.accessories + m.hygiene + m.other,
    0
  );

  if (total === 0) {
    return (
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-50">
          {t.dashboard.chartHeading}
        </h2>
        <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">{t.dashboard.chartSubtitle}</p>
        <p className="mt-6 rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500 dark:border-zinc-700 dark:text-zinc-400">
          {t.dashboard.chartEmpty}
        </p>
      </section>
    );
  }

  const x = monthly.map((m) => m.monthLabel);
  const traces: Partial<PlotData>[] = STACK_ORDER.map((cat) => ({
    type: "bar",
    name: t.spendingCategories[cat],
    x,
    y: monthly.map((m) => m[cat]),
    marker: { color: CATEGORY_COLORS[cat] },
    hovertemplate: `<b>%{x}</b><br>${t.spendingCategories[cat]}: %{y:,.0f}<extra></extra>`,
  }));

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-50">
          {t.dashboard.chartHeading}
        </h2>
        <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">{t.dashboard.chartSubtitle}</p>
      </header>
      <PlotChart
        data={traces}
        height={320}
        layoutOverride={{
          barmode: "stack",
          yaxis: { tickprefix: "R$ ", tickformat: ",.0f" },
        }}
      />
      <p className="sr-only">{formatBRL(total, locale)}</p>
    </section>
  );
}
