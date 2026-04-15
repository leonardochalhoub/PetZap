import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramSecret } from "@/lib/telegram/verify";
import { processIncomingTelegram } from "@/lib/telegram/persist";
import { clientKey, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { log } from "@/lib/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Telegram webhook. Telegram sends POSTs with `update` payloads and expects 200.
 * We verify the `X-Telegram-Bot-Api-Secret-Token` header matches our configured
 * secret (set when registering the webhook via /setWebhook).
 */
export async function POST(req: NextRequest) {
  const rl = await rateLimit({
    bucket: "telegram_webhook",
    key: clientKey(req),
    windowSeconds: 3600,
    limit: 600,
  });
  if (!rl.allowed) return rateLimitResponse(rl);

  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (!verifyTelegramSecret(secret)) {
    return new NextResponse("forbidden", { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    const update = payload as {
      update_id?: number;
      message?: {
        message_id?: number;
        chat?: { id?: number };
        from?: {
          id?: number;
          username?: string;
          first_name?: string;
          last_name?: string;
        };
        text?: string;
      };
    };

    const msg = update.message;
    if (update.update_id && msg?.chat?.id && msg.message_id && typeof msg.text === "string") {
      await processIncomingTelegram({
        updateId: update.update_id,
        chatId: msg.chat.id,
        messageId: msg.message_id,
        text: msg.text,
        username: msg.from?.username ?? null,
        firstName: msg.from?.first_name ?? null,
        lastName: msg.from?.last_name ?? null,
      });
    }
  } catch (err) {
    log.error("telegram.webhook.processing_failed", err);
  }

  // Always 200 so Telegram doesn't retry.
  return NextResponse.json({ ok: true });
}
