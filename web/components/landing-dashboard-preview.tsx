/**
 * Marketing-grade preview of the dashboard for the landing page.
 * Pure presentational — pets are fetched server-side and passed in.
 */
import { PugLogo } from "./pug-logo";
import type { Messages } from "@/i18n/messages/en";

export type ShowcasePet = {
  name: string;
  species: string;
  photo_url: string | null;
  photo_zoom?: number | null;
};

const SPECIES_EMOJI: Record<string, string> = {
  dog: "🐶", cat: "🐱", bird: "🐦", rabbit: "🐰", other: "🐾",
};

const TONES = [
  "from-amber-200 to-rose-200",
  "from-indigo-200 to-pink-200",
  "from-emerald-200 to-teal-200",
  "from-violet-200 to-fuchsia-200",
];

const MOCK_BARS = [
  { v: 20, c: "#3b82f6" },
  { v: 35, c: "#10b981" },
  { v: 18, c: "#f59e0b" },
  { v: 42, c: "#8b5cf6" },
  { v: 28, c: "#06b6d4" },
  { v: 50, c: "#3b82f6" },
  { v: 30, c: "#10b981" },
  { v: 45, c: "#ec4899" },
  { v: 55, c: "#3b82f6" },
  { v: 38, c: "#14b8a6" },
  { v: 25, c: "#f59e0b" },
  { v: 60, c: "#8b5cf6" },
];

export function LandingDashboardPreview({
  t,
  pets,
}: {
  t: Messages;
  pets: ShowcasePet[];
}) {
  const visiblePets = pets.slice(0, 4);
  return (
    <div className="relative mx-auto max-w-5xl">
      {/* Soft glow underneath */}
      <div
        aria-hidden
        className="absolute inset-x-8 -bottom-6 -z-10 h-32 rounded-full bg-gradient-to-r from-amber-200/40 via-rose-200/40 to-indigo-200/40 blur-3xl dark:from-amber-500/10 dark:via-rose-500/10 dark:to-indigo-500/10"
      />

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl ring-1 ring-stone-900/5 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-white/5">
        {/* Window chrome — title bar style, no URL */}
        <div className="grid grid-cols-3 items-center border-b border-stone-200 bg-stone-50 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/80" aria-hidden />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" aria-hidden />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" aria-hidden />
          </div>
          <div className="inline-flex items-center justify-center gap-2 text-xs font-medium text-stone-600 dark:text-zinc-400">
            <PugLogo className="h-4 w-4" />
            <span>PetZap · {t.dashboard.title}</span>
          </div>
          <span aria-hidden />
        </div>

        {/* Inner dashboard */}
        <div className="space-y-5 bg-[#EFEAE0] p-6 dark:bg-zinc-950/40">
          {/* Greeting */}
          <header className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-stone-900 dark:text-zinc-50">
                {t.dashboard.welcomeBack.male} Leo
                <span className="text-amber-500"> !</span>
              </h3>
              <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-400">{t.dashboard.title}</p>
            </div>
            <div className="hidden gap-2 sm:flex">
              <span className="rounded-md border border-stone-300 bg-white px-3 py-1 text-xs font-medium text-stone-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                {t.dashboard.addSpending}
              </span>
              <span className="rounded-md bg-stone-900 px-3 py-1 text-xs font-medium text-white shadow-sm dark:bg-white dark:text-zinc-900">
                {t.dashboard.addPet}
              </span>
            </div>
          </header>

          {/* KPIs (4 visible) */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <KpiBox color="rose"     label={t.dashboard.statsUpcoming}        value="2" />
            <KpiBox color="emerald"  label={t.dashboard.kpiThisMonth}         value="R$ 312" />
            <KpiBox color="blue"     label={t.dashboard.kpiLast6Months}       value="R$ 1.984" />
            <KpiBox color="amber"    label={t.dashboard.kpiProjected6Months}  value="R$ 2.150" />
          </div>

          {/* Pets row */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-zinc-400">
                {t.pets.listTitle}{" "}
                <span className="text-stone-400 dark:text-zinc-600">· {visiblePets.length}</span>
              </h4>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {visiblePets.map((p, i) => {
                const zoom = p.photo_zoom ?? 1;
                return (
                  <div key={`${p.name}-${i}`} className="flex w-20 flex-col items-center gap-1.5">
                    <div
                      className={`flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-stone-200 shadow-sm dark:border-zinc-800 ${
                        p.photo_url ? "bg-stone-100 dark:bg-zinc-800" : `bg-gradient-to-br ${TONES[i % TONES.length]}`
                      }`}
                    >
                      {p.photo_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={p.photo_url}
                          alt={p.name}
                          className="h-full w-full object-cover"
                          style={zoom !== 1 ? { transform: `scale(${zoom})` } : undefined}
                        />
                      ) : (
                        <span className="text-3xl">{SPECIES_EMOJI[p.species] ?? "🐾"}</span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-stone-700 dark:text-zinc-300">{p.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mini chart */}
          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="mb-2 text-xs font-medium text-stone-600 dark:text-zinc-400">
              {t.dashboard.chartHeading}
            </p>
            <div className="flex h-20 items-end gap-1.5">
              {MOCK_BARS.map((b, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${b.v + 30}%`,
                    background: `linear-gradient(to top, ${b.c}66, ${b.c})`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiBox({
  color,
  label,
  value,
}: {
  color: "rose" | "emerald" | "blue" | "amber";
  label: string;
  value: string;
}) {
  const tone: Record<string, { bg: string; border: string; text: string }> = {
    rose:    { bg: "bg-rose-50/70 dark:bg-rose-950/30",       border: "border-rose-200 dark:border-rose-900/40",       text: "text-rose-700 dark:text-rose-300" },
    emerald: { bg: "bg-emerald-50/70 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300" },
    blue:    { bg: "bg-blue-50/70 dark:bg-blue-950/30",       border: "border-blue-200 dark:border-blue-900/40",       text: "text-blue-700 dark:text-blue-300" },
    amber:   { bg: "bg-amber-50/70 dark:bg-amber-950/30",     border: "border-amber-200 dark:border-amber-900/40",     text: "text-amber-700 dark:text-amber-300" },
  };
  const c = tone[color];
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-2.5 shadow-sm`}>
      <p className={`text-[9px] font-semibold uppercase tracking-wide opacity-80 ${c.text}`}>{label}</p>
      <p className={`mt-0.5 text-lg font-semibold ${c.text}`}>{value}</p>
    </div>
  );
}
