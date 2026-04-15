import { notFound } from "next/navigation";
import Link from "next/link";
import { adminDb } from "@/lib/admin";

export const dynamic = "force-dynamic";

function formatBRL(cents: number): string {
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
  } catch {
    return `R$ ${(cents / 100).toFixed(2)}`;
  }
}

type Pet = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  birthdate: string | null;
};

type Vaccine = {
  id: string;
  pet_id: string;
  name: string;
  given_date: string;
  next_date: string | null;
};

type Spending = {
  id: string;
  pet_id: string;
  amount_cents: number;
  currency: string;
  category: string;
  spent_at: string;
  description: string | null;
};

type Weight = {
  id: string;
  pet_id: string;
  weight_kg: number;
  measured_at: string;
};

export default async function AdminUserDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = adminDb();

  const { data: profile } = await db
    .from("profiles")
    .select("id, email, full_name, treatment, is_admin, created_at")
    .eq("id", id)
    .maybeSingle();
  if (!profile) notFound();

  const [petsRes, vaccinesRes, spendingsRes, weightsRes, telegramRes] = await Promise.all([
    db.from("pets").select("id, name, species, breed, birthdate").eq("user_id", id).order("created_at"),
    db.from("vaccines").select("id, pet_id, name, given_date, next_date"),
    db.from("spendings").select("id, pet_id, amount_cents, currency, category, spent_at, description"),
    db.from("pet_weights").select("id, pet_id, weight_kg, measured_at"),
    db.from("telegram_links").select("username, first_name, verified, chat_id, linked_at").eq("user_id", id).maybeSingle(),
  ]);

  const pets = (petsRes.data ?? []) as Pet[];
  const petIds = new Set(pets.map((p) => p.id));
  const vaccines = ((vaccinesRes.data ?? []) as Vaccine[]).filter((v) => petIds.has(v.pet_id));
  const spendings = ((spendingsRes.data ?? []) as Spending[]).filter((s) => petIds.has(s.pet_id));
  const weights = ((weightsRes.data ?? []) as Weight[]).filter((w) => petIds.has(w.pet_id));
  const tg = telegramRes.data;

  const totalCents = spendings.reduce((acc, s) => acc + (s.amount_cents ?? 0), 0);
  const petsById = new Map(pets.map((p) => [p.id, p.name]));

  return (
    <section className="space-y-6">
      <div>
        <Link href="/admin/users" className="text-xs text-stone-500 hover:underline dark:text-zinc-400">
          ← back to users
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900 dark:text-zinc-50">
          {profile.full_name ?? profile.email ?? profile.id}
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-zinc-400">
          {profile.email}
          {profile.is_admin ? (
            <span className="ml-2 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              admin
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 text-xs text-stone-500 dark:text-zinc-500">
          Joined {new Date(profile.created_at as string).toLocaleString("pt-BR")}
        </p>
        {tg ? (
          <p className="mt-1 text-xs text-stone-500 dark:text-zinc-500">
            Telegram: {tg.verified ? "✅" : "⏳"} {tg.username ? `@${tg.username}` : tg.first_name ?? tg.chat_id}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Pets" value={pets.length} />
        <StatTile label="Vaccines" value={vaccines.length} />
        <StatTile label="Spendings" value={spendings.length} />
        <StatTile label="Total spent" value={formatBRL(totalCents)} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-zinc-400">
          Pets
        </h2>
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase text-stone-500 dark:bg-zinc-950/50 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Species</th>
                <th className="px-4 py-2">Breed</th>
                <th className="px-4 py-2">Birthdate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 dark:divide-zinc-800">
              {pets.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2 font-medium text-stone-900 dark:text-zinc-100">{p.name}</td>
                  <td className="px-4 py-2 text-stone-700 dark:text-zinc-300">{p.species}</td>
                  <td className="px-4 py-2 text-stone-700 dark:text-zinc-300">{p.breed ?? "—"}</td>
                  <td className="px-4 py-2 text-stone-500 dark:text-zinc-400">{p.birthdate ?? "—"}</td>
                </tr>
              ))}
              {pets.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-center text-stone-500 dark:text-zinc-400" colSpan={4}>
                    No pets.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <RecordsTable
        title="Vaccines"
        columns={["Pet", "Vaccine", "Given", "Next"]}
        rows={vaccines.slice(0, 50).map((v) => [
          petsById.get(v.pet_id) ?? "—",
          v.name,
          v.given_date,
          v.next_date ?? "—",
        ])}
      />

      <RecordsTable
        title="Spendings"
        columns={["Pet", "Amount", "Category", "Date", "Description"]}
        rows={spendings
          .sort((a, b) => (a.spent_at < b.spent_at ? 1 : -1))
          .slice(0, 50)
          .map((s) => [
            petsById.get(s.pet_id) ?? "—",
            formatBRL(s.amount_cents),
            s.category,
            s.spent_at,
            s.description ?? "—",
          ])}
      />

      <RecordsTable
        title="Weights"
        columns={["Pet", "kg", "Measured"]}
        rows={weights
          .sort((a, b) => (a.measured_at < b.measured_at ? 1 : -1))
          .slice(0, 50)
          .map((w) => [
            petsById.get(w.pet_id) ?? "—",
            String(w.weight_kg),
            w.measured_at,
          ])}
      />
    </section>
  );
}

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-stone-900 dark:text-zinc-50">
        {typeof value === "number" ? value.toLocaleString("pt-BR") : value}
      </p>
    </div>
  );
}

function RecordsTable({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500 dark:text-zinc-400">
        {title}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase text-stone-500 dark:bg-zinc-950/50 dark:text-zinc-400">
            <tr>
              {columns.map((c) => (
                <th key={c} className="px-4 py-2">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-zinc-800">
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((cell, j) => (
                  <td key={j} className="px-4 py-2 text-stone-700 dark:text-zinc-300">
                    {String(cell)}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-4 text-center text-stone-500 dark:text-zinc-400"
                  colSpan={columns.length}
                >
                  Empty.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
