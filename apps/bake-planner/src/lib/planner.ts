export type IngredientRole = "flour" | "water" | "active_starter" | "discard" | "inclusion" | "other";

export type Ingredient = {
  name: string;
  grams: number;
  role: IngredientRole;
  packageGrams?: number;
};

export type Recipe = {
  id: string;
  name: string;
  category: string;
  yieldPerBatch: number;
  yieldLabel: string;
  mixerDoughGrams: number;
  ovenCapacity: number;
  cycleMinutes: number;
  ingredients: Ingredient[];
};

export type EventItem = {
  recipeId: string;
  target: number;
  policy: "whole" | "exact";
};

export type PlannerSettings = {
  starterHydration: number;
  shoppingBuffer: number;
  packagingBuffer: number;
  mixerCapacityGrams: number;
};

export type MixerAssignment = { load: number; recipeId: string; units: number };

export function batchesFor(recipe: Recipe, item: EventItem) {
  if (item.target <= 0 || recipe.yieldPerBatch <= 0) return 0;
  const raw = item.target / recipe.yieldPerBatch;
  return item.policy === "whole" ? Math.ceil(raw) : raw;
}

export function calculatePlan(
  recipes: Recipe[],
  items: EventItem[],
  settings: PlannerSettings,
  mixerAssignments: MixerAssignment[] = [],
) {
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
      const amount = ingredient.grams * batches;
      if (ingredient.role === "flour") directFlour += amount;
      if (ingredient.role === "active_starter") activeStarter += amount;
      if (ingredient.role === "discard") discard += amount;
      if (ingredient.role !== "water" && ingredient.role !== "active_starter" && ingredient.role !== "discard") {
        const current = shopping.get(ingredient.name) ?? { name: ingredient.name, exact: 0, packageGrams: ingredient.packageGrams };
        current.exact += amount;
        if (ingredient.packageGrams) current.packageGrams = ingredient.packageGrams;
        shopping.set(ingredient.name, current);
      }
    }
    return [{ recipe, target: item.target, batches, planned, overage: planned - item.target }];
  });

  const starterFlour = activeStarter / (1 + settings.starterHydration);
  const totalExactFlour = directFlour + starterFlour;
  const starterFlourName = "Organic AP Flour";
  const flourRow = shopping.get(starterFlourName);
  if (flourRow) flourRow.exact += starterFlour;

  const shoppingRows = [...shopping.values()].map((row) => {
    const buffered = row.exact * (1 + settings.shoppingBuffer);
    return { ...row, buffered, packages: row.packageGrams ? Math.ceil(buffered / row.packageGrams) : null };
  });

  const loadTotals = new Map<number, number>();
  for (const assignment of mixerAssignments) {
    const recipe = recipeMap.get(assignment.recipeId);
    if (!recipe) continue;
    const weight = (assignment.units / recipe.yieldPerBatch) * recipe.mixerDoughGrams;
    loadTotals.set(assignment.load, (loadTotals.get(assignment.load) ?? 0) + weight);
  }

  return {
    production,
    totalProducts,
    totalBatches,
    directFlour,
    activeStarter,
    discard,
    starterFlour,
    totalExactFlour,
    totalBufferedFlour: totalExactFlour * (1 + settings.shoppingBuffer),
    ovenMinutes,
    shopping: shoppingRows,
    mixerLoads: [...loadTotals].map(([load, grams]) => ({
      load,
      grams,
      capacity: grams / settings.mixerCapacityGrams,
      overCapacity: grams > settings.mixerCapacityGrams,
    })),
  };
}

export const formatGrams = (grams: number) =>
  grams >= 1000 ? `${(grams / 1000).toFixed(1)} kg` : `${Math.round(grams).toLocaleString()} g`;
