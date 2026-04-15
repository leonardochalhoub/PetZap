"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "./auth";

function generateLinkToken(): string {
  // 16 random bytes → 32-char hex, URL-safe and easy to type if needed.
  return randomBytes(16).toString("hex");
}

/**
 * Generate (or reuse) a link token for the logged-in user and return the
 * Telegram deep-link URL. The caller opens this URL — Telegram finalizes
 * the link when the user clicks "Start".
 */
export async function createTelegramLink(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  if (!botUsername) {
    return { error: "Telegram bot not configured (NEXT_PUBLIC_TELEGRAM_BOT_USERNAME missing)." };
  }

  // Delete any existing UNVERIFIED row for this user to avoid token collisions.
  // Verified rows stay — unlinking is a separate action.
  await supabase
    .from("telegram_links")
    .delete()
    .eq("user_id", user.id)
    .eq("verified", false);

  const token = generateLinkToken();
  const { error } = await supabase.from("telegram_links").insert({
    user_id: user.id,
    link_token: token,
    verified: false,
  });
  if (error) return { error: error.message };

  const url = `https://t.me/${botUsername}?start=${token}`;
  revalidatePath("/settings/telegram");
  return { data: { url } };
}

export async function unlinkTelegram(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("telegram_links").delete().eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/settings/telegram");
  return { data: { ok: true } };
}
