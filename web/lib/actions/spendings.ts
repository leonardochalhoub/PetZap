"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SpendingInputSchema } from "@/lib/db-schemas";
import type { ActionResult } from "./auth";

function emptyToNull(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

export async function addSpending(
  petId: string,
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const amountRaw = formData.get("amount");
  const amountStr = amountRaw == null ? "" : String(amountRaw).trim().replace(",", ".");
  const amountNum = Number(amountStr);
  if (!amountStr || Number.isNaN(amountNum) || amountNum < 0) {
    return { error: "Amount must be a non-negative number" };
  }
  const amount_cents = Math.round(amountNum * 100);

  const parsed = SpendingInputSchema.safeParse({
    pet_id: petId,
    amount_cents,
    currency: (formData.get("currency") ?? "BRL").toString().toUpperCase(),
    category: formData.get("category"),
    spent_at: formData.get("spent_at"),
    description: emptyToNull(formData.get("description")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { error } = await supabase.from("spendings").insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath(`/pets/${petId}`);
  revalidatePath("/dashboard");
  return { data: { ok: true } };
}

export async function addSpendingMulti(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const petIds = formData.getAll("pet_id").map((v) => String(v)).filter(Boolean);
  if (petIds.length === 0) {
    return { error: "errors.atLeastOnePet" };
  }

  const amountRaw = formData.get("amount");
  const amountStr = amountRaw == null ? "" : String(amountRaw).trim().replace(",", ".");
  const amountNum = Number(amountStr);
  if (!amountStr || Number.isNaN(amountNum) || amountNum < 0) {
    return { error: "Amount must be a non-negative number" };
  }
  const totalCents = Math.round(amountNum * 100);

  const category = formData.get("category");
  const spentAt = formData.get("spent_at");
  const description = emptyToNull(formData.get("description"));
  const currency = (formData.get("currency") ?? "BRL").toString().toUpperCase();

  // Even split: each pet gets floor; the first (remainder) pets get +1 cent.
  const N = petIds.length;
  const base = Math.floor(totalCents / N);
  const remainder = totalCents - base * N;

  const rows = petIds.map((petId, i) => {
    const cents = base + (i < remainder ? 1 : 0);
    return {
      pet_id: petId,
      amount_cents: cents,
      currency,
      category,
      spent_at: spentAt,
      description,
    };
  });

  // Validate each row via Zod
  for (const row of rows) {
    const parsed = SpendingInputSchema.safeParse(row);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }
  }

  const { error } = await supabase.from("spendings").insert(rows);
  if (error) return { error: error.message };

  for (const id of petIds) revalidatePath(`/pets/${id}`);
  revalidatePath("/dashboard");
  return { data: { count: rows.length } };
}

export async function deleteSpending(spendingId: string, petId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("spendings").delete().eq("id", spendingId);
  if (error) return { error: error.message };

  revalidatePath(`/pets/${petId}`);
  revalidatePath("/dashboard");
  return { data: { ok: true } };
}
