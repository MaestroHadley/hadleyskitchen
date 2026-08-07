import { describe, expect, it } from "vitest";
import type { Recipe } from "./planner";
import { filterRecipeCollection } from "./recipe-library";

const makeRecipes = (count: number): Recipe[] => Array.from({ length: count }, (_, index) => ({
  id: `recipe-${index}`,
  name: `Recipe ${String(index).padStart(3, "0")}`,
  category: index % 2 ? "Bread" : "Pastry",
  yieldPerBatch: 1,
  yieldLabel: "items",
  ovenCapacity: 6,
  cycleMinutes: 30,
  isFavorite: index % 10 === 0,
  archivedAt: index % 25 === 0 ? "2026-07-01T00:00:00.000Z" : null,
  updatedAt: new Date(Date.UTC(2026, 6, (index % 28) + 1)).toISOString(),
  ingredients: [{ name: "Flour", grams: 500, role: "flour" }],
}));

describe("scalable recipe collection", () => {
  it.each([0, 1, 50, 250])("handles a %i-recipe library", (count) => {
    expect(filterRecipeCollection(makeRecipes(count))).toHaveLength(count ? count - Math.ceil(count / 25) : 0);
  });

  it("combines search, category, favorites, and archive filters", () => {
    const recipes = makeRecipes(250);
    expect(filterRecipeCollection(recipes, { query: "Recipe 1", category: "Pastry", favorites: true })).toHaveLength(8);
    expect(filterRecipeCollection(recipes, { status: "archived" })).toHaveLength(10);
  });

  it("sorts predictably for dense libraries", () => {
    const rows = filterRecipeCollection(makeRecipes(50), { sort: "name" });
    expect(rows[0]?.name).toBe("Recipe 001");
    expect(rows.at(-1)?.name).toBe("Recipe 049");
  });
});
