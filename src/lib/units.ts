export const UNIT_OPTIONS = [
  "g",
  "kg",
  "oz",
  "lb",
  "ml",
  "l",
  "tsp",
  "tbsp",
  "cup",
  "unit",
] as const;

export type UnitOption = (typeof UNIT_OPTIONS)[number];
