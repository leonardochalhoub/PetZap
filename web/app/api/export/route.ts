/**
 * Full data export for the authenticated user.
 * GET /api/export → application/json attachment.
 *
 * Includes everything: pets (with nested vaccines/spendings/weights),
 * WhatsApp links + message audit log, user metadata. RLS-protected via
 * the user's session.
 */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clientKey, rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 5 exports per hour per user is plenty; caps accidental reload loops.
  const rl = await rateLimit({
    bucket: "export",
    key: user.id + "|" + clientKey(req),
    windowSeconds: 3600,
    limit: 5,
  });
  if (!rl.allowed) return rateLimitResponse(rl);

  const meta = (user.user_metadata ?? {}) as { full_name?: string; treatment?: string };

  const [
    { data: pets },
    { data: vaccines },
    { data: spendings },
    { data: weights },
    { data: whatsappLinks },
    { data: whatsappMessages },
  ] = await Promise.all([
    supabase
      .from("pets")
      .select("id, name, species, sex, neutered, breed, birthdate, photo_url, photo_zoom, sort_order, created_at, updated_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("vaccines")
      .select("id, pet_id, name, given_date, next_date, notes, created_at")
      .order("given_date", { ascending: true }),
    supabase
      .from("spendings")
      .select("id, pet_id, amount_cents, currency, category, spent_at, description, next_due, created_at")
      .order("spent_at", { ascending: true }),
    supabase
      .from("pet_weights")
      .select("id, pet_id, weight_kg, measured_at, notes, created_at")
      .order("measured_at", { ascending: true }),
    supabase
      .from("whatsapp_links")
      .select("id, phone, verified, created_at"),
    supabase
      .from("whatsapp_messages")
      .select("id, message_id, phone, raw_text, parsed_json, intent, status, error, created_at")
      .order("created_at", { ascending: true }),
  ]);

  // Nest per-pet
  const vaccinesByPet = new Map<string, unknown[]>();
  for (const v of vaccines ?? []) {
    const list = vaccinesByPet.get(v.pet_id) ?? [];
    list.push(v);
    vaccinesByPet.set(v.pet_id, list);
  }
  const spendingsByPet = new Map<string, unknown[]>();
  for (const s of spendings ?? []) {
    const list = spendingsByPet.get(s.pet_id) ?? [];
    list.push(s);
    spendingsByPet.set(s.pet_id, list);
  }
  const weightsByPet = new Map<string, unknown[]>();
  for (const w of weights ?? []) {
    const list = weightsByPet.get(w.pet_id) ?? [];
    list.push(w);
    weightsByPet.set(w.pet_id, list);
  }

  const petsNested = (pets ?? []).map((p) => ({
    ...p,
    vaccines: vaccinesByPet.get(p.id) ?? [],
    spendings: spendingsByPet.get(p.id) ?? [],
    weights: weightsByPet.get(p.id) ?? [],
  }));

  const payload = {
    schema_version: 1,
    exported_at: new Date().toISOString(),
    app: "PetZap",
    user: {
      id: user.id,
      email: user.email,
      full_name: meta.full_name ?? null,
      treatment: meta.treatment ?? null,
      created_at: user.created_at,
    },
    counts: {
      pets: petsNested.length,
      vaccines: vaccines?.length ?? 0,
      spendings: spendings?.length ?? 0,
      weights: weights?.length ?? 0,
      whatsapp_links: whatsappLinks?.length ?? 0,
      whatsapp_messages: whatsappMessages?.length ?? 0,
    },
    pets: petsNested,
    whatsapp: {
      links: whatsappLinks ?? [],
      messages: whatsappMessages ?? [],
    },
  };

  const today = new Date().toISOString().slice(0, 10);
  const safeName = (meta.full_name ?? user.email?.split("@")[0] ?? "user")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const filename = `petzap-${safeName}-${today}.json`;

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
