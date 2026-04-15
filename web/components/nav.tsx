import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { getDictionary } from "@/i18n/server";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { LocaleToggle } from "./locale-toggle";
import { TelegramIcon } from "./telegram-icon";
import { isCurrentUserAdmin } from "@/lib/admin";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getDictionary();
  const isAdmin = user ? await isCurrentUserAdmin() : false;

  return (
    <header className="sticky top-0 z-10 border-b border-stone-200/70 bg-white/80 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/80">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Brand href="/dashboard" />
          <div className="hidden items-center gap-1 text-sm sm:flex">
            <Link
              href="/dashboard"
              className="rounded-md px-3 py-1.5 text-stone-700 hover:bg-stone-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              {t.nav.dashboard}
            </Link>
            <Link
              href="/settings/telegram"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-stone-700 hover:bg-stone-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              <TelegramIcon className="h-4 w-4" />
              {t.nav.telegram}
            </Link>
            {isAdmin ? (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-amber-900 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-900/40"
              >
                Admin
              </Link>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleToggle />
          {user ? (
            <form action={signOut} className="ml-1 flex items-center gap-2">
              <span className="hidden text-xs text-stone-500 dark:text-zinc-400 md:inline">
                {user.email}
              </span>
              <button
                type="submit"
                className="rounded-md border border-stone-200 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                {t.nav.signOut}
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="ml-1 rounded-md border border-stone-200 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              {t.nav.signIn}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
