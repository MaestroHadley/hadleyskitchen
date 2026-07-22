export type IngredientRole = "flour" | "water" | "active_starter" | "discard" | "inclusion" | "other";

export type Ingredient = {
  id?: string;
  name: string;
  grams: number;
  role: IngredientRole;
  packageGrams?: number;
  sortOrder?: number;
};

export type Recipe = {
  id: string;
  name: string;
  category: string;
  yieldPerBatch: number;
  yieldLabel: string;
  ovenCapacity: number;
  cycleMinutes: number;
  notes?: string;
  isFavorite?: boolean;
  archivedAt?: string | null;
  version?: number;
  updatedAt?: string;
  ingredients: Ingredient[];
};

export type EventItem = {
  id?: string;
  recipeId: string;
  target: number;
  policy: "whole" | "exact";
};

export type PlannerSettings = {
  starterHydration: number;
  shoppingBuffer: number;
  starterSeedParts?: number;
  starterFlourParts?: number;
  starterWaterParts?: number;
};

export type ScheduleBlock = {
  id?: string;
  dayLabel: string;
  title: string;
  notes: string;
  sortOrder: number;
};

export type PlannerEvent = {
  id: string;
  name: string;
  eventAt: string | null;
  status: "draft" | "finalized" | "archived";
  shoppingBuffer: number;
  starterHydration: number;
  items: EventItem[];
  schedule: ScheduleBlock[];
  createdAt?: string;
  updatedAt?: string;
};

export function batchesFor(recipe: Recipe, item: EventItem) {
  if (item.target <= 0 || recipe.yieldPerBatch <= 0) return 0;
  const raw = item.target / recipe.yieldPerBatch;
  return item.policy === "whole" ? Math.ceil(raw) : raw;
}

export function recipeHydration(recipe: Recipe, starterHydration: number) {
  const directWater = recipe.ingredients.filter((item) => item.role === "water").reduce((sum, item) => sum + item.grams, 0);
  const directFlour = recipe.ingredients.filter((item) => item.role === "flour").reduce((sum, item) => sum + item.grams, 0);
  const activeStarter = recipe.ingredients.filter((item) => item.role === "active_starter").reduce((sum, item) => sum + item.grams, 0);
  const starterFlour = activeStarter / (1 + starterHydration);
  const starterWater = activeStarter - starterFlour;
  return directFlour + starterFlour > 0 ? (directWater + starterWater) / (directFlour + starterFlour) : 0;
}

export function calculatePlan(recipes: Recipe[], items: EventItem[], settings: PlannerSettings) {
  const recipeMap = new Map(recipes.map((recipe) => [recipe.id, recipe]));
  let directFlour = 0;
  let activeStarter = 0;
  let discard = 0;
  let totalBatches = 0;
  let totalProducts = 0;
  let ovenMinutes = 0;
  const shopping = new Map<string, { name: string; exact: number; packageGrams?: number }>();

  const production = items.flatMap((item) => {
    const recipe = recipeMap.get(item.recipeId);
    if (!recipe || item.target <= 0) return [];
    const batches = batchesFor(recipe, item);
    const planned = batches * recipe.yieldPerBatch;
    totalBatches += batches;
    totalProducts += item.target;
    ovenMinutes += Math.ceil(item.target / recipe.ovenCapacity) * recipe.cycleMinutes;

    for (const ingredient of recipe.ingredients) {
      const exact = ingredient.grams * batches;
      if (ingredient.role === "flour") directFlour += exact;
      if (ingredient.role === "active_starter") activeStarter += exact;
      if (ingredient.role === "discard") discard += exact;
      if (ingredient.role !== "active_starter" && ingredient.role !== "discard") {
        const key = ingredient.name.trim().toLocaleLowerCase();
        const existing = shopping.get(key);
        shopping.set(key, {
          name: ingredient.name.trim(),
          exact: (existing?.exact ?? 0) + exact,
          packageGrams: ingredient.packageGrams ?? existing?.packageGrams,
        });
      }
    }

    return [{ recipe, target: item.target, batches, planned, overage: planned - item.target }];
  });

  const starterFlour = activeStarter / (1 + settings.starterHydration);
  const starterWater = activeStarter - starterFlour;
  const totalExactFlour = directFlour + starterFlour;
  const flourRows = [...shopping.values()].filter((row) => row.name.toLocaleLowerCase().includes("flour"));
  const starterFeedRow = flourRows.find((row) => row.name.toLocaleLowerCase().includes("organic ap")) ?? flourRows[0];
  if (starterFeedRow) starterFeedRow.exact += starterFlour;

  const shoppingRows = [...shopping.values()]
    .map((row) => {
      const buffered = row.exact * (1 + settings.shoppingBuffer);
      return { ...row, buffered, packages: row.packageGrams ? Math.ceil(buffered / row.packageGrams) : null };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const seedParts = settings.starterSeedParts ?? 1;
  const flourParts = settings.starterFlourParts ?? 2;
  const waterParts = settings.starterWaterParts ?? 2;
  const buildTarget = activeStarter * (1 + settings.shoppingBuffer);
  const totalParts = seedParts + flourParts + waterParts;

  return {
    production,
    totalProducts,
    totalBatches,
    directFlour,
    activeStarter,
    discard,
    starterFlour,
    starterWater,
    totalExactFlour,
    totalBufferedFlour: totalExactFlour * (1 + settings.shoppingBuffer),
    starterBuild: {
      target: buildTarget,
      seed: totalParts ? buildTarget * seedParts / totalParts : 0,
      flour: totalParts ? buildTarget * flourParts / totalParts : 0,
      water: totalParts ? buildTarget * waterParts / totalParts : 0,
    },
    ovenMinutes,
    shopping: shoppingRows,
  };
}

export const formatGrams = (grams: number) => grams >= 1000
  ? `${(grams / 1000).toFixed(1)} kg`
  : `${Math.round(grams).toLocaleString()} g`;

export const formatBatches = (value: number) => Number.isInteger(value)
  ? String(value)
  : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
