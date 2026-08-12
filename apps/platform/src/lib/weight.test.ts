import { describe, expect, it } from "vitest";
import { formatPoundsOunces, formatShoppingWeight } from "./weight";

describe("shopping weight formatting", () => {
  it("renders grocery-scale weights as pounds and ounces", () => {
    expect(formatPoundsOunces(2376)).toBe("5 lb 3.8 oz");
    expect(formatPoundsOunces(33)).toBe("1.2 oz");
    expect(formatPoundsOunces(453.59237)).toBe("1 lb");
  });

  it("keeps gram display exact to the nearest gram", () => {
    expect(formatShoppingWeight(2376.4, "grams")).toBe("2,376 g");
    expect(formatShoppingWeight(2376.4, "imperial")).toBe("5 lb 3.8 oz");
  });
});
