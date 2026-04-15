"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useT } from "@/i18n/client";

export type UpcomingAlert = {
  kind: "vaccine" | "medication";
  petId: string;
  petName: string;
  itemName: string;
  dueDate: string; // YYYY-MM-DD
  daysUntil: number;
};

const STORAGE_KEY = "petzap:alerts-dismissed";

// Stable signature: same alert instance across reloads.
function alertSignature(a: UpcomingAlert): string {
  return `${a.kind}|${a.petId}|${a.dueDate}|${a.itemName}`;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadDismissed(): Record<string, string> {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return {};
    const m = JSON.parse(raw) as Record<string, string>;
    const today = todayIso();
    // Garbage collect entries whose dueDate (3rd field) has passed.
    const cleaned: Record<string, string> = {};
    for (const [sig, when] of Object.entries(m)) {
      const dueDate = sig.split("|")[2];
      if (dueDate && dueDate >= today) cleaned[sig] = when;
    }
    return cleaned;
  } catch {
    return {};
  }
}

function saveDismissed(m: Record<string, string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(m));
  } catch {}
}

export function UpcomingAlerts({ alerts }: { alerts: UpcomingAlert[] }) {
  const t = useT();
  const [dismissed, setDismissed] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDismissed(loadDismissed());
    setHydrated(true);
  }, []);

  const visible = useMemo(
    () => (hydrated ? alerts.filter((a) => !(alertSignature(a) in dismissed)) : []),
    [alerts, dismissed, hydrated]
  );

  if (!hydrated || visible.length === 0) return null;

  function dismissOne(a: UpcomingAlert) {
    setDismissed((prev) => {
      const next = { ...prev, [alertSignature(a)]: new Date().toISOString() };
      saveDismissed(next);
      return next;
    });
  }

  function dismissAll() {
    setDismissed((prev) => {
      const next = { ...prev };
      const now = new Date().toISOString();
      for (const a of visible) next[alertSignature(a)] = now;
      saveDismissed(next);
      return next;
    });
  }

  function relativeDays(n: number): string {
    if (n <= 0) return t.dashboard.alertsTodayWord;
    if (n === 1) return t.dashboard.alertsTomorrow;
    return t.dashboard.alertsInDays.replace("{n}", String(n));
  }

  function urgencyClasses(d: number): { dot: string; bg: string; border: string } {
    if (d <= 3) {
      return { dot: "bg-rose-500", bg: "bg-rose-50/60 dark:bg-rose-950/30", border: "border-rose-200 dark:border-rose-900/40" };
    }
    if (d <= 7) {
      return { dot: "bg-amber-500", bg: "bg-amber-50/60 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-900/40" };
    }
    return { dot: "bg-stone-400", bg: "bg-white dark:bg-zinc-900", border: "border-stone-200 dark:border-zinc-800" };
  }

  return (
    <div
      role="dialog"
      aria-label={t.dashboard.alertsTitle}
      className="fixed right-4 top-20 z-50 w-96 max-w-[calc(100vw-2rem)] origin-top-right animate-[fadeInUp_0.25s_ease-out] rounded-2xl border border-stone-200 bg-white shadow-2xl ring-1 ring-amber-500/10 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <header className="flex items-start justify-between gap-3 border-b border-stone-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
          </span>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-zinc-50">
            {t.dashboard.alertsTitle}
          </h3>
          <span className="text-xs text-stone-500 dark:text-zinc-400">· {visible.length}</span>
        </div>
        <button
          type="button"
          onClick={dismissAll}
          aria-label={t.dashboard.alertsDismiss}
          className="-m-1 rounded-md p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>
      <ul className="max-h-[60vh] divide-y divide-stone-100 overflow-y-auto dark:divide-zinc-800">
        {visible.map((a) => {
          const u = urgencyClasses(a.daysUntil);
          const kindLabel = a.kind === "vaccine" ? t.dashboard.alertsKindVaccine : t.dashboard.alertsKindMedication;
          return (
            <li key={alertSignature(a)} className={`flex items-start gap-3 border-l-4 px-4 py-3 ${u.border} ${u.bg}`}>
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${u.dot}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-stone-900 dark:text-zinc-50">
                  {a.itemName}
                  <span className="ml-1 text-xs font-normal text-stone-500 dark:text-zinc-400">
                    · {kindLabel}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-stone-600 dark:text-zinc-400">
                  <span className="font-medium text-stone-700 dark:text-zinc-300">{a.petName}</span>
                  <span className="mx-1">·</span>
                  {relativeDays(a.daysUntil)}
                  <span className="ml-1 text-stone-400 dark:text-zinc-500">({a.dueDate})</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 self-center">
                <Link
                  href={`/pets/${a.petId}`}
                  className="rounded-md border border-stone-300 px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-white hover:text-stone-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                >
                  {t.dashboard.alertsViewPet}
                </Link>
                <button
                  type="button"
                  onClick={() => dismissOne(a)}
                  aria-label={t.dashboard.alertsDismiss}
                  title={t.dashboard.alertsDismiss}
                  className="rounded-md p-1 text-stone-500 hover:bg-stone-200/60 hover:text-stone-900 dark:hover:bg-zinc-700 dark:hover:text-zinc-50"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="border-t border-stone-200 px-4 py-2 text-right dark:border-zinc-800">
        <button
          type="button"
          onClick={dismissAll}
          className="text-xs text-stone-500 hover:text-stone-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          {t.dashboard.alertsDismiss}
        </button>
      </div>
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
