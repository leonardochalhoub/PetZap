import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/i18n/server";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const t = await getDictionary();

  const features = [
    { icon: "🐾", ...t.features.multiPet },
    { icon: "💉", ...t.features.vaccines },
    { icon: "💸", ...t.features.spending },
    { icon: "💬", ...t.features.whatsapp },
    { icon: "🔒", ...t.features.private },
    { icon: "⚡", ...t.features.free },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-stone-100 text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="sticky top-0 z-20 border-b border-stone-200/70 bg-white/80 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Brand />
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <LocaleToggle />
            <Link
              href="/login"
              className="hidden rounded-md px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-100 sm:inline-block dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              {t.nav.signIn}
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              {t.nav.getStarted}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center sm:py-24">
          <span className="inline-flex items-center rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            {t.hero.eyebrow}
          </span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight text-stone-900 sm:text-6xl dark:text-zinc-50">
            {t.hero.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-stone-600 sm:text-xl dark:text-zinc-400">
            {t.hero.subtitle}
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              {t.hero.ctaPrimary}
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-stone-200 bg-white px-6 py-3 text-sm font-semibold text-stone-900 transition-colors hover:bg-stone-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              {t.hero.ctaSecondary}
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <h2 className="sr-only">{t.features.heading}</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-stone-200 bg-white p-6 shadow transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="text-3xl" aria-hidden>
                  {f.icon}
                </div>
                <h3 className="mt-4 text-base font-semibold text-stone-900 dark:text-zinc-50">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm text-stone-600 dark:text-zinc-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="rounded-3xl bg-gradient-to-br from-amber-400 via-rose-400 to-rose-500 px-8 py-16 text-center text-white shadow-lg sm:px-16 sm:py-20">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.closing.title}</h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/90 sm:text-lg">
              {t.closing.subtitle}
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-stone-900 transition-colors hover:bg-stone-100"
            >
              {t.closing.cta}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-500 dark:border-zinc-800 dark:text-zinc-500">
        &copy; {t.footer.copy}
      </footer>
    </div>
  );
}
