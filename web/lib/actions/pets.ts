"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PetInputSchema, Sex } from "@/lib/db-schemas";
import type { ActionResult } from "./auth";

const PHOTO_BUCKET = "pet-photos";
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function emptyToNull(v: FormDataEntryValue | null): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function parseSex(v: FormDataEntryValue | null): "male" | "female" | null {
  const s = emptyToNull(v);
  if (!s) return null;
  const r = Sex.safeParse(s);
  return r.success ? r.data : null;
}

function parseNeutered(v: FormDataEntryValue | null): boolean {
  if (v == null) return false;
  const s = String(v).toLowerCase();
  return s === "on" || s === "true" || s === "1";
}

function parseWeightKg(v: FormDataEntryValue | null): number | null {
  const s = emptyToNull(v);
  if (!s) return null;
  const n = Number(s.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0 || n >= 200) return null;
  return n;
}

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/jpeg": return "jpg";
    case "image/png":  return "png";
    case "image/webp": return "webp";
    case "image/gif":  return "gif";
    default:           return "bin";
  }
}

function publicPhotoUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}

/**
 * Upload a photo File to Storage and write pets.photo_url. Caller already verified
 * that the user owns the pet. Old photo (if any) is best-effort deleted.
 */
async function uploadPhotoForPet(
  supabase: SupabaseClient,
  userId: string,
  petId: string,
  file: File,
  oldPhotoUrl: string | null
): Promise<{ url: string } | { error: string }> {
  if (file.size === 0) return { error: "errors.noFileSelected" };
  if (file.size > MAX_PHOTO_BYTES) return { error: "errors.photoTooBig" };
  if (!ALLOWED_PHOTO_TYPES.has(file.type)) return { error: "errors.photoMimeUnsupported" };

  const ext = extFromMime(file.type);
  const path = `${userId}/${petId}-${Date.now()}.${ext}`;
  const admin = createAdminClient();

  const { error: upErr } = await admin.storage
    .from(PHOTO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false, cacheControl: "3600" });
  if (upErr) return { error: upErr.message };

  if (oldPhotoUrl) {
    const oldPath = oldPhotoUrl.split(`/${PHOTO_BUCKET}/`)[1];
    if (oldPath && oldPath !== path) {
      await admin.storage.from(PHOTO_BUCKET).remove([oldPath]);
    }
  }

  const url = publicPhotoUrl(path);
  const { error: updErr } = await supabase
    .from("pets")
    .update({ photo_url: url })
    .eq("id", petId);
  if (updErr) return { error: updErr.message };
  return { url };
}

export async function createPet(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = PetInputSchema.safeParse({
    name: formData.get("name"),
    species: formData.get("species"),
    sex: parseSex(formData.get("sex")),
    neutered: parseNeutered(formData.get("neutered")),
    breed: emptyToNull(formData.get("breed")),
    birthdate: emptyToNull(formData.get("birthdate")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { data, error } = await supabase
    .from("pets")
    .insert({ ...parsed.data, user_id: user.id })
    .select("id")
    .single();
  if (error) return { error: error.message };

  // Optional initial weight
  const initialWeight = parseWeightKg(formData.get("weight_kg"));
  if (initialWeight !== null) {
    await supabase.from("pet_weights").insert({
      pet_id: data.id,
      weight_kg: initialWeight,
      measured_at: new Date().toISOString().slice(0, 10),
    });
  }

  // Optional initial photo
  const photoFile = formData.get("photo");
  if (photoFile instanceof File && photoFile.size > 0) {
    const result = await uploadPhotoForPet(supabase, user.id, data.id, photoFile, null);
    if ("error" in result) {
      // Pet was created; surface a soft error so the user can re-upload from detail page.
      revalidatePath("/dashboard");
      redirect(`/pets/${data.id}?photo_error=${encodeURIComponent(result.error)}`);
    }
  }

  revalidatePath("/dashboard");
  redirect(`/pets/${data.id}`);
}

export async function updatePet(
  petId: string,
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = PetInputSchema.safeParse({
    name: formData.get("name"),
    species: formData.get("species"),
    sex: parseSex(formData.get("sex")),
    neutered: parseNeutered(formData.get("neutered")),
    breed: emptyToNull(formData.get("breed")),
    birthdate: emptyToNull(formData.get("birthdate")),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { error } = await supabase.from("pets").update(parsed.data).eq("id", petId);
  if (error) return { error: error.message };

  revalidatePath(`/pets/${petId}`);
  revalidatePath("/dashboard");
  return { data: { id: petId } };
}

export async function deletePet(petId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pet } = await supabase
    .from("pets")
    .select("photo_url")
    .eq("id", petId)
    .maybeSingle();
  if (pet?.photo_url) {
    const path = pet.photo_url.split(`/${PHOTO_BUCKET}/`)[1];
    if (path) {
      const admin = createAdminClient();
      await admin.storage.from(PHOTO_BUCKET).remove([path]);
    }
  }

  const { error } = await supabase.from("pets").delete().eq("id", petId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function uploadPetPhoto(
  petId: string,
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const file = formData.get("photo");
  if (!(file instanceof File)) return { error: "errors.noFileSelected" };

  const { data: pet, error: petErr } = await supabase
    .from("pets")
    .select("id, photo_url")
    .eq("id", petId)
    .maybeSingle();
  if (petErr) return { error: petErr.message };
  if (!pet) return { error: "errors.petNotFound" };

  const result = await uploadPhotoForPet(supabase, user.id, petId, file, pet.photo_url ?? null);
  if ("error" in result) return { error: result.error };

  revalidatePath(`/pets/${petId}`);
  revalidatePath("/dashboard");
  return { data: { url: result.url } };
}

export async function removePetPhoto(petId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: pet, error } = await supabase
    .from("pets")
    .select("id, photo_url")
    .eq("id", petId)
    .maybeSingle();
  if (error) return { error: error.message };
  if (!pet) return { error: "errors.petNotFound" };

  if (pet.photo_url) {
    const path = pet.photo_url.split(`/${PHOTO_BUCKET}/`)[1];
    if (path) {
      const admin = createAdminClient();
      await admin.storage.from(PHOTO_BUCKET).remove([path]);
    }
  }

  const { error: updErr } = await supabase
    .from("pets")
    .update({ photo_url: null, photo_zoom: 1 })
    .eq("id", petId);
  if (updErr) return { error: updErr.message };

  revalidatePath(`/pets/${petId}`);
  revalidatePath("/dashboard");
  return { data: { id: petId } };
}

export async function reorderPets(orderedIds: string[]): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { error: "errors.noFileSelected" };
  }

  // RLS ensures we can only update our own pets; if a foreign id sneaks in, the
  // update simply matches 0 rows.
  const updates = await Promise.all(
    orderedIds.map((id, idx) =>
      supabase.from("pets").update({ sort_order: idx }).eq("id", id)
    )
  );
  const failed = updates.find((u) => u.error);
  if (failed?.error) return { error: failed.error.message };

  revalidatePath("/dashboard");
  return { data: { count: orderedIds.length } };
}

export async function updatePhotoZoom(petId: string, zoom: number): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!Number.isFinite(zoom) || zoom < 0.5 || zoom > 5) {
    return { error: "errors.photoMimeUnsupported" };
  }
  const { error } = await supabase
    .from("pets")
    .update({ photo_zoom: zoom })
    .eq("id", petId);
  if (error) return { error: error.message };

  revalidatePath(`/pets/${petId}`);
  revalidatePath("/dashboard");
  return { data: { id: petId } };
}
