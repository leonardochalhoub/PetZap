import { adminDb } from "@/lib/admin";

export const dynamic = "force-dynamic";

function formatBRL(cents: number): string {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  } catch {
    return `R$ ${(cents / 100).toFixed(2)}`;
  }
}

async function fetchStats() {
  const db = adminDb();
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    usersTotal,
    usersLast7,
    usersLast30,
    petsTotal,
    vaccinesTotal,
    spendingsTotal,
    spendingsSum,
    weightsTotal,
    telegramLinks,
  ] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
    db.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
    db.from("pets").select("id", { count: "exact", head: true }),
    db.from("vaccines").select("id", { count: "exact", head: true }),
    db.from("spendings").select("id", { count: "exact", head: true }),
    db.from("spendings").select("amount_cents"),
    db.from("pet_weights").select("id", { count: "exact", head: true }),
    db.from("telegram_links").select("id", { count: "exact", head: true }).eq("verified", true),
  ]);

  const totalCents = (spendingsSum.data ?? []).reduce(
    (acc, row: { amount_cents: number }) => acc + (row.amount_cents ?? 0),
    0,
  );

  return {
    users: usersTotal.count ?? 0,
    usersLast7: usersLast7.count ?? 0,
    usersLast30: usersLast30.count ?? 0,
    pets: petsTotal.count ?? 0,
    vaccines: vaccinesTotal.count ?? 0,
    spendings: spendingsTotal.count ?? 0,
    spendingsTotalCents: totalCents,
    weights: weightsTotal.count ?? 0,
    telegramLinks: telegramLinks.count ?? 0,
  };
}

export default async function AdminOverview() {
  const s = await fetchStats();

  const cards: { label: string; value: string; hint?: string }[] = [
    { label: "Total users", value: s.users.toLocaleString("pt-BR") },
    { label: "Signups — last 7d", value: s.usersLast7.toLocaleString("pt-BR") },
    { label: "Signups — last 30d", value: s.usersLast30.toLocaleString("pt-BR") },
    { label: "Pets", value: s.pets.toLocaleString("pt-BR") },
    { label: "Vaccines recorded", value: s.vaccines.toLocaleString("pt-BR") },
    { label: "Spending entries", value: s.spendings.toLocaleString("pt-BR") },
    { label: "Total spending logged", value: formatBRL(s.spendingsTotalCents) },
    { label: "Weight readings", value: s.weights.toLocaleString("pt-BR") },
    { label: "Verified Telegram links", value: s.telegramLinks.toLocaleString("pt-BR") },
  ];

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-zinc-50">
          Overview
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-zinc-400">
          Macro stats across every account. Read-only.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-zinc-400">
              {c.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-stone-900 dark:text-zinc-50">
              {c.value}
            </p>
            {c.hint ? (
              <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-500">{c.hint}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
