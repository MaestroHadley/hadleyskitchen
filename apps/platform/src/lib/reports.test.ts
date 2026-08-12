import { describe, expect, it } from "vitest";
import { samplePlannerEvent, sampleRecipes, sampleSettings } from "../data/sample";
import { buildReportSections } from "./reports";

describe("report exports", () => {
  it("includes grams and pounds plus ounces in shopping-list exports", () => {
    const section = buildReportSections(samplePlannerEvent, sampleRecipes, sampleSettings)
      .find((item) => item.title === "Shopping List");

    expect(section?.rows[0]).toEqual(["Ingredient", "Exact grams", "Exact lb + oz", "Buffered grams", "Buffered lb + oz", "Packages to buy"]);
    expect(section?.rows[1][1]).toEqual(expect.any(Number));
    expect(section?.rows[1][2]).toMatch(/(?:lb|oz)/);
    expect(section?.rows[1][3]).toEqual(expect.any(Number));
    expect(section?.rows[1][4]).toMatch(/(?:lb|oz)/);
  });
});
