import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
              Admin area
            </p>
            <p className="mt-0.5 text-sm text-amber-900 dark:text-amber-200">
              Signed in as <span className="font-medium">{profile.email}</span>
            </p>
          </div>
          <nav className="flex gap-2 text-sm">
            <AdminLink href="/admin">Overview</AdminLink>
            <AdminLink href="/admin/users">Users</AdminLink>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}

function AdminLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md border border-amber-300 bg-white px-3 py-1.5 text-amber-900 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-zinc-900 dark:text-amber-200 dark:hover:bg-amber-950/40"
    >
      {children}
    </Link>
  );
}
