import type { ReportSection } from "./reports";

export type GoogleDocTable = {
  rows: string[][];
  columnWidths: number[];
  headerRows?: number;
  firstColumnEmphasis?: boolean;
  alignments?: Array<"START" | "CENTER" | "END">;
  variant?: "standard" | "summary" | "checklist";
};

export type GoogleDocSection = {
  eyebrow: string;
  title: string;
  pageBreakBefore?: boolean;
  tables: GoogleDocTable[];
};

export type GoogleDocModel = {
  eventName: string;
  eventDate: string;
  status: string;
  summary: Array<{ label: string; value: string }>;
  sections: GoogleDocSection[];
};

function sectionByTitle(sections: ReportSection[], title: string) {
  return sections.find((section) => section.title === title);
}

function rowValue(section: ReportSection | undefined, label: string) {
  return section?.rows.find((row) => String(row[0]) === label)?.[1];
}

function formatNumber(value: string | number) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(numeric) : String(value);
}

function formatGrams(value: string | number) {
  return `${formatNumber(value)} g`;
}

function formatKilograms(value: string | number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(numeric / 1000)} kg`;
}

function formatEventDate(value: string | number | undefined) {
  if (!value || value === "Not set") return "Date not set";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(date);
}

function titleCase(value: string | number | undefined) {
  return String(value ?? "draft").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeRows(rows: Array<Array<string | number>>, columns: number) {
  return rows.map((row) => Array.from({ length: columns }, (_, index) => String(row[index] ?? "")));
}

function productionTable(section: ReportSection | undefined): GoogleDocTable {
  const rows = section?.rows ?? [];
  return {
    rows: rows.map((row, rowIndex) => row.map((value, columnIndex) => rowIndex === 0 || columnIndex === 0 ? String(value) : formatNumber(value))),
    columnWidths: [220, 65, 65, 65, 65],
    headerRows: 1,
    firstColumnEmphasis: true,
    alignments: ["START", "END", "END", "END", "END"],
  };
}

function ingredientTable(section: ReportSection | undefined): GoogleDocTable {
  const rows = section?.rows ?? [];
  return {
    rows: rows.map((row, rowIndex) => rowIndex === 0 ? ["Control", "Amount"] : [String(row[0]), formatGrams(row[1])]),
    columnWidths: [320, 160],
    headerRows: 1,
    firstColumnEmphasis: true,
    alignments: ["START", "END"],
  };
}

function shoppingTable(section: ReportSection | undefined): GoogleDocTable {
  const rows = section?.rows ?? [];
  return {
    rows: rows.map((row, rowIndex) => rowIndex === 0
      ? ["Ingredient", "Exact", "With buffer", "Packages"]
      : [String(row[0]), formatGrams(row[1]), formatGrams(row[2]), row[3] === "" ? "—" : formatNumber(row[3])]),
    columnWidths: [220, 90, 100, 70],
    headerRows: 1,
    firstColumnEmphasis: true,
    alignments: ["START", "END", "END", "END"],
  };
}

function starterTable(section: ReportSection | undefined): GoogleDocTable {
  const rows = section?.rows ?? [];
  return {
    rows: rows.map((row, rowIndex) => rowIndex === 0 ? ["Build component", "Amount"] : [String(row[0]), formatGrams(row[1])]),
    columnWidths: [320, 160],
    headerRows: 1,
    firstColumnEmphasis: true,
    alignments: ["START", "END"],
  };
}

function scheduleTables(section: ReportSection | undefined): GoogleDocTable[] {
  const rows = section?.rows ?? [];
  const ovenHours = rows.find((row) => String(row[0]) === "Estimated oven hours")?.[1] ?? "0";
  const scheduleHeaderIndex = rows.findIndex((row) => String(row[0]) === "Block");
  const scheduleRows = scheduleHeaderIndex >= 0 ? rows.slice(scheduleHeaderIndex) : [["Block", "Task", "Notes"]];
  return [
    { rows: [["Estimated oven time", `${formatNumber(ovenHours)} hours`]], columnWidths: [320, 160], firstColumnEmphasis: true, alignments: ["START", "END"] },
    { rows: normalizeRows(scheduleRows, 3), columnWidths: [90, 160, 230], headerRows: 1, firstColumnEmphasis: true, alignments: ["START", "START", "START"] },
  ];
}

function qaTable(section: ReportSection | undefined): GoogleDocTable {
  const rows = section?.rows.slice(1) ?? [];
  return {
    rows: rows.map((row) => [String(row[1]) === "Complete" ? "☒" : "☐", String(row[0])]),
    columnWidths: [40, 440],
    alignments: ["CENTER", "START"],
    variant: "checklist",
  };
}

export function buildGoogleDocModel(title: string, sections: ReportSection[]): GoogleDocModel {
  const overview = sectionByTitle(sections, "Event Overview");
  const ingredients = sectionByTitle(sections, "Ingredients");
  const eventName = String(rowValue(overview, "Event") ?? title.replace(/\s+—\s+Production Packet$/, ""));
  const totalProducts = rowValue(overview, "Total products") ?? "0";
  const totalBatches = rowValue(overview, "Total batches") ?? "0";
  const exactFlour = rowValue(ingredients, "Total exact flour") ?? "0";
  const activeStarter = rowValue(ingredients, "Active starter") ?? "0";

  return {
    eventName,
    eventDate: formatEventDate(rowValue(overview, "Date")),
    status: titleCase(rowValue(overview, "Status")),
    summary: [
      { label: "PRODUCTS", value: formatNumber(totalProducts) },
      { label: "BATCHES", value: formatNumber(totalBatches) },
      { label: "EXACT FLOUR", value: formatKilograms(exactFlour) },
      { label: "ACTIVE STARTER", value: formatKilograms(activeStarter) },
    ],
    sections: [
      { eyebrow: "01 / PRODUCTION", title: "Batch overview", tables: [productionTable(sectionByTitle(sections, "Production Plan"))] },
      { eyebrow: "02 / INGREDIENT CONTROL", title: "Flour & formula controls", tables: [ingredientTable(ingredients)] },
      { eyebrow: "03 / STARTER BUILD", title: "Build requirements", tables: [starterTable(sectionByTitle(sections, "Starter"))] },
      { eyebrow: "04 / SHOPPING", title: "Buffered shopping list", pageBreakBefore: true, tables: [shoppingTable(sectionByTitle(sections, "Shopping List"))] },
      { eyebrow: "05 / SEQUENCE", title: "Oven & production schedule", pageBreakBefore: true, tables: scheduleTables(sectionByTitle(sections, "Oven & Schedule")) },
      { eyebrow: "06 / FINAL QA", title: "Ready-for-production checks", tables: [qaTable(sectionByTitle(sections, "Final QA"))] },
    ],
  };
}
