"use client";

import { useT, useLocale } from "@/i18n/client";
import { PlotChart } from "./charts/plot";
import type { PlotData } from "plotly.js";

export type DeltaWeight = {
  measured_at: string;
  weight_kg: number;
  pet_id: string;
  pet_name: string;
};

const PALETTE = [
  "#6366f1", "#ec4899", "#10b981", "#f59e0b",
  "#8b5cf6", "#14b8a6", "#f43f5e", "#3b82f6",
];

export function WeightDeltaChart({ weights }: { weights: DeltaWeight[] }) {
  const t = useT();
  const locale = useLocale();

  // Group by pet, sort by date, compute deltas between consecutive entries.
  const byPet = new Map<string, DeltaWeight[]>();
  for (const w of weights) {
    const list = byPet.get(w.pet_name) ?? [];
    list.push(w);
    byPet.set(w.pet_name, list);
  }

  const traces: Partial<PlotData>[] = [];
  let totalDeltaPoints = 0;
  let petIdx = 0;
  for (const [petName, list] of byPet.entries()) {
    list.sort((a, b) => a.measured_at.localeCompare(b.measured_at));
    const x: string[] = [];
    const y: number[] = [];
    for (let i = 1; i < list.length; i++) {
      const delta = Number((list[i].weight_kg - list[i - 1].weight_kg).toFixed(2));
      x.push(list[i].measured_at);
      y.push(delta);
    }
    if (y.length === 0) continue;
    totalDeltaPoints += y.length;
    traces.push({
      type: "bar",
      name: petName,
      x,
      y,
      marker: {
        color: y.map((v) => (v >= 0 ? PALETTE[petIdx % PALETTE.length] : "#ef4444")),
        opacity: 0.85,
      },
      hovertemplate: `<b>${petName}</b><br>%{x}<br>%{y:+.2f} ${t.dashboard.weightDeltaUnit}<extra></extra>`,
    });
    petIdx++;
  }

  if (totalDeltaPoints === 0) {
    return (
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-50">
          {t.dashboard.weightDeltaHeading}
        </h2>
        <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">
          {t.dashboard.weightDeltaSubtitle}
        </p>
        <p className="mt-6 rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500 dark:border-zinc-700 dark:text-zinc-400">
          {t.dashboard.weightDeltaEmpty}
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-stone-900 dark:text-zinc-50">
          {t.dashboard.weightDeltaHeading}
        </h2>
        <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">
          {t.dashboard.weightDeltaSubtitle}
        </p>
      </header>
      <PlotChart
        data={traces}
        height={220}
        layoutOverride={{
          barmode: "group",
          xaxis: { type: "date", tickformat: "%d %b %y" },
          yaxis: { ticksuffix: ` ${t.dashboard.weightDeltaUnit}`, zeroline: true },
        }}
      />
      <p className="sr-only">{locale}</p>
    </section>
  );
}
