"use client";

import type { Messages, SpendingCategoryKey } from "@/i18n/messages/en";

export type SpendingKpis = {
  thisMonthCents: number;
  last6Cents: number;
  projected6Cents: number;
  txCount: number;
  avgPerTxCents: number;
  topCategory: string | null;
  topCategoryCents: number;
};

export type KpiGridProps = {
  t: Messages;
  petCount: number;
  upcomingCount: number;
  recentCount: number;
  spending: SpendingKpis;
  fmtBRL: (cents: number) => string;
};

/**
 * 8 colored KPI cards rendered as a 2×4 grid.
 * Extracted from the dashboard-client to keep that file focused on state
 * + orchestration. All values + formatters are passed in — zero data fetching here.
 */
export function KpiGrid({ t, petCount, upcomingCount, recentCount, spending, fmtBRL }: KpiGridProps) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {/* Pets — indigo */}
      <Card color="indigo" label={t.dashboard.kpiPets} value={String(petCount)} />
      {/* Vacinas próximas (30d) — rose */}
      <Card color="rose" label={t.dashboard.statsUpcoming} value={String(upcomingCount)} />
      {/* Transactions — purple */}
      <Card
        color="purple"
        label={t.dashboard.kpiTransactions}
        value={String(spending.txCount)}
        hint={`${t.dashboard.statsRecent}: ${recentCount}`}
      />
      {/* Avg per transaction — teal */}
      <Card color="teal" label={t.dashboard.kpiAvgPerTransaction} value={fmtBRL(spending.avgPerTxCents)} />
      {/* This month — emerald */}
      <Card color="emerald" label={t.dashboard.kpiThisMonth} value={fmtBRL(spending.thisMonthCents)} />
      {/* Last 6 months — blue */}
      <Card color="blue" label={t.dashboard.kpiLast6Months} value={fmtBRL(spending.last6Cents)} />
      {/* Projected 6 months — amber */}
      <Card
        color="amber"
        label={t.dashboard.kpiProjected6Months}
        value={fmtBRL(spending.projected6Cents)}
        hint={t.dashboard.kpiProjectedHint}
      />
      {/* Top category — fuchsia */}
      <Card
        color="fuchsia"
        label={t.dashboard.kpiTopCategory}
        value={
          spending.topCategory
            ? t.spendingCategories[spending.topCategory as SpendingCategoryKey] ?? spending.topCategory
            : t.dashboard.kpiNone
        }
        valueClassName="truncate text-lg"
        hint={spending.topCategory ? fmtBRL(spending.topCategoryCents) : undefined}
      />
    </section>
  );
}

type Color = "indigo" | "rose" | "purple" | "teal" | "emerald" | "blue" | "amber" | "fuchsia";

const TONES: Record<Color, { border: string; bg: string; label: string; value: string }> = {
  indigo:  { border: "border-indigo-200 dark:border-indigo-900/40",   bg: "bg-indigo-50/60 dark:bg-indigo-950/20",   label: "text-indigo-700/80 dark:text-indigo-300/80",   value: "text-indigo-700 dark:text-indigo-300" },
  rose:    { border: "border-rose-200 dark:border-rose-900/40",       bg: "bg-rose-50/60 dark:bg-rose-950/20",       label: "text-rose-700/80 dark:text-rose-300/80",       value: "text-rose-700 dark:text-rose-300" },
  purple:  { border: "border-purple-200 dark:border-purple-900/40",   bg: "bg-purple-50/60 dark:bg-purple-950/20",   label: "text-purple-700/80 dark:text-purple-300/80",   value: "text-purple-700 dark:text-purple-300" },
  teal:    { border: "border-teal-200 dark:border-teal-900/40",       bg: "bg-teal-50/60 dark:bg-teal-950/20",       label: "text-teal-700/80 dark:text-teal-300/80",       value: "text-teal-700 dark:text-teal-300" },
  emerald: { border: "border-emerald-200 dark:border-emerald-900/40", bg: "bg-emerald-50/60 dark:bg-emerald-950/20", label: "text-emerald-700/80 dark:text-emerald-300/80", value: "text-emerald-700 dark:text-emerald-300" },
  blue:    { border: "border-blue-200 dark:border-blue-900/40",       bg: "bg-blue-50/60 dark:bg-blue-950/20",       label: "text-blue-700/80 dark:text-blue-300/80",       value: "text-blue-700 dark:text-blue-300" },
  amber:   { border: "border-amber-200 dark:border-amber-900/40",     bg: "bg-amber-50/60 dark:bg-amber-950/20",     label: "text-amber-700/80 dark:text-amber-300/80",     value: "text-amber-700 dark:text-amber-300" },
  fuchsia: { border: "border-fuchsia-200 dark:border-fuchsia-900/40", bg: "bg-fuchsia-50/60 dark:bg-fuchsia-950/20", label: "text-fuchsia-700/80 dark:text-fuchsia-300/80", value: "text-fuchsia-700 dark:text-fuchsia-300" },
};

function Card({
  color,
  label,
  value,
  valueClassName,
  hint,
}: {
  color: Color;
  label: string;
  value: string;
  valueClassName?: string;
  hint?: string;
}) {
  const t = TONES[color];
  return (
    <div className={`rounded-2xl border ${t.border} ${t.bg} p-4 shadow-sm`}>
      <p className={`text-[11px] font-semibold uppercase tracking-wide ${t.label}`}>{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${t.value} ${valueClassName ?? ""}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-stone-500 dark:text-zinc-500">{hint}</p> : null}
    </div>
  );
}
