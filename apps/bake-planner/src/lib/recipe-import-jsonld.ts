import {
  mapRecipeCategory,
  parseIngredientLine,
  withDraftWarnings,
  type RecipeImportDraft,
} from "./recipe-import";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function includesRecipeType(value: unknown) {
  if (typeof value === "string") return value.toLocaleLowerCase() === "recipe";
  return Array.isArray(value) && value.some(includesRecipeType);
}

function collectRecipes(value: unknown, recipes: JsonRecord[]) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectRecipes(item, recipes));
    return;
  }
  if (!isRecord(value)) return;
  if (includesRecipeType(value["@type"])) recipes.push(value);
  if (value["@graph"]) collectRecipes(value["@graph"], recipes);
}

function parseJsonLdScripts(html: string) {
  const values: unknown[] = [];
  const expression = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(expression)) {
    const source = match[1].trim();
    if (!source) continue;
    try {
      values.push(JSON.parse(source));
    } catch {
      // Invalid third-party JSON-LD is ignored and may fall back to AI.
    }
  }
  return values;
}

function textValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join("\n");
  if (!isRecord(value)) return "";
  return textValue(value.text ?? value.name ?? value.value);
}

function instructionLines(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(instructionLines);
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (!isRecord(value)) return [];
  if (value.itemListElement) return instructionLines(value.itemListElement);
  const text = textValue(value.text ?? value.name);
  return text ? [text] : [];
}

function parseDurationMinutes(value: unknown) {
  if (typeof value !== "string") return null;
  const match = value.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!match) return null;
  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  const total = days * 1440 + hours * 60 + minutes;
  return total > 0 ? Math.min(total, 1440) : null;
}

function parseYield(value: unknown) {
  const source = Array.isArray(value) ? textValue(value[0]) : textValue(value);
  const match = source.match(/(\d+(?:\.\d+)?)\s*(.*)/);
  if (!match) return { amount: 1, label: source || "items", warning: "The source did not provide a numeric yield; confirm the default." };
  return {
    amount: Math.max(0.01, Number(match[1])),
    label: (match[2].trim() || "items").slice(0, 40),
    warning: "",
  };
}

function ingredientStrings(value: unknown) {
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean);
  const text = textValue(value);
  return text ? [text] : [];
}

export function recipeDraftsFromJsonLd(html: string, sourceUrl: string): RecipeImportDraft[] {
  const recipes: JsonRecord[] = [];
  parseJsonLdScripts(html).forEach((value) => collectRecipes(value, recipes));
  return recipes.slice(0, 10).flatMap((recipe) => {
    const ingredientLines = ingredientStrings(recipe.recipeIngredient ?? recipe.ingredients);
    if (!ingredientLines.length) return [];
    const parsedYield = parseYield(recipe.recipeYield ?? recipe.yield);
    const cycleMinutes = parseDurationMinutes(recipe.cookTime) ?? 30;
    const warnings = [
      parsedYield.warning,
      !recipe.cookTime ? "No cook time was found; confirm the 30-minute cycle time." : "",
      "Confirm oven capacity before saving.",
    ].filter(Boolean);
    return [withDraftWarnings({
      name: (textValue(recipe.name) || "Imported recipe").slice(0, 120),
      category: mapRecipeCategory(textValue(recipe.recipeCategory)),
      yieldPerBatch: parsedYield.amount,
      yieldLabel: parsedYield.label,
      ovenCapacity: 1,
      cycleMinutes,
      instructions: instructionLines(recipe.recipeInstructions).join("\n\n").slice(0, 20_000),
      notes: textValue(recipe.description).slice(0, 5000),
      ingredients: ingredientLines.map(parseIngredientLine),
      warnings,
      source: {
        type: "url",
        label: new URL(sourceUrl).hostname,
        url: sourceUrl,
        processingMethod: "json_ld",
      },
    })];
  });
}

export function stripHtmlForRecipeImport(html: string) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50_000);
}
