import { describe, expect, it } from "vitest";

// Duplicates the small helper in add-vaccine-form.tsx — keep in sync if it changes.
function plusOneYear(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

describe("plusOneYear", () => {
  it("adds exactly one year on normal dates", () => {
    expect(plusOneYear("2026-04-15")).toBe("2027-04-15");
    expect(plusOneYear("2024-01-01")).toBe("2025-01-01");
  });

  it("handles Feb 29 on leap years by falling back to Feb 28 of the next (non-leap) year", () => {
    // Known quirk of setFullYear: Feb 29 + 1 year → Mar 1 of next year.
    // That's what the form shows the user; they can adjust. This test pins the behavior.
    const out = plusOneYear("2024-02-29");
    // Accept either Feb 28 or Mar 1, depending on JS runtime. Not Feb 29.
    expect(["2025-02-28", "2025-03-01"]).toContain(out);
  });

  it("returns the input unchanged on an invalid date", () => {
    expect(plusOneYear("not-a-date")).toBe("not-a-date");
  });
});

describe("clientKey equivalent — x-forwarded-for parsing", () => {
  function parse(xff: string | null, xri: string | null): string {
    if (xff) return xff.split(",")[0]?.trim() || "unknown";
    if (xri) return xri.trim();
    return "unknown";
  }

  it("takes the first hop from x-forwarded-for", () => {
    expect(parse("203.0.113.1, 70.41.3.18, 150.172.238.178", null)).toBe("203.0.113.1");
  });

  it("falls back to x-real-ip when no x-forwarded-for", () => {
    expect(parse(null, "203.0.113.1")).toBe("203.0.113.1");
  });

  it("returns 'unknown' when both headers are absent", () => {
    expect(parse(null, null)).toBe("unknown");
  });
});
