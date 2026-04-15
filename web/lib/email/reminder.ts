/**
 * Reminder email rendering. Pure functions — testable, no I/O.
 */

export type ReminderKind = "vaccine" | "medication";
export type ReminderLocale = "pt-BR" | "en";

export type ReminderInput = {
  kind: ReminderKind;
  petName: string;
  itemName: string;
  dueDate: string; // YYYY-MM-DD
  daysUntil: number;
  weeksBefore: 1 | 2;
  toName: string | null;
  petUrl: string;
  brand: string;
};

const COPY = {
  "pt-BR": {
    vaccine: { item: "vacina", actionVerb: "está marcada" },
    medication: { item: "medicamento", actionVerb: "está marcado" },
    in: "em",
    days: "dias",
    one: "1 semana",
    two: "2 semanas",
    greetingFallback: "Olá",
    cta: "Ver detalhes do pet",
    footer: "PetZap · gestão de pets simples e gentil",
    weeksLabel: (w: 1 | 2) => (w === 1 ? "1 semana antes" : "2 semanas antes"),
    subject: (kind: ReminderKind, pet: string, item: string, days: number) =>
      `Lembrete: ${item} de ${pet} em ${days} dias`,
  },
  en: {
    vaccine: { item: "vaccine", actionVerb: "is scheduled" },
    medication: { item: "medication", actionVerb: "is scheduled" },
    in: "in",
    days: "days",
    one: "1 week",
    two: "2 weeks",
    greetingFallback: "Hi",
    cta: "Open pet details",
    footer: "PetZap · gentle pet management",
    weeksLabel: (w: 1 | 2) => (w === 1 ? "1 week before" : "2 weeks before"),
    subject: (kind: ReminderKind, pet: string, item: string, days: number) =>
      `Reminder: ${item} for ${pet} in ${days} days`,
  },
} as const;

export function renderReminderSubject(input: ReminderInput, locale: ReminderLocale = "pt-BR"): string {
  const c = COPY[locale];
  return c.subject(input.kind, input.petName, input.itemName, input.daysUntil);
}

export function renderReminderHtml(input: ReminderInput, locale: ReminderLocale = "pt-BR"): string {
  const c = COPY[locale];
  const k = c[input.kind];
  const greeting = input.toName ? `${c.greetingFallback}, ${input.toName}` : c.greetingFallback;
  const weeksLabel = c.weeksLabel(input.weeksBefore);

  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>${escapeHtml(input.brand)}</title>
</head>
<body style="margin:0;padding:0;background:#EFEAE0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1c1917;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#EFEAE0;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;background:#ffffff;border-radius:16px;border:1px solid #E7E5E4;overflow:hidden;">
        <tr><td style="padding:24px 28px 8px;">
          <div style="font-size:14px;color:#78716C;letter-spacing:0.04em;text-transform:uppercase;">${escapeHtml(weeksLabel)}</div>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:600;color:#1c1917;line-height:1.3;">
            ${escapeHtml(greeting)}!
          </h1>
        </td></tr>
        <tr><td style="padding:8px 28px 0;">
          <p style="margin:0;font-size:15px;line-height:1.6;color:#44403c;">
            <strong style="color:#1c1917;">${escapeHtml(input.itemName)}</strong> de
            <strong style="color:#1c1917;">${escapeHtml(input.petName)}</strong>
            ${escapeHtml(k.actionVerb)} para
            <strong style="color:#1c1917;">${escapeHtml(formatDate(input.dueDate, locale))}</strong>
            (${escapeHtml(c.in)} ${input.daysUntil} ${escapeHtml(c.days)}).
          </p>
        </td></tr>
        <tr><td style="padding:24px 28px 8px;">
          <a href="${escapeHtml(input.petUrl)}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:600;">${escapeHtml(c.cta)}</a>
        </td></tr>
        <tr><td style="padding:24px 28px 28px;border-top:1px solid #E7E5E4;margin-top:16px;">
          <p style="margin:16px 0 0;font-size:12px;color:#78716C;text-align:center;">${escapeHtml(c.footer)}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(iso: string, locale: ReminderLocale): string {
  try {
    return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "long", year: "numeric" }).format(
      new Date(iso + "T00:00:00")
    );
  } catch {
    return iso;
  }
}
