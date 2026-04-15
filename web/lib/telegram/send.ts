import { log } from "@/lib/log";

/**
 * Send a plain-text message to a Telegram chat via the Bot API.
 * Returns success boolean; logs non-OK responses.
 */
export async function sendTelegramText(chatId: number, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  if (!token) {
    log.error("telegram.send.no_token", {});
    return false;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "<unreadable>");
      log.error("telegram.send.non_ok", { status: res.status, body: errText });
      return false;
    }
    return true;
  } catch (err) {
    log.error("telegram.send.fetch_failed", err);
    return false;
  }
}
