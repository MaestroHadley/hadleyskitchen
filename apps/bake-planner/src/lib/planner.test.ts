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

  it("rounds the buffered Kirkland package requirement to six", () => {
    expect(plan.shopping.find((row) => row.name === "Organic AP Flour")?.packages).toBe(6);
  });

  it("handles zero targets, fractional batches, and distinct hydration", () => {
    const plain = sampleRecipes[0];
    const flavored = sampleRecipes[1];
    expect(batchesFor(plain, { recipeId: plain.id, target: 0, policy: "whole" })).toBe(0);
    expect(batchesFor(plain, { recipeId: plain.id, target: 3, policy: "exact" })).toBe(1.5);
    expect(recipeHydration(plain, 1)).toBeGreaterThan(recipeHydration(flavored, 1));
  });
});
