/**
 * Telegram signs webhook requests by including a secret token in the
 * `X-Telegram-Bot-Api-Secret-Token` header, set when registering the webhook.
 * We compare against TELEGRAM_WEBHOOK_SECRET.
 */
export function verifyTelegramSecret(headerValue: string | null): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected) return false;
  if (!headerValue) return false;
  if (headerValue.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ headerValue.charCodeAt(i);
  }
  return diff === 0;
}
