import { NextRequest, NextResponse } from "next/server";
import { verifyTelegramSecret } from "@/lib/telegram/verify";
import { processIncomingTelegram } from "@/lib/telegram/persist";
import { downloadTelegramFile } from "@/lib/telegram/fetch-file";
import { clientKey, rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { log } from "@/lib/log";
import type { ParserInput } from "@/lib/whatsapp/parse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Telegram voice notes are usually ogg/opus; audio files can be mp3/m4a/wav.
// Cap at 5 MB to avoid pulling huge files through the Gemini inline API.
const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

type TelegramVoice = { file_id: string; duration?: number; mime_type?: string };
type TelegramAudio = TelegramVoice & { performer?: string; title?: string };

type TelegramMessage = {
  message_id?: number;
  chat?: { id?: number };
  from?: {
    id?: number;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  text?: string;
  voice?: TelegramVoice;
  audio?: TelegramAudio;
};

async function buildInput(msg: TelegramMessage): Promise<ParserInput | null> {
  if (typeof msg.text === "string" && msg.text.length > 0) {
    return { text: msg.text };
  }

  const media: (TelegramVoice & { fallbackMime: string }) | null = msg.voice
    ? { ...msg.voice, fallbackMime: msg.voice.mime_type ?? "audio/ogg" }
    : msg.audio
      ? { ...msg.audio, fallbackMime: msg.audio.mime_type ?? "audio/mpeg" }
      : null;

  if (!media) return null;

  const dl = await downloadTelegramFile(media.file_id, media.fallbackMime);
  if (!dl) return null;
  if (dl.bytes.byteLength > MAX_AUDIO_BYTES) {
    log.warn("telegram.webhook.audio_too_large", { bytes: dl.bytes.byteLength });
    return null;
  }

  return { audio: { bytes: dl.bytes, mime: dl.mime } };
}

/**
 * Telegram webhook. Accepts text or voice/audio messages.
 * Verifies the secret token, rate-limits, and hands off to persist.
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
      message?: TelegramMessage;
    };
    const msg = update.message;

    if (update.update_id && msg?.chat?.id && msg.message_id) {
      const input = await buildInput(msg);
      if (input) {
        await processIncomingTelegram({
          updateId: update.update_id,
          chatId: msg.chat.id,
          messageId: msg.message_id,
          input,
          username: msg.from?.username ?? null,
          firstName: msg.from?.first_name ?? null,
          lastName: msg.from?.last_name ?? null,
        });
      }
    }
  } catch (err) {
    log.error("telegram.webhook.processing_failed", err);
  }

  return NextResponse.json({ ok: true });
}
