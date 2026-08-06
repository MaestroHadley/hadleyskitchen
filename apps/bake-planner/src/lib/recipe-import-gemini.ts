import {
  mapRecipeCategory,
  parseIngredientLine,
  recipeImportDraftSchema,
  roundGrams,
  withDraftWarnings,
  AI_IMPORT_CONSENT_VERSION,
  type IngredientImportDraft,
  type RecipeImportDraft,
  type RecipeImportSource,
} from "./recipe-import";

const DEFAULT_MODEL = "gemini-3.5-flash";

type GeminiPart = { text: string } | { inline_data: { mime_type: string; data: string } };

type RawIngredient = {
  name: string;
  originalQuantity: number | null;
  originalUnit: string;
  sourceText: string;
  suggestedGrams: number | null;
  role: IngredientImportDraft["role"];
};

type RawRecipe = {
  name: string;
  category: string;
  yieldPerBatch: number;
  yieldLabel: string;
  ovenCapacity: number;
  cycleMinutes: number;
  instructions: string;
  notes: string;
  ingredients: RawIngredient[];
  warnings: string[];
};

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  error?: { code?: number; message?: string; status?: string };
};

export class RecipeImportAiError extends Error {
  constructor(message: string, readonly kind: "disabled" | "quota" | "invalid" | "unavailable") {
    super(message);
  }
}

export function isRecipeImportAiEnabled() {
  return process.env.RECIPE_IMPORT_AI_ENABLED === "true" && Boolean(process.env.GEMINI_API_KEY);
}

export function recipeImportAiModel() {
  return process.env.GEMINI_RECIPE_IMPORT_MODEL?.trim() || DEFAULT_MODEL;
}

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    recipes: {
      type: "array",
      minItems: 1,
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string", description: "Recipe name." },
          category: { type: "string", description: "One of Bread, Bagels, Sweet Rolls, Pastry, Cookies, or Other." },
          yieldPerBatch: { type: "number", minimum: 0.01, description: "Numeric amount produced by one batch. Use 1 only when absent and add a warning." },
          yieldLabel: { type: "string", description: "Yield unit such as loaves, cookies, or items." },
          ovenCapacity: { type: "number", minimum: 1, description: "Items that fit in one oven cycle. Use 1 only when absent and add a warning." },
          cycleMinutes: { type: "integer", minimum: 1, maximum: 1440, description: "Explicit bake cycle minutes. Use 30 only when absent and add a warning." },
          instructions: { type: "string", description: "Recipe directions in source order, with concise line breaks." },
          notes: { type: "string", description: "Useful description, proofing, pan, temperature, or preparation notes not already in instructions." },
          ingredients: {
            type: "array",
            minItems: 1,
            maxItems: 200,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                name: { type: "string", description: "Ingredient name without quantity or preparation note." },
                originalQuantity: { type: ["number", "null"], description: "Numeric quantity from the source, or null." },
                originalUnit: { type: "string", description: "Unit exactly as supplied, or an empty string." },
                sourceText: { type: "string", description: "Original ingredient line." },
                suggestedGrams: { type: ["number", "null"], description: "Gram amount from the source or a cautious ingredient-specific estimate. Null when unsafe." },
                role: { type: "string", enum: ["flour", "water", "active_starter", "discard", "inclusion", "other"] },
              },
              required: ["name", "originalQuantity", "originalUnit", "sourceText", "suggestedGrams", "role"],
            },
          },
          warnings: { type: "array", maxItems: 100, items: { type: "string" }, description: "Every assumption, ambiguity, missing value, or estimate." },
        },
        required: ["name", "category", "yieldPerBatch", "yieldLabel", "ovenCapacity", "cycleMinutes", "instructions", "notes", "ingredients", "warnings"],
      },
    },
  },
  required: ["recipes"],
} as const;

const prompt = `Extract every distinct baking recipe from the supplied content.
This is a production planner, so accuracy matters more than filling every field.
- Preserve original ingredient lines and source order.
- Never invent an ingredient.
- Use null for an unsafe gram estimate.
- Label every inferred yield, time, capacity, role, or conversion in warnings.
- Suggested grams for volume or count units are estimates, not facts.
- Keep instructions faithful and concise.
- Map category to Bread, Bagels, Sweet Rolls, Pastry, Cookies, or Other.
- Distinguish active starter/levain from sourdough discard.
- Do not include commentary outside the JSON response.`;

