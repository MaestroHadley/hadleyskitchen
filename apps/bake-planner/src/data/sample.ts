import type { EventItem, MixerAssignment, PlannerSettings, Recipe } from "@/lib/planner";

const breadBase = (water: number) => [
  { name: "Organic AP Flour", grams: 1105, role: "flour" as const, packageGrams: 9071.8474 },
  { name: "Water", grams: water, role: "water" as const },
  { name: "Active starter", grams: 332, role: "active_starter" as const },
  { name: "Fine sea salt", grams: 22, role: "other" as const },
  { name: "Honey", grams: 22, role: "other" as const },
];

const bagelBase = [
  { name: "Organic AP Flour", grams: 1500, role: "flour" as const, packageGrams: 9071.8474 },
  { name: "Water", grams: 750, role: "water" as const },
  { name: "Sourdough discard", grams: 300, role: "discard" as const },
  { name: "Granulated sugar", grams: 120, role: "other" as const },
  { name: "Instant yeast", grams: 21, role: "other" as const },
  { name: "Fine sea salt", grams: 33, role: "other" as const },
  { name: "Honey", grams: 24, role: "other" as const },
];

export const sampleRecipes: Recipe[] = [
  { id: "plain", name: "Plain Sourdough", category: "Bread", yieldPerBatch: 2, yieldLabel: "loaves", mixerDoughGrams: 2186, ovenCapacity: 6, cycleMinutes: 45, ingredients: breadBase(705) },
  { id: "jalapeno", name: "Jalapeño Cheddar", category: "Bread", yieldPerBatch: 2, yieldLabel: "loaves", mixerDoughGrams: 2171, ovenCapacity: 6, cycleMinutes: 45, ingredients: [...breadBase(690), { name: "Sharp cheddar", grams: 220, role: "inclusion", packageGrams: 2268 }, { name: "Dried jalapeño", grams: 90, role: "inclusion" }] },
  { id: "garlic", name: "Roasted Garlic", category: "Bread", yieldPerBatch: 2, yieldLabel: "loaves", mixerDoughGrams: 2171, ovenCapacity: 6, cycleMinutes: 45, ingredients: [...breadBase(690), { name: "Roasted garlic", grams: 130, role: "inclusion" }] },
  { id: "mage", name: "Mage’s Loaf", category: "Bread", yieldPerBatch: 2, yieldLabel: "loaves", mixerDoughGrams: 2186, ovenCapacity: 6, cycleMinutes: 45, ingredients: [...breadBase(705), { name: "Sharp cheddar", grams: 190, role: "inclusion", packageGrams: 2268 }, { name: "Roasted garlic", grams: 130, role: "inclusion" }, { name: "Rosemary", grams: 40, role: "inclusion" }] },
  { id: "bagel-plain", name: "Plain Discard Bagels", category: "Bagels", yieldPerBatch: 12, yieldLabel: "bagels", mixerDoughGrams: 2824, ovenCapacity: 18, cycleMinutes: 35, ingredients: bagelBase },
  { id: "bagel-cheddar", name: "Cheddar Discard Bagels", category: "Bagels", yieldPerBatch: 12, yieldLabel: "bagels", mixerDoughGrams: 2824, ovenCapacity: 18, cycleMinutes: 35, ingredients: [...bagelBase, { name: "Sharp cheddar", grams: 300, role: "inclusion", packageGrams: 2268 }] },
  { id: "bagel-jalapeno", name: "Jalapeño Cheddar Bagels", category: "Bagels", yieldPerBatch: 12, yieldLabel: "bagels", mixerDoughGrams: 2824, ovenCapacity: 18, cycleMinutes: 35, ingredients: [...bagelBase, { name: "Sharp cheddar", grams: 300, role: "inclusion", packageGrams: 2268 }, { name: "Dried jalapeño", grams: 60, role: "inclusion" }] },
  { id: "bagel-everything", name: "Everything Bagels", category: "Bagels", yieldPerBatch: 12, yieldLabel: "bagels", mixerDoughGrams: 2824, ovenCapacity: 18, cycleMinutes: 35, ingredients: [...bagelBase, { name: "Everything seasoning", grams: 50, role: "inclusion" }] },
  { id: "rolls", name: "Browned Butter Cinnamon Rolls", category: "Sweet Rolls", yieldPerBatch: 30, yieldLabel: "rolls", mixerDoughGrams: 4992, ovenCapacity: 16, cycleMinutes: 35, ingredients: [
    { name: "Bread flour", grams: 2160, role: "flour", packageGrams: 2267.96185 },
    { name: "Buttermilk", grams: 540, role: "other" }, { name: "Granulated sugar", grams: 440, role: "other" },
    { name: "Active dry yeast", grams: 30, role: "other" }, { name: "Sour cream", grams: 480, role: "other" },
    { name: "Salted butter", grams: 452, role: "other" }, { name: "Eggs", grams: 400, role: "other" },
    { name: "Vanilla", grams: 40, role: "other" }, { name: "Fine sea salt", grams: 39, role: "other" },
    { name: "Sourdough discard", grams: 400, role: "discard" }, { name: "Unsalted butter", grams: 904, role: "other" },
    { name: "Brown sugar", grams: 1440, role: "other" }, { name: "Ground cinnamon", grams: 72, role: "other" },
    { name: "Heavy cream", grams: 480, role: "other" },
  ] },
];

export const sampleEvent: EventItem[] = [
  { recipeId: "plain", target: 18, policy: "whole" }, { recipeId: "jalapeno", target: 16, policy: "whole" },
  { recipeId: "garlic", target: 16, policy: "whole" }, { recipeId: "mage", target: 12, policy: "whole" },
  { recipeId: "bagel-plain", target: 12, policy: "exact" }, { recipeId: "bagel-cheddar", target: 20, policy: "exact" },
  { recipeId: "bagel-jalapeno", target: 24, policy: "exact" }, { recipeId: "bagel-everything", target: 16, policy: "exact" },
  { recipeId: "rolls", target: 30, policy: "whole" },
];

export const sampleSettings: PlannerSettings = { starterHydration: 1, shoppingBuffer: 0.1, packagingBuffer: 0.1, mixerCapacityGrams: 19050 };
export const sampleMixer: MixerAssignment[] = [
  { load: 1, recipeId: "plain", units: 14 }, { load: 2, recipeId: "plain", units: 4 },
  { load: 2, recipeId: "mage", units: 12 }, { load: 3, recipeId: "jalapeno", units: 16 },
  { load: 4, recipeId: "garlic", units: 16 },
];
