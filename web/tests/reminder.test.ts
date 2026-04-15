import { describe, expect, it } from "vitest";
import { renderReminderHtml, renderReminderSubject } from "@/lib/email/reminder";

const base = {
  kind: "vaccine" as const,
  petName: "Poli",
  itemName: "Antirrábica",
  dueDate: "2026-05-01",
  daysUntil: 7,
  weeksBefore: 1 as const,
  toName: "Leo",
  petUrl: "https://petzap.app/pets/abc",
  brand: "PetZap",
};

describe("renderReminderSubject", () => {
  it("uses PT-BR copy and interpolates fields", () => {
    const s = renderReminderSubject(base, "pt-BR");
    expect(s).toContain("Poli");
    expect(s).toContain("Antirrábica");
    expect(s).toContain("7 dias");
  });

  it("uses English copy", () => {
    const s = renderReminderSubject(base, "en");
    expect(s).toContain("Poli");
    expect(s).toContain("Antirrábica");
    expect(s).toContain("7 days");
  });
});

describe("renderReminderHtml", () => {
  it("escapes HTML in field values", () => {
    const html = renderReminderHtml(
      { ...base, petName: "Rex<script>", itemName: "Dose & More" },
      "pt-BR"
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("Rex&lt;script&gt;");
    expect(html).toContain("Dose &amp; More");
  });

  it("includes the pet URL verbatim", () => {
    const html = renderReminderHtml(base, "pt-BR");
    expect(html).toContain("https://petzap.app/pets/abc");
  });

  it("labels week window correctly", () => {
    const one = renderReminderHtml({ ...base, weeksBefore: 1 }, "pt-BR");
    const two = renderReminderHtml({ ...base, weeksBefore: 2 }, "pt-BR");
    expect(one).toContain("1 semana antes");
    expect(two).toContain("2 semanas antes");
  });

  it("falls back gracefully when toName is null", () => {
    const html = renderReminderHtml({ ...base, toName: null }, "pt-BR");
    expect(html).toContain("Olá!");
  });
});
