"use client";

import { useT, useLocale } from "@/i18n/client";
import { PlotChart } from "./charts/plot";
import type { PlotData } from "plotly.js";

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

  const traces: Partial<PlotData>[] = petNames.map((name, i) => {
    const x: string[] = [];
    const y: number[] = [];
    for (const row of series) {
      if (row[name] != null) {
        x.push(String(row.date));
        y.push(Number(row[name]));
      }
    }
    return {
      type: "scatter",
      mode: "lines+markers",
      name,
      x,
      y,
      line: { color: PALETTE[i % PALETTE.length], width: 2, shape: "spline", smoothing: 0.6 },
      marker: { size: 6, color: PALETTE[i % PALETTE.length] },
      hovertemplate: `<b>${name}</b><br>%{x}<br>%{y:.2f} ${t.pets.weightUnitShort}<extra></extra>`,
    };
  });

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-50">{heading}</h2>
        <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">{subtitle}</p>
      </header>
      <PlotChart
        data={traces}
        height={180}
        layoutOverride={{
          xaxis: {
            type: "date",
            tickformatstops: [
              { dtickrange: [null, 86400000 * 14], value: "%d %b" },
              { dtickrange: [86400000 * 14, "M3"], value: "%b %Y" },
              { dtickrange: ["M3", null], value: "%Y" },
            ],
          },
          yaxis: { ticksuffix: ` ${t.pets.weightUnitShort}` },
        }}
      />
      <p className="sr-only">{locale}</p>
    </section>
  );
}
