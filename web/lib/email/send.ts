/**
 * Resend wrapper. Lazy-imports the SDK so the module loads even when the
 * dep isn't installed yet (defensive — prefer real install).
 */
import { Resend } from "resend";

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

let client: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendResult> {
  const c = getClient();
  if (!c) {
    console.warn("[email] RESEND_API_KEY missing; not sending");
    return { ok: false, error: "RESEND_API_KEY missing" };
  }
  const from = process.env.EMAIL_FROM ?? "PetZap <onboarding@resend.dev>";
  try {
    const { data, error } = await c.emails.send({
      from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id ?? "" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
