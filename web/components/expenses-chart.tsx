"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useT, useLocale } from "@/i18n/client";
import type { SpendingCategoryKey } from "@/i18n/messages/en";

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
    (sum, m) =>
      sum +
      m.food + m.vet + m.toys + m.grooming + m.medicine + m.accessories + m.other,
    0
  );

  if (total === 0) {
    return (
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-50">
          {t.dashboard.chartHeading}
        </h2>
        <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">
          {t.dashboard.chartSubtitle}
        </p>
        <p className="mt-6 rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500 dark:border-zinc-700 dark:text-zinc-400">
          {t.dashboard.chartEmpty}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-50">
          {t.dashboard.chartHeading}
        </h2>
        <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">
          {t.dashboard.chartSubtitle}
        </p>
      </header>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthly} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
            <XAxis
              dataKey="monthLabel"
              tick={{ fontSize: 12, fill: "#78716C" }}
              axisLine={{ stroke: "#E7E5E4" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#78716C" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => formatBRL(v, locale)}
              width={70}
            />
            <Tooltip
              formatter={(v, name) => [
                formatBRL(typeof v === "number" ? v : Number(v) || 0, locale),
                String(name),
              ]}
              contentStyle={{
                background: "rgba(255,255,255,0.95)",
                border: "1px solid #E7E5E4",
                borderRadius: "0.5rem",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#1C1917", fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: 8 }} />
            {STACK_ORDER.map((cat) => (
              <Bar
                key={cat}
                dataKey={cat}
                name={t.spendingCategories[cat]}
                stackId="spending"
                fill={CATEGORY_COLORS[cat]}
                radius={[0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
