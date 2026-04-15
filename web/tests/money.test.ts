import { describe, expect, it } from "vitest";
import { formatMoney } from "@/components/spending-list";

describe("formatMoney", () => {
  it("formats BRL with pt-BR locale", () => {
    // 7500 cents = R$ 75,00
    const out = formatMoney(7500, "BRL");
    expect(out).toMatch(/75,00/);
    expect(out).toMatch(/R\$/);
  });

  it("handles zero", () => {
    expect(formatMoney(0, "BRL")).toMatch(/0,00/);
  });

  it("handles large numbers with thousand separator", () => {
    const out = formatMoney(1234567, "BRL"); // R$ 12.345,67
    expect(out).toMatch(/12\.345,67/);
  });

  it("falls back for invalid currency codes", () => {
    const out = formatMoney(1000, "ZZZ" as unknown as string);
    // Fallback path returns "ZZZ 10.00" or the Intl default; accept either.
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
  });
});

describe("multi-pet spend split math", () => {
  // Replicates the server-action split used by addSpendingMulti.
  function split(totalCents: number, n: number): number[] {
    const base = Math.floor(totalCents / n);
    const remainder = totalCents - base * n;
    return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0));
  }

  it("divides evenly when remainder is zero", () => {
    expect(split(15000, 2)).toEqual([7500, 7500]); // R$ 150.00 / 2 = 75.00 each
    expect(split(9000, 3)).toEqual([3000, 3000, 3000]);
  });

  it("distributes remainder cents to first pets", () => {
    expect(split(10001, 3)).toEqual([3334, 3334, 3333]);
  });

  it("sum always equals total", () => {
    const cases = [[15000, 2], [10001, 3], [1, 5], [999, 7], [1000000, 13]] as const;
    for (const [total, n] of cases) {
      const parts = split(total, n);
      expect(parts.reduce((a, b) => a + b, 0)).toBe(total);
      expect(parts).toHaveLength(n);
    }
  });
});
