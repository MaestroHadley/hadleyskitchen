import { describe, expect, it } from "vitest";
import {
  AI_IMPORT_CONSENT_VERSION,
  confirmedRecipeImportSchema,
  emptyRecipeImportDraft,
  hasValidAiImportConsent,
  parseIngredientLine,
  parseIngredientLines,
  parseQuantity,
} from "./recipe-import";

describe("recipe import quantities and conversions", () => {
  it("parses decimal, fractional, mixed, and vulgar quantities", () => {
    expect(parseQuantity("2.5")).toBe(2.5);
    expect(parseQuantity("3/4")).toBe(0.75);
    expect(parseQuantity("1 1/2")).toBe(1.5);
    expect(parseQuantity("½")).toBe(0.5);
  });

  it("converts mass units deterministically", () => {
    expect(parseIngredientLine("500 g bread flour")).toMatchObject({ name: "bread flour", grams: 500, role: "flour", confidence: "exact" });
    expect(parseIngredientLine("2 lb butter")).toMatchObject({ name: "butter", grams: 907.2, confidence: "exact" });
    expect(parseIngredientLine("12 oz water")).toMatchObject({ name: "water", grams: 340.2, role: "water", confidence: "exact" });
  });

  it("suggests known density conversions and leaves unknowns unresolved", () => {
    expect(parseIngredientLine("1 1/2 cups flour")).toMatchObject({ grams: 180, confidence: "suggested" });
    expect(parseIngredientLine("1 cup sugar")).toMatchObject({ grams: 200, confidence: "suggested" });
    expect(parseIngredientLine("2 eggs")).toMatchObject({ name: "eggs", grams: null, confidence: "missing" });
  });

  it("parses a paste without turning the Ingredients heading into a row", () => {
    expect(parseIngredientLines("Ingredients:\n500 g flour\n300 g water")).toHaveLength(2);
  });
});

describe("recipe import safety gates", () => {
  it("accepts only the current explicit AI disclosure", () => {
    expect(hasValidAiImportConsent("true", AI_IMPORT_CONSENT_VERSION)).toBe(true);
    expect(hasValidAiImportConsent("false", AI_IMPORT_CONSENT_VERSION)).toBe(false);
    expect(hasValidAiImportConsent("true", "old-copy")).toBe(false);
  });

  it("blocks saving until every ingredient has grams", () => {
    const draft = emptyRecipeImportDraft();
    expect(confirmedRecipeImportSchema.safeParse(draft).success).toBe(false);
    draft.ingredients[0] = { ...draft.ingredients[0], name: "Flour", grams: 500, confidence: "exact" };
    expect(confirmedRecipeImportSchema.safeParse(draft).success).toBe(true);
  });
});
