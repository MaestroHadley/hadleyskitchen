import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { rows = [], filename = "bake-plan" } = await request.json();
  const safeRows: unknown[][] = Array.isArray(rows) ? rows.slice(0, 2000) : [];
  const csv = safeRows.map((row) => Array.isArray(row) ? row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",") : "").join("\n");
  return new NextResponse(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${String(filename).replace(/[^a-z0-9-_]/gi, "-")}.csv"` } });
}
