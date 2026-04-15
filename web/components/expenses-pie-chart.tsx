"use client";

import { useT } from "@/i18n/client";
import type { SpendingCategoryKey } from "@/i18n/messages/en";
import { PlotChart } from "./charts/plot";
import type { PlotData } from "plotly.js";

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

const ORDER: SpendingCategoryKey[] = [
  "vet",
  "food",
  "medicine",
  "grooming",
  "hygiene",
  "toys",
  "accessories",
  "other",
];

export function ExpensesPieChart({
  spendings,
}: {
  spendings: { amount_cents: number; category: string }[];
}) {
  const t = useT();

  const totals: Record<SpendingCategoryKey, number> = {
    vet: 0, food: 0, medicine: 0, grooming: 0, toys: 0, accessories: 0, hygiene: 0, other: 0,
  };
  let grandTotal = 0;
  for (const s of spendings) {
    const cat = (ORDER as readonly string[]).includes(s.category)
      ? (s.category as SpendingCategoryKey)
      : "other";
    totals[cat] += s.amount_cents / 100;
    grandTotal += s.amount_cents / 100;
  }

  if (grandTotal === 0) {
    return (
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-50">
          {t.dashboard.pieHeading}
        </h2>
        <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">{t.dashboard.pieSubtitle}</p>
        <p className="mt-6 rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500 dark:border-zinc-700 dark:text-zinc-400">
          {t.dashboard.pieEmpty}
        </p>
      </section>
    );
  }

  const visible = ORDER.filter((c) => totals[c] > 0);

  const trace: Partial<PlotData> = {
    type: "pie",
    hole: 0.55,
    labels: visible.map((c) => t.spendingCategories[c]),
    values: visible.map((c) => totals[c]),
    marker: { colors: visible.map((c) => CATEGORY_COLORS[c]), line: { color: "rgba(0,0,0,0)", width: 0 } },
    textposition: "outside",
    textinfo: "label+percent",
    hovertemplate: `<b>%{label}</b><br>R$ %{value:,.2f}<br>%{percent}<extra></extra>`,
    automargin: true,
  };

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-50">
          {t.dashboard.pieHeading}
        </h2>
        <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">{t.dashboard.pieSubtitle}</p>
      </header>
      <PlotChart
        data={[trace]}
        height={320}
        layoutOverride={{
          showlegend: false,
          margin: { l: 16, r: 16, t: 8, b: 16 },
        }}
      />
    </section>
  );
}
