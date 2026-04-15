/**
 * Daily reminder cron — finds vaccines + recurring medications due in
 * 7 ± 1 day or 14 ± 1 day, sends emails (idempotent via reminders_sent).
 *
 * Auth: Bearer CRON_SECRET. Vercel Cron sends this header automatically when
 * `vercel.json` is configured. For local testing:
 *
 *   curl -X POST -H "Authorization: Bearer petzap-cron-2026-changeme" \
 *        http://localhost:3000/api/cron/reminders
 */
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderReminderHtml, renderReminderSubject } from "@/lib/email/reminder";
import { sendEmail } from "@/lib/email/send";
import { clientKey, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { log } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WeeksBefore = 1 | 2;

type EventRow = {
  kind: "vaccine" | "medication";
  event_id: string;
  due_date: string;
  pet_name: string;
  pet_id: string;
  user_id: string;
  item_name: string;
};

function isoDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function POST(req: NextRequest) {
  // Rate limit first — before any work. 30 calls/hr per IP is way more than
  // Vercel's single daily cron needs and still stops abuse.
  const rl = await rateLimit({
    bucket: "cron_reminders",
    key: clientKey(req),
    windowSeconds: 3600,
    limit: 30,
  });
  if (!rl.allowed) {
    log.warn("cron.rate_limited", { key: clientKey(req), current: rl.current });
    return rateLimitResponse(rl);
  }

  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // 7 ± 1 day window  (so we catch the event whether cron runs slightly early/late)
  // 14 ± 1 day window
  const windows: { weeks: WeeksBefore; from: string; to: string }[] = [
    { weeks: 1, from: isoDateOffset(6), to: isoDateOffset(8) },
    { weeks: 2, from: isoDateOffset(13), to: isoDateOffset(15) },
  ];

  type ResultRow = { kind: string; event_id: string; weeks: number; status: string; detail?: string };
  const results: ResultRow[] = [];

  for (const w of windows) {
    // Vaccines
    const { data: vaccines } = await supabase
      .from("vaccines")
      .select("id, name, next_date, pets!inner(id, name, user_id)")
      .gte("next_date", w.from)
      .lte("next_date", w.to)
      .returns<{ id: string; name: string; next_date: string; pets: { id: string; name: string; user_id: string } | null }[]>();

    for (const v of vaccines ?? []) {
      if (!v.pets) continue;
      results.push(...(await processReminder(
        supabase,
        siteUrl,
        {
          kind: "vaccine",
          event_id: v.id,
          due_date: v.next_date,
          pet_name: v.pets.name,
          pet_id: v.pets.id,
          user_id: v.pets.user_id,
          item_name: v.name,
        },
        w.weeks
      )));
    }

    // Medications (spendings.next_due, category=medicine)
    const { data: meds } = await supabase
      .from("spendings")
      .select("id, description, next_due, pets!inner(id, name, user_id)")
      .eq("category", "medicine")
      .gte("next_due", w.from)
      .lte("next_due", w.to)
      .returns<{ id: string; description: string | null; next_due: string; pets: { id: string; name: string; user_id: string } | null }[]>();

    for (const m of meds ?? []) {
      if (!m.pets) continue;
      results.push(...(await processReminder(
        supabase,
        siteUrl,
        {
          kind: "medication",
          event_id: m.id,
          due_date: m.next_due,
          pet_name: m.pets.name,
          pet_id: m.pets.id,
          user_id: m.pets.user_id,
          item_name: m.description ?? "Medicamento",
        },
        w.weeks
      )));
    }
  }

  const summary = {
    total: results.length,
    sent: results.filter((r) => r.status === "sent").length,
    skipped_already_sent: results.filter((r) => r.status === "skipped").length,
    failed: results.filter((r) => r.status === "failed").length,
    no_email: results.filter((r) => r.status === "no_email").length,
    results,
  };
  return NextResponse.json(summary);
}

async function processReminder(
  supabase: ReturnType<typeof createAdminClient>,
  siteUrl: string,
  ev: EventRow,
  weeks: WeeksBefore
): Promise<{ kind: string; event_id: string; weeks: number; status: string; detail?: string }[]> {
  // Idempotency check
  const { data: existing } = await supabase
    .from("reminders_sent")
    .select("event_id")
    .eq("event_type", ev.kind)
    .eq("event_id", ev.event_id)
    .eq("weeks_before", weeks)
    .maybeSingle();
  if (existing) {
    return [{ kind: ev.kind, event_id: ev.event_id, weeks, status: "skipped" }];
  }

  // Resolve user email + name
  const { data: userData } = await supabase.auth.admin.getUserById(ev.user_id);
  const user = userData?.user;
  if (!user?.email) {
    return [{ kind: ev.kind, event_id: ev.event_id, weeks, status: "no_email" }];
  }
  const meta = (user.user_metadata ?? {}) as { full_name?: string };
  const toName = (meta.full_name ?? "").split(" ")[0] || null;

  // Compute days until
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(ev.due_date + "T00:00:00");
  const daysUntil = Math.round((dueDate.getTime() - today.getTime()) / 86400000);

  // Render
  const input = {
    kind: ev.kind,
    petName: ev.pet_name,
    itemName: ev.item_name,
    dueDate: ev.due_date,
    daysUntil,
    weeksBefore: weeks,
    toName,
    petUrl: `${siteUrl}/pets/${ev.pet_id}`,
    brand: "PetZap",
  };
  const subject = renderReminderSubject(input, "pt-BR");
  const html = renderReminderHtml(input, "pt-BR");

  // Send (with optional test-mode override to bypass Resend's free-tier
  // restriction of "only deliver to account owner's email")
  const override = process.env.EMAIL_TEST_OVERRIDE;
  const finalTo = override || user.email;
  const finalSubject = override ? `[TEST → ${user.email}] ${subject}` : subject;
  const sent = await sendEmail({ to: finalTo, subject: finalSubject, html });
  if (!sent.ok) {
    return [{ kind: ev.kind, event_id: ev.event_id, weeks, status: "failed", detail: sent.error }];
  }

  // Record idempotency
  await supabase.from("reminders_sent").insert({
    event_type: ev.kind,
    event_id: ev.event_id,
    weeks_before: weeks,
  });

  return [{ kind: ev.kind, event_id: ev.event_id, weeks, status: "sent" }];
}
