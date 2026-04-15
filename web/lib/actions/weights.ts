"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PetWeightInputSchema } from "@/lib/db-schemas";
import type { ActionResult } from "./auth";

function emptyToNull(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function parseWeightKg(v: FormDataEntryValue | null): number | null {
  const s = emptyToNull(v);
  if (!s) return null;
  const n = Number(s.replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return n;
}

export async function addWeight(
  petId: string,
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const weightKg = parseWeightKg(formData.get("weight_kg"));
  const measuredAt = emptyToNull(formData.get("measured_at"))
    ?? new Date().toISOString().slice(0, 10);
  const notes = emptyToNull(formData.get("notes"));

  const parsed = PetWeightInputSchema.safeParse({
    pet_id: petId,
    weight_kg: weightKg,
    measured_at: measuredAt,
    notes,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { data, error } = await supabase
    .from("pet_weights")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath(`/pets/${petId}`);
  revalidatePath("/dashboard");
  return { data: { id: data.id } };
}

export async function deleteWeight(weightId: string, petId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("pet_weights").delete().eq("id", weightId);
  if (error) return { error: error.message };

  revalidatePath(`/pets/${petId}`);
  revalidatePath("/dashboard");
  return { data: { id: weightId } };
}
