import type { SpendingCategory } from "@/lib/whatsapp/schemas";

/**
 * Deterministic fallback extractors for when the LLM drops fields.
 * Works on the original user text (or transcript, for audio).
 */

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function extractAmount(text: string): number | null {
  if (!text) return null;
  const patterns: RegExp[] = [
    /R\$\s*(\d{1,6}(?:[,.]\d{1,2})?)/i,
    /\bgastei\s+(\d{1,6}(?:[,.]\d{1,2})?)\b/i,
    /\bpaguei\s+(\d{1,6}(?:[,.]\d{1,2})?)\b/i,
    /\bcustou\s+(\d{1,6}(?:[,.]\d{1,2})?)\b/i,
    /\bvalor\s+(?:de\s+|:\s*)?(\d{1,6}(?:[,.]\d{1,2})?)\b/i,
    /\bpor\s+(\d{1,6}(?:[,.]\d{1,2})?)\s*reais?\b/i,
    /\b(\d{1,6}(?:[,.]\d{1,2})?)\s*reais?\b/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) {
      const n = parseFloat(m[1].replace(",", "."));
      if (Number.isFinite(n) && n > 0 && n < 100_000) return n;
    }
  }
  return null;
}

export function inferCategory(
  text: string,
  description?: string | null,
): SpendingCategory | null {
  const h = normalize(`${text} ${description ?? ""}`);
  if (/\b(remedio|remedios|medicamento|medicacao|antipulgas|vermifugo|antibiotico|pomada|anti-inflamatorio)\b/.test(h)) return "medicine";
  if (/\b(racao|alimento|petisco|snack|comida|sache|pate|biscoito|treat)\b/.test(h)) return "food";
  if (/\b(vet|veterinario|consulta|clinica|cirurgia|exame|ultrassom|castracao)\b/.test(h)) return "vet";
  if (/\b(brinquedo|bolinha|mordedor|corda|pelucia)\b/.test(h)) return "toys";
  if (/\b(banho|tosa|escovacao|corte de unha)\b/.test(h)) return "grooming";
  if (/\b(coleira|guia|roupa|cama|casinha|bebedouro|comedouro)\b/.test(h)) return "accessories";
  if (/\b(tapete higienico|areia|shampoo|fralda)\b/.test(h)) return "hygiene";
  return null;
}

export function extractSpentAt(text: string, todayIso: string): string | null {
  const h = normalize(text);
  const today = new Date(`${todayIso}T12:00:00Z`);
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  if (/\bhoje\b/.test(h)) return iso(today);
  if (/\bontem\b/.test(h)) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - 1);
    return iso(d);
  }
  if (/\banteontem\b/.test(h)) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - 2);
    return iso(d);
  }
  if (/\bamanha\b/.test(h)) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + 1);
    return iso(d);
  }
  // explicit DD/MM or YYYY-MM-DD
  const ymd = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  const dmy = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (dmy) {
    const d = dmy[1].padStart(2, "0");
    const m = dmy[2].padStart(2, "0");
    const y = dmy[3] ? (dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3]) : String(today.getUTCFullYear());
    return `${y}-${m}-${d}`;
  }
  return null;
}

export function extractWeightKg(text: string): number | null {
  if (!text) return null;
  const patterns: RegExp[] = [
    /\b(\d{1,3}(?:[,.]\d{1,2})?)\s*(?:kg|quilos?|k)\b/i,
    /\btem\s+(\d{1,3}(?:[,.]\d{1,2})?)\b/i,
    /\bpesa\s+(\d{1,3}(?:[,.]\d{1,2})?)\b/i,
    /\bpesou\s+(\d{1,3}(?:[,.]\d{1,2})?)\b/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) {
      const n = parseFloat(m[1].replace(",", "."));
      if (Number.isFinite(n) && n > 0 && n < 200) return n;
    }
  }
  return null;
}

export function extractRelativeNextDue(text: string, fromIso: string): string | null {
  const h = normalize(text);
  const base = new Date(`${fromIso}T12:00:00Z`);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const addMonths = (n: number) => {
    const d = new Date(base);
    d.setUTCMonth(d.getUTCMonth() + n);
    return iso(d);
  };
  const addDays = (n: number) => {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + n);
    return iso(d);
  };
  const addYears = (n: number) => {
    const d = new Date(base);
    d.setUTCFullYear(d.getUTCFullYear() + n);
    return iso(d);
  };

  // em um / 1 / X mês(es)
  const monthMatch = h.match(/\bem\s+(?:(um|uma|\d+)\s+)?mes(?:es)?\b/);
  if (monthMatch) {
    const raw = monthMatch[1] ?? "1";
    const n = raw === "um" || raw === "uma" ? 1 : parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0 && n <= 60) return addMonths(n);
  }
  const dayMatch = h.match(/\bem\s+(\d+)\s+dias?\b/);
  if (dayMatch?.[1]) {
    const n = parseInt(dayMatch[1], 10);
    if (Number.isFinite(n) && n > 0 && n <= 3650) return addDays(n);
  }
  const yearMatch = h.match(/\bem\s+(?:(um|uma|\d+)\s+)?ano(s)?\b/);
  if (yearMatch) {
    const raw = yearMatch[1] ?? "1";
    const n = raw === "um" || raw === "uma" ? 1 : parseInt(raw, 10);
    if (Number.isFinite(n) && n > 0 && n <= 10) return addYears(n);
  }
  return null;
}
