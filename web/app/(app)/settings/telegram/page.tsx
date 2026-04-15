import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConnectTelegramForm, UnlinkTelegramButton } from "./telegram-forms";
import { getDictionary } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function TelegramSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const t = await getDictionary();

  const { data: link } = await supabase
    .from("telegram_links")
    .select("id, chat_id, username, first_name, verified, linked_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-zinc-50">
          {t.telegram.title}
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-zinc-400">{t.telegram.subtitle}</p>
      </header>

      {link?.verified ? (
        <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-zinc-400">
              {t.telegram.linkedAccount}
            </p>
            <p className="mt-1 text-base font-semibold text-stone-900 dark:text-zinc-50">
              {link.username ? `@${link.username}` : (link.first_name ?? `Chat ${link.chat_id}`)}
            </p>
            <p className="mt-1 text-xs text-green-700 dark:text-green-400">
              {t.telegram.verified}
            </p>
          </div>
          <UnlinkTelegramButton />
        </div>
      ) : (
        <ConnectTelegramForm />
      )}
    </div>
  );
}
