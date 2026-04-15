import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verify Meta's X-Hub-Signature-256 header using HMAC-SHA256 of the raw body.
 * Returns true when the signature matches, false otherwise (including malformed input).
 */
export function verifyMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;

  const secret = process.env.META_APP_SECRET!;
  if (!secret) return false;

  const prefix = "sha256=";
  if (!signatureHeader.startsWith(prefix)) return false;

  const providedHex = signatureHeader.slice(prefix.length).trim();
  if (!/^[0-9a-f]+$/i.test(providedHex)) return false;

  const expectedHex = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  if (providedHex.length !== expectedHex.length) return false;

  const provided = Buffer.from(providedHex, "hex");
  const expected = Buffer.from(expectedHex, "hex");

  if (provided.length !== expected.length) return false;

  try {
    return timingSafeEqual(provided, expected);
  } catch {
    return false;
  }
}
