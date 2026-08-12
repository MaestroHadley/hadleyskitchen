import { describe, expect, it } from "vitest";
import { batchesFor, calculatePlan, recipeHydration } from "./planner";
import { sampleEvent, sampleRecipes, sampleSettings } from "../data/sample";

describe("Saturday reference plan", () => {
  const plan = calculatePlan(sampleRecipes, sampleEvent, sampleSettings);

  it("reconciles production and flour", () => {
    expect(plan.totalProducts).toBe(164);
    expect(plan.directFlour).toBe(45415);
    expect(plan.activeStarter).toBe(10292);
    expect(plan.starterFlour).toBe(5146);
    expect(plan.totalExactFlour).toBe(50561);
    expect(plan.totalBufferedFlour).toBeCloseTo(55617.1);
  });

  it("supports exact bagel scaling and whole bread batches", () => {
    expect(plan.production.filter((row) => row.recipe.category === "Bread").reduce((sum, row) => sum + row.batches, 0)).toBe(31);
    expect(plan.production.filter((row) => row.recipe.category === "Bagels").reduce((sum, row) => sum + row.batches, 0)).toBe(6);
  });

  it("does not prescribe store-specific package counts for flour", () => {
    expect(plan.shopping.find((row) => row.name === "Organic AP Flour")?.packages).toBeNull();
  });

  it("keeps package guidance for non-flour ingredients when configured", () => {
    const recipes = structuredClone(sampleRecipes);
    const packagedIngredient = recipes[0].ingredients.find((ingredient) => ingredient.role === "other");
    expect(packagedIngredient).toBeDefined();
    packagedIngredient!.packageGrams = 100;
    const packagedPlan = calculatePlan(recipes, sampleEvent, sampleSettings);
    expect(packagedPlan.shopping.find((row) => row.name === packagedIngredient!.name)?.packages).toEqual(expect.any(Number));
  });

  it("handles zero targets, fractional batches, and distinct hydration", () => {
    const plain = sampleRecipes[0];
    const flavored = sampleRecipes[1];
    expect(batchesFor(plain, { recipeId: plain.id, target: 0, policy: "whole" })).toBe(0);
    expect(batchesFor(plain, { recipeId: plain.id, target: 3, policy: "exact" })).toBe(1.5);
    expect(recipeHydration(plain, 1)).toBeGreaterThan(recipeHydration(flavored, 1));
  });
});
