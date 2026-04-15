import { redirect } from "next/navigation";
import { ResetForm } from "./reset-form";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/i18n/server";
import { Brand } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage() {
  // Reset only works if the user arrived via a valid recovery link
  // (which exchanged a code for a session in /auth/callback).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/forgot-password");

  const t = await getDictionary();

  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Brand href="/" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleToggle />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-12">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-zinc-50">
            {t.auth.resetTitle}
          </h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-zinc-400">
            {t.auth.resetSubtitle}
          </p>
          <div className="mt-6">
            <ResetForm />
          </div>
        </div>
      </main>
    </div>
  );
}
