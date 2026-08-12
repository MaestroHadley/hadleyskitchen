import { describe, expect, it } from "vitest";
import { normalizeShoppingCheckedItems } from "./shopping-checks";

describe("shopping checklist persistence", () => {
  it("keeps unique, valid ingredient names", () => {
    expect(normalizeShoppingCheckedItems(["Bread Flour", " Bread Flour ", "Eggs", "", null])).toEqual(["Bread Flour", "Eggs"]);
  });

  it("ignores malformed stored values", () => {
    expect(normalizeShoppingCheckedItems(null)).toEqual([]);
    expect(normalizeShoppingCheckedItems(["x".repeat(121), 42])).toEqual([]);
  });
});
