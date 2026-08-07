import { z } from "zod";
import type { IngredientRole } from "./planner";

export const recipeCategories = ["Bread", "Bagels", "Sweet Rolls", "Pastry", "Cookies", "Other"] as const;
export const importConfidenceValues = ["exact", "suggested", "estimated", "missing"] as const;
export const AI_IMPORT_CONSENT_VERSION = "gemini-unpaid-v1-2026-07";

export type ImportConfidence = (typeof importConfidenceValues)[number];
export type RecipeImportSourceType = "manual" | "text" | "url" | "image" | "pdf";
export type RecipeImportProcessingMethod = "manual" | "json_ld" | "ai";

export type IngredientImportDraft = {
  name: string;
  grams: number | null;
  role: IngredientRole;
  packageGrams?: number;
  sourceText: string;
  originalQuantity?: number | null;
  originalUnit?: string;
  conversionNote?: string;
  confidence: ImportConfidence;
};

export type RecipeImportSource = {
  type: RecipeImportSourceType;
  label: string;
  url?: string;
  processingMethod: RecipeImportProcessingMethod;
  aiModel?: string;
  consentVersion?: string;
};

export type RecipeImportDraft = {
  name: string;
  category: string;
  yieldPerBatch: number;
  yieldLabel: string;
  ovenCapacity: number;
  cycleMinutes: number;
  instructions: string;
  notes: string;
  ingredients: IngredientImportDraft[];
  warnings: string[];
  source: RecipeImportSource;
};

export function hasValidAiImportConsent(consent: FormDataEntryValue | null, version: FormDataEntryValue | null) {
  return consent === "true" && version === AI_IMPORT_CONSENT_VERSION;
}

const ingredientRoleSchema = z.enum(["flour", "water", "active_starter", "discard", "inclusion", "other"]);
const importSourceSchema = z.object({
  type: z.enum(["manual", "text", "url", "image", "pdf"]),
  label: z.string().trim().max(240),
  url: z.string().url().max(2000).optional(),
  processingMethod: z.enum(["manual", "json_ld", "ai"]),
  aiModel: z.string().trim().max(120).optional(),
  consentVersion: z.string().trim().max(80).optional(),
});

export const ingredientImportDraftSchema = z.object({
  name: z.string().trim().min(1).max(120),
  grams: z.number().finite().min(0).max(1_000_000).nullable(),
  role: ingredientRoleSchema,
  packageGrams: z.number().finite().positive().max(1_000_000).optional(),
  sourceText: z.string().trim().max(500),
  originalQuantity: z.number().finite().min(0).max(1_000_000).nullable().optional(),
  originalUnit: z.string().trim().max(40).optional(),
  conversionNote: z.string().trim().max(500).optional(),
  confidence: z.enum(importConfidenceValues),
});

export const recipeImportDraftSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(80),
  yieldPerBatch: z.number().finite().positive().max(100_000),
  yieldLabel: z.string().trim().min(1).max(40),
  ovenCapacity: z.number().finite().positive().max(100_000),
  cycleMinutes: z.number().int().positive().max(1440),
  instructions: z.string().max(20_000),
  notes: z.string().max(5000),
  ingredients: z.array(ingredientImportDraftSchema).min(1).max(200),
  warnings: z.array(z.string().trim().min(1).max(500)).max(100),
  source: importSourceSchema,
});

export const confirmedRecipeImportSchema = recipeImportDraftSchema.superRefine((draft, context) => {
  draft.ingredients.forEach((ingredient, index) => {
    if (ingredient.grams === null) {
      context.addIssue({
        code: "custom",
        path: ["ingredients", index, "grams"],
        message: `${ingredient.name} needs a gram amount before saving.`,
      });
    }
  });
});

type UnitDefinition = {
  canonical: string;
  kind: "mass" | "volume";
  grams?: number;
  cups?: number;
};

