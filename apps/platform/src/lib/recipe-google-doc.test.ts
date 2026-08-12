import { describe, expect, it } from "vitest";
import { buildRecipeGoogleDocModel } from "./recipe-google-doc";
import type { Recipe } from "./planner";

const recipe: Recipe = {
  id: "recipe-1",
  name: "Browned Butter Cinnamon Rolls",
  category: "Sweet Rolls",
  yieldPerBatch: 30,
  yieldLabel: "rolls",
  ovenCapacity: 15,
  cycleMinutes: 24,
  version: 3,
  instructions: "Mix the dough.\nShape and proof.",
  notes: "Brown the butter the day before.",
  ingredients: [
    { name: "Bread Flour", grams: 2160, role: "flour" },
    { name: "Active Starter", grams: 540, role: "active_starter" },
  ],
};

describe("recipe Google Doc model", () => {
  it("builds the recipe summary and ingredient table", () => {
    const model = buildRecipeGoogleDocModel(recipe, "2026-08-12T19:30:00.000Z");
    expect(model.title).toBe(recipe.name);
    expect(model.subtitle).toContain("Version 3");
    expect(model.summary).toEqual([
      { label: "CATEGORY", value: "Sweet Rolls" },
      { label: "BATCH YIELD", value: "30 rolls" },
      { label: "OVEN CAPACITY", value: "15 per cycle" },
      { label: "CYCLE TIME", value: "24 minutes" },
    ]);
    expect(model.sections[0].rows).toEqual([
      ["Ingredient", "Grams", "Role"],
      ["Bread Flour", "2,160 g", "Flour"],
      ["Active Starter", "540 g", "Active Starter"],
    ]);
  });

  it("keeps instructions and notes in separate readable sections", () => {
    const model = buildRecipeGoogleDocModel(recipe, "2026-08-12T19:30:00.000Z");
    expect(model.sections.find((section) => section.heading === "Instructions")?.body).toBe(recipe.instructions);
    expect(model.sections.find((section) => section.heading === "Recipe notes")?.body).toBe(recipe.notes);
  });

  it("uses explicit empty-state copy without inventing recipe content", () => {
    const model = buildRecipeGoogleDocModel({ ...recipe, instructions: "", notes: "" }, "2026-08-12T19:30:00.000Z");
    expect(model.sections.find((section) => section.heading === "Instructions")?.body).toBe("No instructions have been added yet.");
    expect(model.sections.find((section) => section.heading === "Recipe notes")?.body).toBe("No recipe notes have been added yet.");
  });
});
