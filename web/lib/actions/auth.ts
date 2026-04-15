"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const CredentialsSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const SignupSchema = CredentialsSchema.extend({
  full_name: z.string().min(1, "Name is required").max(80),
  treatment: z.enum(["male", "female", "neutral"], { message: "Pick a treatment" }),
});

export type ActionResult<T = unknown> = { error?: string; data?: T };

export async function signInWithPassword(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = CredentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const treatmentRaw = formData.get("treatment");
  const parsed = SignupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    full_name: (formData.get("full_name") ?? "").toString().trim(),
    treatment: treatmentRaw && treatmentRaw !== "" ? treatmentRaw : undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
      data: { full_name: parsed.data.full_name, treatment: parsed.data.treatment },
    },
  });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

const EmailOnlySchema = z.object({ email: z.string().email("Invalid email") });

export async function requestPasswordReset(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = EmailOnlySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid email" };
  }

  // Rate limit by email — 3 reset requests / hour to the same address. Stops
  // accidental double-clicks and email-bombing. Always returns "success" to the
  // caller so we never leak existence.
  const { rateLimit } = await import("@/lib/rate-limit");
  const rl = await rateLimit({
    bucket: "forgot_password",
    key: parsed.data.email.toLowerCase(),
    windowSeconds: 3600,
    limit: 3,
  });
  if (!rl.allowed) {
    // Pretend it worked — same response shape.
    return { data: { sent: true } };
  }

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  // Always return success — never reveal whether the email exists.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });
  return { data: { sent: true } };
}

const NewPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function resetPassword(
  _prev: ActionResult | undefined,
  formData: FormData
): Promise<ActionResult> {
  const parsed = NewPasswordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password" };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
