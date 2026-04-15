import Link from "next/link";
import { getDictionary } from "@/i18n/server";

export const LAST_UPDATE = "2026-04-15";

export async function Footer() {
  const t = await getDictionary();
  return (
    <footer className="mt-auto border-t border-stone-200 bg-stone-50/80 py-8 text-xs text-stone-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-2 sm:px-6 md:grid-cols-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:text-zinc-500">
            {t.footer.developedBy}
          </p>
          <p className="mt-1 font-medium text-stone-900 dark:text-zinc-100">Leonardo Chalhoub</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:text-zinc-500">
            {t.footer.email}
          </p>
          <a
            href="mailto:leochalhoub@hotmail.com"
            className="mt-1 inline-block hover:text-stone-900 dark:hover:text-zinc-100"
          >
            leochalhoub@hotmail.com
          </a>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:text-zinc-500">
            {t.footer.links}
          </p>
          <div className="mt-1 flex flex-col gap-0.5">
            <Link
              href="https://linkedin.com/in/leonardochalhoub"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-stone-900 dark:hover:text-zinc-100"
            >
              LinkedIn
            </Link>
            <Link
              href="https://github.com/leonardochalhoub/PetZap"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-stone-900 dark:hover:text-zinc-100"
            >
              GitHub
            </Link>
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:text-zinc-500">
            {t.footer.lastUpdate}
          </p>
          <p className="mt-1 tabular-nums">{LAST_UPDATE}</p>
        </div>
      </div>
    </footer>
  );
}
