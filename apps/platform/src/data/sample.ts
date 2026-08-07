import type { EventItem, PlannerEvent, PlannerSettings, Recipe, ScheduleBlock } from "@/lib/planner";

const bread = (id: string, name: string, water: number, additions: Recipe["ingredients"] = []): Recipe => ({
  id,
  name,
  category: "Bread",
  yieldPerBatch: 2,
  yieldLabel: "loaves",
  ovenCapacity: 6,
  cycleMinutes: 45,
  version: 1,
  updatedAt: "2026-07-22T12:00:00.000Z",
  ingredients: [
    { name: "Organic AP Flour", grams: 1105, role: "flour", packageGrams: 9071.8474 },
    { name: "Water", grams: water, role: "water" },
    { name: "Active starter", grams: 332, role: "active_starter" },
    { name: "Fine sea salt", grams: 22, role: "other" },
    { name: "Honey", grams: 22, role: "other" },
    ...additions,
  ],
});

const bagel = (id: string, name: string, additions: Recipe["ingredients"] = []): Recipe => ({
  id,
  name,
  category: "Bagels",
  yieldPerBatch: 12,
  yieldLabel: "bagels",
  ovenCapacity: 18,
  cycleMinutes: 35,
  version: 1,
  updatedAt: "2026-07-21T12:00:00.000Z",
  ingredients: [
    { name: "Organic AP Flour", grams: 1500, role: "flour", packageGrams: 9071.8474 },
    { name: "Water", grams: 750, role: "water" },
    { name: "Sourdough discard", grams: 300, role: "discard" },
    { name: "Granulated sugar", grams: 120, role: "other" },
    { name: "Instant yeast", grams: 21, role: "other" },
    { name: "Fine sea salt", grams: 33, role: "other" },
    { name: "Honey", grams: 24, role: "other" },
    ...additions,
  ],
});

export const sampleRecipes: Recipe[] = [
  { ...bread("plain", "Plain Sourdough", 705), isFavorite: true },
  bread("jalapeno", "Jalapeño Cheddar", 690, [{ name: "Sharp cheddar", grams: 220, role: "inclusion" }, { name: "Dried jalapeño", grams: 90, role: "inclusion" }]),
  bread("garlic", "Roasted Garlic", 690, [{ name: "Roasted garlic", grams: 130, role: "inclusion" }]),
  bread("mage", "Mage’s Loaf", 705, [{ name: "Sharp cheddar", grams: 190, role: "inclusion" }, { name: "Roasted garlic", grams: 130, role: "inclusion" }, { name: "Rosemary", grams: 40, role: "inclusion" }]),
  bagel("plain-bagel", "Plain Discard Bagels"),
  bagel("cheddar-bagel", "Cheddar Discard Bagels", [{ name: "Sharp cheddar", grams: 300, role: "inclusion" }]),
  bagel("jalapeno-bagel", "Jalapeño Cheddar Bagels", [{ name: "Sharp cheddar", grams: 300, role: "inclusion" }, { name: "Dried jalapeño", grams: 60, role: "inclusion" }]),
  bagel("everything-bagel", "Everything Bagels", [{ name: "Everything seasoning", grams: 50, role: "inclusion" }]),
  {
    id: "rolls",
    name: "Browned Butter Cinnamon Rolls",
    category: "Sweet Rolls",
    yieldPerBatch: 30,
    yieldLabel: "rolls",
    ovenCapacity: 16,
    cycleMinutes: 35,
    version: 1,
    updatedAt: "2026-07-20T12:00:00.000Z",
    ingredients: [
      { name: "Bread Flour", grams: 2160, role: "flour", packageGrams: 2267.96185 },
      { name: "Buttermilk", grams: 540, role: "other" },
      { name: "Granulated sugar", grams: 440, role: "other" },
      { name: "Active dry yeast", grams: 30, role: "other" },
      { name: "Sour cream", grams: 480, role: "other" },
      { name: "Salted butter", grams: 452, role: "other" },
      { name: "Eggs", grams: 400, role: "other" },
      { name: "Vanilla", grams: 40, role: "other" },
      { name: "Fine sea salt", grams: 39, role: "other" },
      { name: "Sourdough discard", grams: 400, role: "discard" },
      { name: "Unsalted butter", grams: 904, role: "other" },
      { name: "Brown sugar", grams: 1440, role: "other" },
      { name: "Ground cinnamon", grams: 72, role: "other" },
      { name: "Heavy cream", grams: 480, role: "other" },
    ],
  },
];

export const sampleEvent: EventItem[] = [
  ["plain", 18, "whole"], ["jalapeno", 16, "whole"], ["garlic", 16, "whole"], ["mage", 12, "whole"],
  ["plain-bagel", 12, "exact"], ["cheddar-bagel", 20, "exact"], ["jalapeno-bagel", 24, "exact"],
  ["everything-bagel", 16, "exact"], ["rolls", 30, "whole"],
].map(([recipeId, target, policy]) => ({ recipeId: String(recipeId), target: Number(target), policy: policy as EventItem["policy"] }));

export const sampleSchedule: ScheduleBlock[] = [
  { dayLabel: "Thursday", title: "Build starter and prep inclusions", notes: "Scale ingredients and confirm the production list.", sortOrder: 0 },
  { dayLabel: "Friday", title: "Bread and bagel production", notes: "Mix, shape, proof, and bake in oven-profile order.", sortOrder: 1 },
  { dayLabel: "Saturday", title: "Bake rolls and final checks", notes: "Cool completely, reconcile quantities, and load for market.", sortOrder: 2 },
];

export const sampleSettings: PlannerSettings = {
  starterHydration: 1,
  shoppingBuffer: 0.1,
  starterSeedParts: 1,
  starterFlourParts: 2,
  starterWaterParts: 2,
};

export const samplePlannerEvent: PlannerEvent = {
  id: "sample",
  name: "Saturday Pop-Up",
  eventAt: "2026-07-25T09:00:00-07:00",
  status: "draft",
  shoppingBuffer: 0.1,
  starterHydration: 1,
  items: sampleEvent,
  schedule: sampleSchedule,
  qaChecks: {
    quantities: false,
    starter: false,
    shopping: false,
    oven: false,
    finalCount: false,
  },
};
