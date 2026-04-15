import { NextRequest, NextResponse } from "next/server";
import { verifyMetaSignature } from "@/lib/whatsapp/verify";
import { processIncomingMessage } from "@/lib/whatsapp/persist";
import { sendWhatsappText } from "@/lib/whatsapp/send";
import { clientKey, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { log } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET — Meta webhook verification handshake.
 * Returns hub.challenge as plain text when verify token matches.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.META_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return new NextResponse("forbidden", { status: 403 });
}

/**
 * POST — inbound WhatsApp message events.
 * HMAC-verifies, extracts text messages, processes each, and replies.
 * Always returns 200 (unless HMAC fails) so Meta does not retry.
 */
export async function POST(req: NextRequest) {
  // Rate limit BEFORE doing any crypto work — protects from spray attacks.
  // 600 requests/hour per IP is well above Meta's real traffic (usually <1/sec per number).
  const rl = await rateLimit({
    bucket: "whatsapp_webhook",
    key: clientKey(req),
    windowSeconds: 3600,
    limit: 600,
  });
  if (!rl.allowed) {
    log.warn("whatsapp.rate_limited", { key: clientKey(req), current: rl.current });
    return rateLimitResponse(rl);
  }

  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch (err) {
    log.error("whatsapp.webhook.body_read_failed", err);
    return new NextResponse("", { status: 200 });
  }

  const signature = req.headers.get("x-hub-signature-256");
  if (!verifyMetaSignature(rawBody, signature)) {
    return new NextResponse("forbidden", { status: 403 });
  }

  try {
    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return new NextResponse("", { status: 200 });
    }

    const entries = (payload as { entry?: unknown[] })?.entry ?? [];

    // TEMP DIAGNOSTIC: log entire payload so we can see status events (delivered/failed/read)
    console.log("[whatsapp.webhook] payload", JSON.stringify(payload));

    for (const entry of entries) {
      const changes = (entry as { changes?: unknown[] })?.changes ?? [];
      for (const change of changes) {
        const value = (change as { value?: unknown })?.value as
          | { messages?: unknown[]; statuses?: unknown[] }
          | undefined;
        // TEMP DIAGNOSTIC: log status events explicitly
        if (value?.statuses) {
          console.log("[whatsapp.webhook] STATUS", JSON.stringify(value.statuses));
        }
        const messages = value?.messages ?? [];

        for (const msg of messages) {
          const m = msg as {
            id?: string;
            from?: string;
            type?: string;
            text?: { body?: string };
          };
          if (m.type !== "text") continue;
          if (!m.id || !m.from || !m.text?.body) continue;

          const phoneE164 = m.from.startsWith("+") ? m.from : `+${m.from}`;

          try {
            const { reply } = await processIncomingMessage(
              phoneE164,
              m.text.body,
              m.id,
            );
            if (reply) {
              await sendWhatsappText(phoneE164, reply);
            }
          } catch (err) {
            console.error("[whatsapp.webhook] processing failed", err);
          }
        }
      }
    }
  } catch (err) {
    console.error("[whatsapp.webhook] unexpected error", err);
  }

  return new NextResponse("", { status: 200 });
}
