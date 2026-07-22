import { calculatePlan, formatBatches, type PlannerEvent, type PlannerSettings, type Recipe } from "@/lib/planner";

export type ReportSection = { title: string; rows: Array<Array<string | number>> };

export function buildReportSections(event: PlannerEvent, recipes: Recipe[], settings: PlannerSettings): ReportSection[] {
  const plan = calculatePlan(recipes, event.items, { ...settings, shoppingBuffer: event.shoppingBuffer, starterHydration: event.starterHydration });
  return [
    { title: "Event Overview", rows: [["Event", event.name], ["Date", event.eventAt ? new Date(event.eventAt).toLocaleString() : "Not set"], ["Status", event.status], ["Total products", plan.totalProducts], ["Total batches", formatBatches(plan.totalBatches)]] },
    { title: "Production Plan", rows: [["Recipe", "Target", "Batches", "Planned", "Overage"], ...plan.production.map((row) => [row.recipe.name, row.target, formatBatches(row.batches), row.planned, row.overage])] },
    { title: "Ingredients", rows: [["Control", "Grams"], ["Direct flour", Math.round(plan.directFlour)], ["Starter flour", Math.round(plan.starterFlour)], ["Starter water", Math.round(plan.starterWater)], ["Active starter", Math.round(plan.activeStarter)], ["Discard tracked", Math.round(plan.discard)], ["Total exact flour", Math.round(plan.totalExactFlour)], ["Total buffered flour", Math.round(plan.totalBufferedFlour)]] },
    { title: "Shopping List", rows: [["Ingredient", "Exact grams", "Buffered grams", "Packages to buy"], ...plan.shopping.map((row) => [row.name, Math.round(row.exact), Math.round(row.buffered), row.packages ?? ""])] },
    { title: "Starter", rows: [["Build component", "Grams"], ["Build target", Math.round(plan.starterBuild.target)], ["Seed starter", Math.round(plan.starterBuild.seed)], ["Flour feed", Math.round(plan.starterBuild.flour)], ["Water feed", Math.round(plan.starterBuild.water)]] },
    { title: "Oven & Schedule", rows: [["Estimated oven hours", (plan.ovenMinutes / 60).toFixed(1)], ["Block", "Task", "Notes"], ...event.schedule.map((block) => [block.dayLabel, block.title, block.notes])] },
    { title: "Final QA", rows: [["Check", "Status"], ["Production quantities verified", "Pending"], ["Starter build scheduled", "Pending"], ["Shopping completed", "Pending"], ["Oven sequence confirmed", "Pending"], ["Final count reconciled", "Pending"]] },
  ];
}

export function reportCsv(sections: ReportSection[]) {
  return sections.flatMap((section) => [[section.title], ...section.rows, []])
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");
}
