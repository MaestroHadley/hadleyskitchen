import { describe, expect, it } from "vitest";
import { calculatePlan } from "./planner";
import { sampleEvent, sampleMixer, sampleRecipes, sampleSettings } from "../data/sample";

describe("Saturday reference plan", () => {
  const plan = calculatePlan(sampleRecipes, sampleEvent, sampleSettings, sampleMixer);
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
  it("produces four mixer loads below capacity", () => {
    expect(plan.mixerLoads).toHaveLength(4);
    expect(plan.mixerLoads.every((load) => !load.overCapacity)).toBe(true);
  });
  it("rounds the buffered Kirkland package requirement to six", () => {
    expect(plan.shopping.find((row) => row.name === "Organic AP Flour")?.packages).toBe(6);
  });
});
