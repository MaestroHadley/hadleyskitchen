import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { samplePlannerEvent, sampleRecipes, sampleSettings } from "../data/sample";
import { buildArchiveHtml, buildArchiveZip, buildEventArchiveSnapshot } from "./event-archive";

describe("versioned event archives", () => {
  const snapshot = buildEventArchiveSnapshot({
    event: {
      ...samplePlannerEvent,
      qaChecks: { quantities: true, starter: true, shopping: false, oven: true, finalCount: false },
    },
    recipes: sampleRecipes,
    settings: sampleSettings,
    generatedAt: "2026-07-23T19:00:00.000Z",
    googleExports: [{ kind: "doc", fileUrl: "https://docs.google.com/document/d/archive", exportedAt: "2026-07-23T18:59:00.000Z" }],
  });

  it("uses the shared calculation engine and preserves immutable source context", () => {
    expect(snapshot.schema).toBe("hadleys-kitchen.event-archive");
    expect(snapshot.version).toBe(1);
    expect(snapshot.calculations.totalExactFlour).toBe(50_561);
    expect(snapshot.event.qaChecks.quantities).toBe(true);
    expect(snapshot.recipes).toHaveLength(sampleRecipes.length);
  });

  it("creates a printable branded packet", () => {
    const html = buildArchiveHtml(snapshot);
    expect(html).toContain("HADLEY’S KITCHEN");
    expect(html).toContain("Archived Production Packet");
    expect(html).toContain("@media print");
    expect(html).toContain("50.6 kg");
  });

  it("creates the complete ZIP without credentials or unrelated account data", () => {
    const files = unzipSync(buildArchiveZip(snapshot));
    const names = Object.keys(files);
    expect(names).toHaveLength(4);
    expect(names).toContain("saturday-pop-up-archive-production-packet.html");
    expect(names).toContain("saturday-pop-up-archive-report.csv");
    expect(names).toContain("saturday-pop-up-archive-source.json");
    expect(names).toContain("README.txt");

    const source = strFromU8(files["saturday-pop-up-archive-source.json"]);
    expect(source).toContain('"version": 1');
    expect(source).toContain('"totalExactFlour": 50561');
    expect(source).not.toMatch(/refresh.token|service.role|api.key|password/i);
  });
});
