/**
 * Send an outbound WhatsApp text message via Meta Graph API.
 * Silently logs non-2xx responses; returns success boolean.
 */
export async function sendWhatsappText(toE164: string, body: string): Promise<boolean> {
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID!;
  const accessToken = process.env.META_ACCESS_TOKEN!;

  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: toE164,
        type: "text",
        text: { body },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "<unreadable>");
      console.error("[whatsapp.send] non-OK response", res.status, errText);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[whatsapp.send] fetch failed", err);
    return false;
  }
}
