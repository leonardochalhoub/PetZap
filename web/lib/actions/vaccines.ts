"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { VaccineInputSchema } from "@/lib/db-schemas";
import type { ActionResult } from "./auth";

function emptyToNull(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

export async function addVaccine(
  petId: string,
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = VaccineInputSchema.safeParse({
    pet_id: petId,
    name: formData.get("name"),
    given_date: formData.get("given_date"),
    next_date: emptyToNull(formData.get("next_date")),
    notes: emptyToNull(formData.get("notes")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { error } = await supabase.from("vaccines").insert(parsed.data);
  if (error) return { error: error.message };

  revalidatePath(`/pets/${petId}`);
  revalidatePath("/dashboard");
  return { data: { ok: true } };
}

export async function deleteVaccine(vaccineId: string, petId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("vaccines").delete().eq("id", vaccineId);
  if (error) return { error: error.message };

  revalidatePath(`/pets/${petId}`);
  revalidatePath("/dashboard");
  return { data: { ok: true } };
}
