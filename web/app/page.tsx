import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDictionary } from "@/i18n/server";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { TypingBanner } from "@/components/typing-banner";
import { LandingCarousel } from "@/components/landing-carousel";
import {
  LandingDashboardPreview,
  type ShowcasePet,
} from "@/components/landing-dashboard-preview";

const CAROUSEL_IMAGES = [
  "/carousel/20180610_113044.webp",
  "/carousel/20190907_115016.webp",
  "/carousel/IMG-20250521-WA0001.webp",
];

// Showcase user (Leo) whose real pets fill the landing dashboard preview.
const SHOWCASE_USER_ID =
  process.env.NEXT_PUBLIC_SHOWCASE_USER_ID ?? "f5a4a39f-46ce-4c0a-a9c7-61936368dcea";

async function rpcCount(name: string): Promise<number> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc(name);
    if (error || typeof data !== "number") return 0;
    return data;
  } catch {
    return 0;
  }
}

async function incrementAndGetVisits(): Promise<number> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("increment_landing_visit");
    if (error) return 0;
    return typeof data === "number" ? data : Number(data ?? 0);
  } catch {
    return 0;
  }
}

async function getShowcasePets(): Promise<ShowcasePet[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("pets")
      .select("name, species, photo_url, photo_zoom, sort_order")
      .eq("user_id", SHOWCASE_USER_ID)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(4);
    return (data ?? []).map((p) => ({
      name: p.name,
      species: p.species,
      photo_url: p.photo_url,
      photo_zoom: p.photo_zoom,
    }));
  } catch {
    return [];
  }
}

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const t = await getDictionary();
  const [showcasePets, userCount, petCount, recordsCount, visitsCount] = await Promise.all([
    getShowcasePets(),
    rpcCount("user_count"),
    rpcCount("pet_count"),
    rpcCount("records_count"),
    incrementAndGetVisits(),
  ]);

  const fmt = new Intl.NumberFormat("pt-BR");
  function labelFor(n: number, one: string, many: string): string {
    return (n === 1 ? one : many).replace("{n}", fmt.format(n));
  }
  const stats: { emoji: string; text: string }[] = [
    { emoji: "🐾", text: labelFor(userCount,   t.hero.userCountOne,   t.hero.userCountMany)   },
    { emoji: "🐶", text: labelFor(petCount,    t.hero.statPetsOne,    t.hero.statPetsMany)    },
    { emoji: "📋", text: labelFor(recordsCount, t.hero.statRecordsOne, t.hero.statRecordsMany) },
    { emoji: "👀", text: labelFor(visitsCount, t.hero.statVisitsOne,  t.hero.statVisitsMany)  },
  ].filter((s) => {
    // Always show visits (just incremented so ≥1); hide zero-value stats to avoid "0 pets".
    const n = Number(s.text.match(/[0-9]+/)?.[0] ?? "0");
    return n > 0;
  });

  const features = [
    { icon: "🐾", ...t.features.multiPet },
    { icon: "💉", ...t.features.vaccines },
    { icon: "💸", ...t.features.spending },
    { icon: "💬", ...t.features.whatsapp },
    { icon: "🔒", ...t.features.private },
    { icon: "⚡", ...t.features.free },
  ];

  return (
    <div className="flex min-h-screen flex-col text-stone-900 dark:text-zinc-100">
      <header className="sticky top-0 z-20 border-b border-stone-200/70 bg-white/70 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/80">
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
          <div className="mt-8">
            <TypingBanner prompt={t.hero.typingPrompt} ok={t.hero.typingOk} />
          </div>
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
          {stats.length > 0 ? (
            <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-amber-200 bg-amber-50/60 px-4 py-1.5 text-xs font-medium text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
              {stats.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1">
                  <span aria-hidden>{s.emoji}</span>
                  <span>{s.text}</span>
                  {i < stats.length - 1 ? (
                    <span aria-hidden className="ml-2 opacity-50">·</span>
                  ) : null}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <LandingDashboardPreview t={t} pets={showcasePets} />
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-20">
          <LandingCarousel images={CAROUSEL_IMAGES} alt={t.hero.carouselAlt} />
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
    </div>
  );
}
