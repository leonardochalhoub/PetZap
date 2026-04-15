import { describe, expect, it } from "vitest";
import { en } from "@/i18n/messages/en";
import { ptBR } from "@/i18n/messages/pt-BR";

function collectKeys(obj: unknown, prefix = ""): string[] {
  if (obj === null || typeof obj !== "object") return [prefix];
  if (Array.isArray(obj)) return [prefix];
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const next = prefix ? `${prefix}.${k}` : k;
    keys.push(...collectKeys(v, next));
  }
  return keys.sort();
}

describe("i18n dictionaries", () => {
  it("EN and PT-BR have the exact same key structure", () => {
    const enKeys = collectKeys(en);
    const ptKeys = collectKeys(ptBR);
    expect(ptKeys).toEqual(enKeys);
  });

  it("no value is an empty string", () => {
    function walk(obj: unknown, path = "") {
      if (typeof obj === "string") {
        if (obj === "") throw new Error(`empty string at ${path}`);
        return;
      }
      if (Array.isArray(obj)) {
        obj.forEach((v, i) => walk(v, `${path}[${i}]`));
        return;
      }
      if (obj && typeof obj === "object") {
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
          walk(v, path ? `${path}.${k}` : k);
        }
      }
    }
    expect(() => walk(en)).not.toThrow();
    expect(() => walk(ptBR)).not.toThrow();
  });

  it("welcomeBack has all 3 treatments", () => {
    expect(en.dashboard.welcomeBack).toHaveProperty("male");
    expect(en.dashboard.welcomeBack).toHaveProperty("female");
    expect(en.dashboard.welcomeBack).toHaveProperty("neutral");
    expect(ptBR.dashboard.welcomeBack).toHaveProperty("male");
    expect(ptBR.dashboard.welcomeBack).toHaveProperty("female");
    expect(ptBR.dashboard.welcomeBack).toHaveProperty("neutral");
  });

  it("PT-BR treatment uses correct gendered endings", () => {
    expect(ptBR.dashboard.welcomeBack.male).toMatch(/Bem-vindo/);
    expect(ptBR.dashboard.welcomeBack.female).toMatch(/Bem-vinda/);
    expect(ptBR.dashboard.welcomeBack.neutral).toMatch(/Bem-vinde/);
  });

  it("species labels are defined for every species key", () => {
    const species = ["dog", "cat", "bird", "rabbit", "other"] as const;
    for (const s of species) {
      expect(en.species[s]).toBeTruthy();
      expect(ptBR.species[s]).toBeTruthy();
      expect(en.speciesGendered[s].male).toBeTruthy();
      expect(en.speciesGendered[s].female).toBeTruthy();
      expect(ptBR.speciesGendered[s].male).toBeTruthy();
      expect(ptBR.speciesGendered[s].female).toBeTruthy();
    }
  });
});