const units: Record<string, UnitDefinition> = {
  g: { canonical: "g", kind: "mass", grams: 1 },
  gram: { canonical: "g", kind: "mass", grams: 1 },
  grams: { canonical: "g", kind: "mass", grams: 1 },
  kg: { canonical: "kg", kind: "mass", grams: 1000 },
  kilogram: { canonical: "kg", kind: "mass", grams: 1000 },
  kilograms: { canonical: "kg", kind: "mass", grams: 1000 },
  oz: { canonical: "oz", kind: "mass", grams: 28.349523125 },
  ounce: { canonical: "oz", kind: "mass", grams: 28.349523125 },
  ounces: { canonical: "oz", kind: "mass", grams: 28.349523125 },
  lb: { canonical: "lb", kind: "mass", grams: 453.59237 },
  lbs: { canonical: "lb", kind: "mass", grams: 453.59237 },
  pound: { canonical: "lb", kind: "mass", grams: 453.59237 },
  pounds: { canonical: "lb", kind: "mass", grams: 453.59237 },
  cup: { canonical: "cup", kind: "volume", cups: 1 },
  cups: { canonical: "cup", kind: "volume", cups: 1 },
  c: { canonical: "cup", kind: "volume", cups: 1 },
  tbsp: { canonical: "tbsp", kind: "volume", cups: 1 / 16 },
  tablespoon: { canonical: "tbsp", kind: "volume", cups: 1 / 16 },
  tablespoons: { canonical: "tbsp", kind: "volume", cups: 1 / 16 },
  tsp: { canonical: "tsp", kind: "volume", cups: 1 / 48 },
  teaspoon: { canonical: "tsp", kind: "volume", cups: 1 / 48 },
  teaspoons: { canonical: "tsp", kind: "volume", cups: 1 / 48 },
  ml: { canonical: "ml", kind: "volume", cups: 1 / 240 },
  milliliter: { canonical: "ml", kind: "volume", cups: 1 / 240 },
  milliliters: { canonical: "ml", kind: "volume", cups: 1 / 240 },
  millilitre: { canonical: "ml", kind: "volume", cups: 1 / 240 },
  millilitres: { canonical: "ml", kind: "volume", cups: 1 / 240 },
  l: { canonical: "l", kind: "volume", cups: 1000 / 240 },
  liter: { canonical: "l", kind: "volume", cups: 1000 / 240 },
  liters: { canonical: "l", kind: "volume", cups: 1000 / 240 },
  litre: { canonical: "l", kind: "volume", cups: 1000 / 240 },
  litres: { canonical: "l", kind: "volume", cups: 1000 / 240 },
};

const densities: Array<{ pattern: RegExp; gramsPerCup: number; label: string }> = [
  { pattern: /\b(bread|all[- ]purpose|ap|whole[- ]wheat|rye|cake|pastry)?\s*flour\b/i, gramsPerCup: 120, label: "flour" },
  { pattern: /\b(brown sugar)\b/i, gramsPerCup: 220, label: "packed brown sugar" },
  { pattern: /\b(powdered|confectioners?|icing) sugar\b/i, gramsPerCup: 120, label: "powdered sugar" },
  { pattern: /\b(granulated )?sugar\b/i, gramsPerCup: 200, label: "granulated sugar" },
  { pattern: /\bbutter\b/i, gramsPerCup: 227, label: "butter" },
  { pattern: /\b(honey|molasses|maple syrup)\b/i, gramsPerCup: 340, label: "syrup or honey" },
  { pattern: /\b(milk|water|juice)\b/i, gramsPerCup: 240, label: "water-like liquid" },
  { pattern: /\b(oil)\b/i, gramsPerCup: 218, label: "oil" },
  { pattern: /\b(cocoa|cacao) powder\b/i, gramsPerCup: 85, label: "cocoa powder" },
  { pattern: /\b(oats?|rolled oats?)\b/i, gramsPerCup: 90, label: "rolled oats" },
];

const vulgarFractions: Record<string, number> = {
  "¼": 1 / 4,
  "½": 1 / 2,
  "¾": 3 / 4,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅛": 1 / 8,
  "⅜": 3 / 8,
  "⅝": 5 / 8,
  "⅞": 7 / 8,
};

export function parseQuantity(value: string): number | null {
  const input = value.trim();
  if (!input) return null;
  if (vulgarFractions[input] !== undefined) return vulgarFractions[input];
  const vulgar = Object.entries(vulgarFractions).find(([symbol]) => input.endsWith(symbol));
  if (vulgar) {
    const whole = Number(input.slice(0, -1).trim() || "0");
    return Number.isFinite(whole) ? whole + vulgar[1] : null;
  }
  if (/^\d+\s+\d+\/\d+$/.test(input)) {
    const [whole, fraction] = input.split(/\s+/);
    const [numerator, denominator] = fraction.split("/").map(Number);
    return denominator ? Number(whole) + numerator / denominator : null;
  }
  if (/^\d+\/\d+$/.test(input)) {
    const [numerator, denominator] = input.split("/").map(Number);
    return denominator ? numerator / denominator : null;
  }
  const number = Number(input);
  return Number.isFinite(number) ? number : null;
}

export function roleForIngredient(name: string): IngredientRole {
  const value = name.toLocaleLowerCase();
  if (value.includes("discard")) return "discard";
  if (value.includes("starter") || value.includes("levain")) return "active_starter";
  if (value.includes("flour")) return "flour";
  if (/\bwater\b/.test(value)) return "water";
  if (/(chips?|nuts?|raisins?|berries|fruit|seeds?|cheese|chocolate|cinnamon roll filling)/.test(value)) return "inclusion";
  return "other";
}

function cleanIngredientName(value: string) {
  return value
    .replace(/^[,;:\-–—\s]+/, "")
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim()
    .slice(0, 120);
}

