export const RECIPE_CATEGORY_OPTIONS = [
  "bread",
  "pastry",
  "cookies",
  "bagels",
  "cakes",
  "muffins",
  "sourdough",
  "other",
] as const;

export type RecipeCategory = (typeof RECIPE_CATEGORY_OPTIONS)[number];