function normalizeIngredient(raw: RawIngredient): IngredientImportDraft {
  const deterministic = parseIngredientLine(raw.sourceText || `${raw.originalQuantity ?? ""} ${raw.originalUnit} ${raw.name}`);
  if (deterministic.grams !== null) return { ...deterministic, name: raw.name.trim().slice(0, 120), role: raw.role };
  const suggested = typeof raw.suggestedGrams === "number" && Number.isFinite(raw.suggestedGrams) && raw.suggestedGrams >= 0
    ? roundGrams(raw.suggestedGrams)
    : null;
  return {
    ...deterministic,
    name: raw.name.trim().slice(0, 120),
    role: raw.role,
    grams: suggested,
    originalQuantity: raw.originalQuantity,
    originalUnit: raw.originalUnit.trim().slice(0, 40),
    sourceText: raw.sourceText.trim().slice(0, 500),
    confidence: suggested === null ? "missing" : "estimated",
    conversionNote: suggested === null
      ? "Gemini could not provide a safe conversion; enter grams."
      : "Gemini estimated this amount. Verify it before saving.",
  };
}

function normalizeRecipe(raw: RawRecipe, source: RecipeImportSource): RecipeImportDraft {
  return withDraftWarnings(recipeImportDraftSchema.parse({
    name: raw.name.trim().slice(0, 120) || "Imported recipe",
    category: mapRecipeCategory(raw.category),
    yieldPerBatch: Math.max(0.01, raw.yieldPerBatch || 1),
    yieldLabel: raw.yieldLabel.trim().slice(0, 40) || "items",
    ovenCapacity: Math.max(1, raw.ovenCapacity || 1),
    cycleMinutes: Math.max(1, Math.min(1440, Math.round(raw.cycleMinutes || 30))),
    instructions: raw.instructions.slice(0, 20_000),
    notes: raw.notes.slice(0, 5000),
    ingredients: raw.ingredients.slice(0, 200).map(normalizeIngredient),
    warnings: raw.warnings.filter(Boolean).slice(0, 100),
    source,
  }));
}

export async function extractRecipesWithGemini(parts: GeminiPart[], source: Omit<RecipeImportSource, "processingMethod" | "aiModel" | "consentVersion">) {
  if (!isRecipeImportAiEnabled()) {
    throw new RecipeImportAiError("Free AI import is not configured right now. Continue with guided manual import.", "disabled");
  }
  const apiKey = process.env.GEMINI_API_KEY!;
  const model = recipeImportAiModel();
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }, ...parts] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 8192,
        responseFormat: {
          text: {
            mimeType: "application/json",
            schema: responseSchema,
          },
        },
      },
    }),
    signal: AbortSignal.timeout(25_000),
  }).catch((error: unknown) => {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new RecipeImportAiError("Free AI import timed out. Your content was not saved; continue manually.", "unavailable");
    }
    throw new RecipeImportAiError("Free AI import is temporarily unavailable. Continue manually.", "unavailable");
  });

  const body = await response.json().catch(() => ({})) as GeminiResponse;
  if (!response.ok) {
    const quota = response.status === 429 || body.error?.status === "RESOURCE_EXHAUSTED";
    throw new RecipeImportAiError(
      quota ? "The free AI allowance is currently exhausted. Continue with guided manual import." : "Google AI could not process this import. Continue manually.",
      quota ? "quota" : "unavailable",
    );
  }
  const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!text) throw new RecipeImportAiError("Google AI did not return a usable recipe. Continue manually.", "invalid");
  let parsed: { recipes?: RawRecipe[] };
  try {
    parsed = JSON.parse(text) as { recipes?: RawRecipe[] };
  } catch {
    throw new RecipeImportAiError("Google AI returned an unreadable recipe. Continue manually.", "invalid");
  }
  if (!Array.isArray(parsed.recipes) || !parsed.recipes.length) {
    throw new RecipeImportAiError("No recipe was detected. Continue manually or try clearer source material.", "invalid");
  }
  const provenance: RecipeImportSource = {
    ...source,
    processingMethod: "ai",
    aiModel: model,
    consentVersion: AI_IMPORT_CONSENT_VERSION,
  };
  try {
    return parsed.recipes.slice(0, 10).map((recipe) => normalizeRecipe(recipe, provenance));
  } catch {
    throw new RecipeImportAiError("The extracted recipe did not pass safety validation. Continue manually.", "invalid");
  }
}