export function parseIngredientLine(line: string): IngredientImportDraft {
  const sourceText = line.replace(/^\s*[-*•]\s*/, "").trim().slice(0, 500);
  const match = sourceText.match(/^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?[¼½¾⅓⅔⅛⅜⅝⅞]?|[¼½¾⅓⅔⅛⅜⅝⅞])\s*([A-Za-z]+)?(?:\s+|$)(.+)$/);
  if (!match) {
    const name = cleanIngredientName(sourceText) || "Ingredient";
    return {
      name,
      grams: null,
      role: roleForIngredient(name),
      sourceText,
      confidence: "missing",
      conversionNote: "Enter a gram amount.",
    };
  }

  const quantity = parseQuantity(match[1]);
  const rawUnit = match[2]?.toLocaleLowerCase();
  const name = cleanIngredientName(match[3]) || "Ingredient";
  const unit = rawUnit ? units[rawUnit] : undefined;
  if (quantity === null || !unit) {
    return {
      name,
      grams: null,
      role: roleForIngredient(name),
      sourceText,
      originalQuantity: quantity,
      originalUnit: rawUnit,
      confidence: "missing",
      conversionNote: rawUnit ? `The unit “${rawUnit}” needs a manual gram conversion.` : "Enter a gram amount.",
    };
  }

  if (unit.kind === "mass" && unit.grams) {
    return {
      name,
      grams: roundGrams(quantity * unit.grams),
      role: roleForIngredient(name),
      sourceText,
      originalQuantity: quantity,
      originalUnit: unit.canonical,
      confidence: "exact",
      conversionNote: unit.canonical === "g" ? "Already supplied in grams." : `Converted ${quantity} ${unit.canonical} using a fixed mass conversion.`,
    };
  }

  const density = densities.find((entry) => entry.pattern.test(name));
  if (unit.kind === "volume" && unit.cups && density) {
    return {
      name,
      grams: roundGrams(quantity * unit.cups * density.gramsPerCup),
      role: roleForIngredient(name),
      sourceText,
      originalQuantity: quantity,
      originalUnit: unit.canonical,
      confidence: "suggested",
      conversionNote: `Suggested using ${density.gramsPerCup} g per cup for ${density.label}; verify before saving.`,
    };
  }

  return {
    name,
    grams: null,
    role: roleForIngredient(name),
    sourceText,
    originalQuantity: quantity,
    originalUnit: unit.canonical,
    confidence: "missing",
    conversionNote: `No safe density conversion is available for ${quantity} ${unit.canonical}; enter grams.`,
  };
}

export function parseIngredientLines(input: string) {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^ingredients?:?$/i.test(line))
    .slice(0, 200)
    .map(parseIngredientLine);
}

export function emptyRecipeImportDraft(): RecipeImportDraft {
  return {
    name: "Untitled recipe",
    category: "Other",
    yieldPerBatch: 1,
    yieldLabel: "items",
    ovenCapacity: 1,
    cycleMinutes: 30,
    instructions: "",
    notes: "",
    ingredients: [{
      name: "Ingredient",
      grams: null,
      role: "other",
      sourceText: "",
      confidence: "missing",
      conversionNote: "Enter a gram amount.",
    }],
    warnings: ["Confirm the yield, oven capacity, cycle time, and every ingredient amount before saving."],
    source: { type: "manual", label: "Guided manual import", processingMethod: "manual" },
  };
}

export function withDraftWarnings(draft: RecipeImportDraft): RecipeImportDraft {
  const warnings = new Set(draft.warnings.filter(Boolean));
  const missing = draft.ingredients.filter((ingredient) => ingredient.grams === null);
  const estimates = draft.ingredients.filter((ingredient) => ingredient.confidence === "estimated");
  const suggestions = draft.ingredients.filter((ingredient) => ingredient.confidence === "suggested");
  if (missing.length) warnings.add(`${missing.length} ingredient${missing.length === 1 ? "" : "s"} still need gram amounts.`);
  if (estimates.length) warnings.add(`${estimates.length} AI-estimated conversion${estimates.length === 1 ? "" : "s"} require review.`);
  if (suggestions.length) warnings.add(`${suggestions.length} density-based conversion${suggestions.length === 1 ? "" : "s"} should be verified.`);
  return { ...draft, warnings: [...warnings].slice(0, 100) };
}

export function mapRecipeCategory(value: string | undefined | null) {
  const input = value?.toLocaleLowerCase() ?? "";
  if (input.includes("bagel")) return "Bagels";
  if (input.includes("cookie") || input.includes("biscuit")) return "Cookies";
  if (input.includes("sweet roll") || input.includes("cinnamon roll")) return "Sweet Rolls";
  if (input.includes("pastry") || input.includes("croissant") || input.includes("danish")) return "Pastry";
  if (input.includes("bread") || input.includes("loaf") || input.includes("sourdough")) return "Bread";
  return "Other";
}

export function roundGrams(value: number) {
  return Math.round(value * 10) / 10;
}
