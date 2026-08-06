import { describe, expect, it } from "vitest";
import { BAKERY_TIME_ZONE, formatBakeryDate } from "./date-format";

describe("bakery date formatting", () => {
  it("uses a fixed bakery timezone so server and browser text match", () => {
    expect(BAKERY_TIME_ZONE).toBe("America/Los_Angeles");
    expect(formatBakeryDate("2026-07-24T00:30:00.000Z", { month: "short", day: "numeric" })).toBe("Jul 23");
  });
});
