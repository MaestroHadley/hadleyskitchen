export const ALLERGEN_TAG_OPTIONS = [
  "gluten",
  "dairy",
  "eggs",
  "nuts",
  "soy",
  "sesame",
] as const;

export const DIETARY_TAG_OPTIONS = [
  "vegetarian",
  "vegan",
  "nut_free",
  "dairy_free",
  "egg_free",
] as const;

export type AllergenTag = (typeof ALLERGEN_TAG_OPTIONS)[number];
export type DietaryTag = (typeof DIETARY_TAG_OPTIONS)[number];
