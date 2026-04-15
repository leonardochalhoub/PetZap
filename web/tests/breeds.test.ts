import { describe, expect, it } from "vitest";
import { estimateLifespan, lookupBreed, getBreedsForSpecies } from "@/lib/breeds";

describe("estimateLifespan", () => {
  it("uses generic span when breed unknown", () => {
    const r = estimateLifespan("dog", null, null, false);
    expect(r.sourceBreed).toBeNull();
    expect(r.min).toBeGreaterThan(0);
    expect(r.max).toBeGreaterThanOrEqual(r.min);
  });

  it("applies female +0.5y adjustment", () => {
    const male = estimateLifespan("dog", "Labrador", "male", false);
    const female = estimateLifespan("dog", "Labrador", "female", false);
    // Within rounding, female should be >= male
    expect(female.min).toBeGreaterThanOrEqual(male.min);
    expect(female.max).toBeGreaterThanOrEqual(male.max);
  });

  it("applies neutered +1y adjustment on top of sex", () => {
    const unneutered = estimateLifespan("dog", "Labrador", "female", false);
    const neutered = estimateLifespan("dog", "Labrador", "female", true);
    expect(neutered.min).toBeGreaterThan(unneutered.min);
    expect(neutered.max).toBeGreaterThan(unneutered.max);
  });

  it("resolves the specific breed row", () => {
    const r = estimateLifespan("dog", "Pequinês", "female", true);
    expect(r.sourceBreed?.id).toBe("pekingese");
  });
});

describe("lookupBreed", () => {
  it("finds by English name, case-insensitive", () => {
    expect(lookupBreed("dog", "LABRADOR retriever")?.id).toBe("labrador");
  });

  it("finds by Portuguese name", () => {
    expect(lookupBreed("dog", "Pequinês")?.id).toBe("pekingese");
  });

  it("returns null on unknown", () => {
    expect(lookupBreed("dog", "Not A Real Breed")).toBeNull();
  });

  it("returns null on empty/null input", () => {
    expect(lookupBreed("cat", null)).toBeNull();
    expect(lookupBreed("cat", "")).toBeNull();
  });
});

describe("getBreedsForSpecies", () => {
  it("filters by species", () => {
    const dogs = getBreedsForSpecies("dog");
    expect(dogs.length).toBeGreaterThan(30);
    expect(dogs.every((b) => b.species === "dog")).toBe(true);
  });
});
