"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./auth";

const PhoneSchema = z.object({
  phone: z.string().regex(/^\+\d{8,15}$/, "Phone must be E.164 format, e.g. +5511999998888"),
});

const OtpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function linkPhone(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = PhoneSchema.safeParse({ phone: formData.get("phone") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid phone" };
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Upsert by user_id (1 link per user for prototype); resets verified + OTP.
  const { error: delErr } = await supabase.from("whatsapp_links").delete().eq("user_id", user.id);
  if (delErr) return { error: delErr.message };

  const { error } = await supabase.from("whatsapp_links").insert({
    user_id: user.id,
    phone: parsed.data.phone,
    verified: false,
    otp_code: otp,
    otp_expires_at: expiresAt,
  });
  if (error) return { error: error.message };

  // Prototype: log OTP instead of sending it via WhatsApp.
  console.log(`[whatsapp-link] OTP for ${parsed.data.phone}: ${otp} (user=${user.id})`);

  revalidatePath("/settings/whatsapp");
  return { data: { ok: true } };
}

export async function verifyPhone(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = OtpSchema.safeParse({ otp: formData.get("otp") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid OTP" };
  }

  const { data: link, error: selErr } = await supabase
    .from("whatsapp_links")
    .select("id, otp_code, otp_expires_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (selErr) return { error: selErr.message };
  if (!link) return { error: "No pending link. Start by adding your phone." };
  if (!link.otp_code || !link.otp_expires_at) {
    return { error: "No active OTP. Request a new one." };
  }
  if (new Date(link.otp_expires_at).getTime() < Date.now()) {
    return { error: "OTP expired. Request a new one." };
  }
  if (link.otp_code !== parsed.data.otp) {
    return { error: "Incorrect OTP." };
  }

  const { error: updErr } = await supabase
    .from("whatsapp_links")
    .update({ verified: true, otp_code: null, otp_expires_at: null })
    .eq("id", link.id);
  if (updErr) return { error: updErr.message };

  revalidatePath("/settings/whatsapp");
  return { data: { ok: true } };
}

export async function unlinkPhone(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("whatsapp_links").delete().eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/settings/whatsapp");
  return { data: { ok: true } };
}
