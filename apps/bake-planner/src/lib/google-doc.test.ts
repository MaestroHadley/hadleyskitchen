import { describe, expect, it } from "vitest";
import { buildGoogleDocModel } from "./google-doc";
import type { ReportSection } from "./reports";

describe("premium Google Doc model", () => {
  const sections: ReportSection[] = [
    { title: "Event Overview", rows: [["Event", "Saturday Pop-Up"], ["Date", "2026-07-25T09:00:00-07:00"], ["Status", "finalized"], ["Total products", 164], ["Total batches", 38]] },
    { title: "Production Plan", rows: [["Recipe", "Target", "Batches", "Planned", "Overage"], ["Plain Sourdough", 18, 9, 18, 0]] },
    { title: "Ingredients", rows: [["Control", "Grams"], ["Direct flour", 45415], ["Starter flour", 5146], ["Starter water", 5146], ["Active starter", 10292], ["Discard tracked", 0], ["Total exact flour", 50561], ["Total buffered flour", 55617.1]] },
    { title: "Shopping List", rows: [["Ingredient", "Exact grams", "Buffered grams", "Packages to buy"], ["Organic AP Flour", 48401, 53241, 6]] },
    { title: "Starter", rows: [["Build component", "Grams"], ["Build target", 11321], ["Seed starter", 2264], ["Flour feed", 4528], ["Water feed", 4528]] },
    { title: "Oven & Schedule", rows: [["Estimated oven hours", "12.9"], ["Block", "Task", "Notes"], ["Thursday", "Build starter", "Scale ingredients"]] },
    { title: "Final QA", rows: [["Check", "Status"], ["Production quantities verified", "Pending"]] },
  ];
  const model = buildGoogleDocModel("Saturday Pop-Up — Production Packet", sections);

  it("builds a branded operational summary from the shared report totals", () => {
    expect(model.eventName).toBe("Saturday Pop-Up");
    expect(model.summary).toEqual([
      { label: "PRODUCTS", value: "164" },
      { label: "BATCHES", value: "38" },
      { label: "EXACT FLOUR", value: "50.6 kg" },
      { label: "ACTIVE STARTER", value: "10.3 kg" },
    ]);
  });

  it("uses real table-ready rows with units and deliberate page breaks", () => {
    const shopping = model.sections.find((section) => section.title === "Buffered shopping list");
    expect(shopping?.pageBreakBefore).toBe(true);
    expect(shopping?.tables[0].rows[0]).toEqual(["Ingredient", "Exact", "With buffer", "Packages"]);
    expect(shopping?.tables[0].rows[1][1]).toMatch(/ g$/);
    expect(model.sections.find((section) => section.title === "Oven & production schedule")?.pageBreakBefore).toBe(true);
  });

  it("renders final QA as a printable checklist", () => {
    const qa = model.sections.find((section) => section.title === "Ready-for-production checks");
    expect(qa?.tables[0].variant).toBe("checklist");
    expect(qa?.tables[0].rows[0]).toEqual(["☐", "Production quantities verified"]);
  });
});
