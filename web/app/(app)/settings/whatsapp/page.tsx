import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkPhoneForm, VerifyOtpForm, UnlinkPhoneButton } from "./whatsapp-forms";
import { getDictionary } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function WhatsappSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const t = await getDictionary();

  const { data: link } = await supabase
    .from("whatsapp_links")
    .select("id, phone, verified, otp_expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-zinc-50">
          {t.whatsapp.title}
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-zinc-400">{t.whatsapp.subtitle}</p>
      </header>

      {!link ? (
        <LinkPhoneForm />
      ) : link.verified ? (
        <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-zinc-400">
              {t.whatsapp.linkedPhone}
            </p>
            <p className="mt-1 text-base font-semibold text-stone-900 dark:text-zinc-50">
              {link.phone}
            </p>
            <p className="mt-1 text-xs text-green-700 dark:text-green-400">{t.whatsapp.verified}</p>
          </div>
          <UnlinkPhoneButton />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-zinc-400">
              {t.whatsapp.pending}
            </p>
            <p className="mt-1 text-base font-semibold text-stone-900 dark:text-zinc-50">
              {link.phone}
            </p>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              {t.whatsapp.notVerifiedYet}
            </p>
            {link.otp_expires_at ? (
              <p className="mt-1 text-xs text-stone-500 dark:text-zinc-400">
                {t.whatsapp.codeExpiresAt}{" "}
                {new Date(link.otp_expires_at).toLocaleTimeString()}
              </p>
            ) : null}
            <p className="mt-3 text-xs text-stone-600 dark:text-zinc-400">
              {t.whatsapp.prototypeHint}
            </p>
          </div>
          <VerifyOtpForm />
          <UnlinkPhoneButton />
        </div>
      )}
    </div>
  );
}
