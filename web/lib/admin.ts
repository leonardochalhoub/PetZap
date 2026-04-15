import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Gate any /admin/* route. Returns the authenticated admin user.
 * Redirects to /dashboard for non-admins, /login for signed-out users.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, email, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) redirect("/dashboard");
  return { user, profile };
}

/**
 * Server-side "am I admin?" check that doesn't redirect — useful for
 * conditionally rendering admin links in the nav.
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  return Boolean(data?.is_admin);
}

/**
 * Short-hand for routes that need service-role reads across users.
 * Use ONLY inside admin-gated pages — it bypasses RLS.
 */
export function adminDb() {
  return createAdminClient();
}
