import { strToU8, zipSync } from "fflate";
import { calculatePlan, type PlannerEvent, type PlannerSettings, type Recipe } from "./planner";
import { buildReportSections, reportCsv, type ReportSection } from "./reports";

export type ArchiveDestination = "doc" | "sheet" | "download";

export type ArchiveReceipt = {
  id: string;
  destination: ArchiveDestination;
  checksum: string;
  googleFileUrl?: string | null;
  createdAt: string;
};

export type ArchiveGoogleExport = {
  kind: "doc" | "sheet";
  fileUrl: string;
  exportedAt: string;
};

export type EventArchiveSnapshotV1 = {
  schema: "hadleys-kitchen.event-archive";
  version: 1;
  generatedAt: string;
  event: PlannerEvent;
  settings: PlannerSettings;
  recipes: Recipe[];
  calculations: ReturnType<typeof calculatePlan>;
  reportSections: ReportSection[];
  googleExports: ArchiveGoogleExport[];
};

export function buildEventArchiveSnapshot(input: {
  event: PlannerEvent;
  recipes: Recipe[];
  settings: PlannerSettings;
  googleExports?: ArchiveGoogleExport[];
  generatedAt?: string;
}): EventArchiveSnapshotV1 {
  const calculations = calculatePlan(input.recipes, input.event.items, {
    ...input.settings,
    shoppingBuffer: input.event.shoppingBuffer,
    starterHydration: input.event.starterHydration,
  });
  return {
    schema: "hadleys-kitchen.event-archive",
    version: 1,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    event: input.event,
    settings: input.settings,
    recipes: input.recipes,
    calculations,
    reportSections: buildReportSections(input.event, input.recipes, input.settings),
    googleExports: input.googleExports ?? [],
  };
}

const escapeHtml = (value: unknown) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function sectionTable(section: ReportSection) {
  const [header, ...rows] = section.rows;
  return `<section>
    <div class="section-number">${escapeHtml(section.title)}</div>
    <table>
      <thead><tr>${header.map((cell) => `<th>${escapeHtml(cell)}</th>`).join("")}</tr></thead>
      <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>
  </section>`;
}

export function buildArchiveHtml(snapshot: EventArchiveSnapshotV1) {
  const date = snapshot.event.eventAt
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short" }).format(new Date(snapshot.event.eventAt))
    : "Date not set";
  const plan = snapshot.calculations;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(snapshot.event.name)} — Production Packet</title>
<style>
:root{--ink:#28231f;--cream:#fbf5e9;--paper:#fffdf8;--copper:#9a4527;--sage:#dfe8da;--line:#d8cbb9;--muted:#6e645b}
*{box-sizing:border-box}body{margin:0;background:var(--cream);color:var(--ink);font:14px/1.45 Arial,sans-serif}
main{width:min(980px,calc(100% - 32px));margin:32px auto}.cover,section{background:var(--paper);border:1px solid var(--line);border-radius:16px;box-shadow:0 12px 34px rgba(40,35,31,.07)}
.cover{padding:42px;margin-bottom:18px;border-top:8px solid var(--ink)}.brand{font:700 15px Georgia,serif;letter-spacing:.08em}.eyebrow,.section-number{color:var(--copper);font-weight:800;letter-spacing:.12em;text-transform:uppercase;font-size:11px}
h1{font:700 clamp(36px,7vw,64px)/1.02 Georgia,serif;margin:24px 0 10px}.meta{color:var(--muted);font-size:16px}
.metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:30px}.metric{padding:18px;border-radius:12px;background:var(--ink);color:white}.metric b,.metric span{display:block}.metric b{font:700 24px Georgia,serif}.metric span{margin-top:5px;color:#e9d7c7;font-size:10px;letter-spacing:.09em}
section{padding:24px;margin:14px 0;break-inside:avoid}.section-number{margin-bottom:12px}table{width:100%;border-collapse:collapse}th,td{padding:10px 8px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}th{background:var(--ink);color:white;font-size:11px;text-transform:uppercase}td:not(:first-child),th:not(:first-child){text-align:right}footer{padding:22px;text-align:center;color:var(--muted);font-size:11px}
@media(max-width:680px){.cover{padding:24px}.metrics{grid-template-columns:1fr 1fr}section{padding:16px;overflow:auto}table{min-width:580px}}
@media print{body{background:white}main{width:100%;margin:0}.cover,section{box-shadow:none;border-radius:0}.cover{break-after:page}section{break-inside:avoid}}
</style>
</head>
<body><main>
  <header class="cover">
    <div class="brand">HADLEY’S KITCHEN</div>
    <div class="eyebrow">Bake Planner · Archived Production Packet</div>
    <h1>${escapeHtml(snapshot.event.name)}</h1>
    <div class="meta">${escapeHtml(date)} · ${escapeHtml(snapshot.event.status.toUpperCase())}</div>
    <div class="metrics">
      <div class="metric"><b>${plan.totalProducts}</b><span>PRODUCTS</span></div>
      <div class="metric"><b>${Number(plan.totalBatches.toFixed(2))}</b><span>BATCHES</span></div>
      <div class="metric"><b>${(plan.totalExactFlour / 1000).toFixed(1)} kg</b><span>EXACT FLOUR</span></div>
      <div class="metric"><b>${(plan.activeStarter / 1000).toFixed(1)} kg</b><span>ACTIVE STARTER</span></div>
    </div>
  </header>
  ${snapshot.reportSections.map(sectionTable).join("")}
  <footer>Generated ${escapeHtml(new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short" }).format(new Date(snapshot.generatedAt)))} · Verify final quantities before production.</footer>
</main></body></html>`;
}

export function archiveBaseName(eventName: string) {
  const safe = eventName.toLocaleLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "bake-plan";
  return `${safe}-archive`;
}

export function buildArchiveZip(snapshot: EventArchiveSnapshotV1) {
  const base = archiveBaseName(snapshot.event.name);
  const json = JSON.stringify(snapshot, null, 2);
  return zipSync({
    [`${base}-production-packet.html`]: strToU8(buildArchiveHtml(snapshot)),
    [`${base}-report.csv`]: strToU8(reportCsv(snapshot.reportSections)),
    [`${base}-source.json`]: strToU8(json),
    "README.txt": strToU8("Hadley’s Kitchen Bake Planner archive\n\nOpen the HTML production packet in any browser. The CSV contains the report tables. The JSON file is the complete versioned source snapshot for this event.\n"),
  }, { level: 6 });
}
