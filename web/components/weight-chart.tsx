"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useT, useLocale } from "@/i18n/client";

export type WeightSeriesRow = {
  /** ISO date YYYY-MM-DD */
  date: string;
  /** Pet name → weight in kg for that date (sparse). */
  [petName: string]: string | number;
};

const PALETTE = [
  "#6366f1", "#ec4899", "#10b981", "#f59e0b",
  "#8b5cf6", "#14b8a6", "#f43f5e", "#3b82f6",
];

export function WeightChart({
  series,
  petNames,
  heading,
  subtitle,
  emptyText,
}: {
  series: WeightSeriesRow[];
  petNames: string[];
  heading: string;
  subtitle: string;
  emptyText: string;
}) {
  const t = useT();
  const locale = useLocale();

  if (series.length === 0 || petNames.length === 0) {
    return (
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-50">{heading}</h2>
        <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">{subtitle}</p>
        <p className="mt-6 rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500 dark:border-zinc-700 dark:text-zinc-400">
          {emptyText}
        </p>
      </section>
    );
  }

  const fmtDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(
        new Date(iso)
      );
    } catch {
      return iso;
    }
  };

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-50">{heading}</h2>
        <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">{subtitle}</p>
      </header>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#78716C" }}
              tickFormatter={fmtDate}
              axisLine={{ stroke: "#E7E5E4" }}
              tickLine={false}
              minTickGap={20}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#78716C" }}
              axisLine={false}
              tickLine={false}
              width={48}
              domain={["dataMin - 1", "dataMax + 1"]}
              allowDecimals
              tickFormatter={(v: number) => `${v} ${t.pets.weightUnitShort}`}
            />
            <Tooltip
              labelFormatter={(label) => fmtDate(String(label))}
              formatter={(v, name) => [
                `${typeof v === "number" ? v : Number(v)} ${t.pets.weightUnitShort}`,
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
            {petNames.map((name, i) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
