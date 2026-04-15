import Link from "next/link";
import { adminDb } from "@/lib/admin";

export const dynamic = "force-dynamic";

type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  is_admin: boolean;
};

type PetCountRow = { user_id: string; count: number };

async function fetchUsers() {
  const db = adminDb();

  const { data: users } = await db
    .from("profiles")
    .select("id, email, full_name, created_at, is_admin")
    .order("created_at", { ascending: false })
    .limit(500);

  const userList = (users ?? []) as UserRow[];

  // Pet counts per user (single query).
  const { data: pets } = await db.from("pets").select("user_id");
  const petCount = new Map<string, number>();
  for (const p of (pets ?? []) as { user_id: string }[]) {
    petCount.set(p.user_id, (petCount.get(p.user_id) ?? 0) + 1);
  }

  return userList.map((u) => ({
    ...u,
    petCount: petCount.get(u.id) ?? 0,
  })) satisfies (UserRow & { petCount: number })[];
}

export default async function AdminUsers() {
  const users = await fetchUsers();

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-zinc-50">
          Users
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-zinc-400">
          {users.length} profile{users.length === 1 ? "" : "s"} — newest first, capped at 500.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase text-stone-500 dark:bg-zinc-950/50 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Pets</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200 dark:divide-zinc-800">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-zinc-800/50">
                <td className="px-4 py-3 font-medium text-stone-900 dark:text-zinc-100">
                  {u.email ?? "—"}
                  {u.is_admin ? (
                    <span className="ml-2 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                      admin
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-stone-700 dark:text-zinc-300">{u.full_name ?? "—"}</td>
                <td className="px-4 py-3 text-stone-700 dark:text-zinc-300">{u.petCount}</td>
                <td className="px-4 py-3 text-stone-500 dark:text-zinc-400">
                  {new Date(u.created_at).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="text-xs text-stone-700 underline hover:text-stone-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {users.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-stone-500 dark:text-zinc-400" colSpan={5}>
                  No users yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
