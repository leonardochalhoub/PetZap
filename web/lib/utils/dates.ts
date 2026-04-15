/**
 * Today as YYYY-MM-DD in the *user's local timezone*, not UTC.
 *
 * `new Date().toISOString().slice(0, 10)` returns the UTC date, which in
 * Brasília (UTC-3) flips to "tomorrow" after 21:00 local. Forms that use
 * that as a defaultValue then pre-fill the wrong day. Use `todayIsoLocal()`
 * in browser code so the default always matches what the user sees on the
 * wall clock.
 */
export function todayIsoLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Add N years to a YYYY-MM-DD string, returning a YYYY-MM-DD.
 * Local-date semantics (doesn't round-trip through UTC).
 */
export function plusYearsIsoLocal(iso: string, years: number): string {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return iso;
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  dt.setFullYear(dt.getFullYear() + years);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * Format a YYYY-MM-DD DB string into a locale-specific medium date,
 * parsed as a LOCAL date to avoid the UTC-midnight-in-BRT shift.
 */
export function formatIsoDateLocal(iso: string, locale: string): string {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return iso;
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
      new Date(parts[0], parts[1] - 1, parts[2]),
    );
  } catch {
    return iso;
  }
}
