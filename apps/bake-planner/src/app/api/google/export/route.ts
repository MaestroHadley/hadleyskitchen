import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/google";
import { buildGoogleDocModel, type GoogleDocTable } from "@/lib/google-doc";
import { getEvent } from "@/lib/planner-data";
import { buildEventArchiveSnapshot } from "@/lib/event-archive";
import type { ReportSection } from "@/lib/reports";

export const maxDuration = 60;

const payloadSchema = z.object({
  kind: z.enum(["doc", "sheet"]),
  eventId: z.string().uuid(),
  existingFileId: z.string().min(5).max(300).optional(),
  archive: z.boolean().optional().default(false),
});

async function accessToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID ?? "", client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "", refresh_token: refreshToken, grant_type: "refresh_token" }),
  });
  const body = await response.json();
  if (!response.ok || !body.access_token) throw new Error("Google authorization has expired. Reconnect Google Drive to continue.");
  return body.access_token as string;
}

async function googleFetch(url: string, token: string, init: RequestInit = {}) {
  const response = await fetch(url, { ...init, headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(init.headers ?? {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? "Google authorization needs to be reconnected." : `Google export failed (${response.status}).`);
  return body;
}

const DOC_COLORS = {
  charcoal: { red: 0.15, green: 0.13, blue: 0.11 },
  copper: { red: 0.58, green: 0.24, blue: 0.12 },
  cream: { red: 0.98, green: 0.96, blue: 0.91 },
  softCopper: { red: 0.95, green: 0.86, blue: 0.79 },
  rule: { red: 0.82, green: 0.77, blue: 0.68 },
  white: { red: 1, green: 1, blue: 1 },
};

type DocCell = { startIndex?: number; endIndex?: number; content?: Array<{ startIndex?: number; endIndex?: number }> };
type DocTable = { tableRows?: Array<{ tableCells?: DocCell[] }> };
type DocElement = { startIndex?: number; endIndex?: number; table?: DocTable };
type GoogleDocument = { body?: { content?: DocElement[] } };

const optionalColor = (rgbColor: { red: number; green: number; blue: number }) => ({ color: { rgbColor } });
const dimension = (magnitude: number) => ({ magnitude, unit: "PT" });

function documentEndIndex(document: GoogleDocument) {
  return document.body?.content?.at(-1)?.endIndex ?? 2;
}

async function docBatchUpdate(fileId: string, token: string, requests: Array<Record<string, unknown>>) {
  if (!requests.length) return;
  await googleFetch(`https://docs.googleapis.com/v1/documents/${fileId}:batchUpdate`, token, {
    method: "POST",
    body: JSON.stringify({ requests }),
  });
}

async function getGoogleDocument(fileId: string, token: string): Promise<GoogleDocument> {
  return googleFetch(`https://docs.googleapis.com/v1/documents/${fileId}`, token);
}

async function appendDocText(fileId: string, token: string, text: string) {
  const document = await getGoogleDocument(fileId, token);
  const startIndex = documentEndIndex(document) - 1;
  await docBatchUpdate(fileId, token, [{ insertText: { location: { index: startIndex }, text } }]);
  return { startIndex, endIndex: startIndex + text.length };
}

function cellTextRange(cell: DocCell) {
  const startIndex = cell.content?.[0]?.startIndex ?? cell.startIndex;
  const endIndex = (cell.content?.at(-1)?.endIndex ?? cell.endIndex ?? 0) - 1;
  return startIndex !== undefined && endIndex > startIndex ? { startIndex, endIndex } : null;
}

async function appendDocTable(fileId: string, token: string, table: GoogleDocTable) {
  const rows = table.rows.length;
  const columns = Math.max(...table.rows.map((row) => row.length), 1);
  const before = await getGoogleDocument(fileId, token);
  const location = { index: documentEndIndex(before) - 1 };
  await docBatchUpdate(fileId, token, [{ insertTable: { rows, columns, location } }]);

  const emptyDocument = await getGoogleDocument(fileId, token);
  const tableElement = emptyDocument.body?.content?.filter((element) => element.table).at(-1);
  if (!tableElement?.table || tableElement.startIndex === undefined) throw new Error("Google could not format the production packet table.");
  const emptyRows = tableElement.table.tableRows ?? [];
  const insertions = emptyRows.flatMap((row, rowIndex) => (row.tableCells ?? []).map((cell, columnIndex) => ({
    index: cell.content?.[0]?.startIndex ?? (cell.startIndex ?? 0) + 1,
    text: table.rows[rowIndex]?.[columnIndex] ?? "",
  }))).filter((item) => item.index > 0 && item.text).sort((a, b) => b.index - a.index);
  await docBatchUpdate(fileId, token, insertions.map((item) => ({ insertText: { location: { index: item.index }, text: item.text } })));

  const filledDocument = await getGoogleDocument(fileId, token);
  const filledElement = filledDocument.body?.content?.filter((element) => element.table).at(-1);
  if (!filledElement?.table || filledElement.startIndex === undefined) throw new Error("Google could not finish the production packet table.");
  const filledRows = filledElement.table.tableRows ?? [];
  const tableStartLocation = { index: filledElement.startIndex };
  const thinBorder = { color: optionalColor(DOC_COLORS.rule), width: dimension(0.5), dashStyle: "SOLID" };
  const requests: Array<Record<string, unknown>> = [
    {
      updateTableCellStyle: {
        tableRange: { tableCellLocation: { tableStartLocation, rowIndex: 0, columnIndex: 0 }, rowSpan: rows, columnSpan: columns },
        tableCellStyle: {
          backgroundColor: optionalColor(DOC_COLORS.cream),
          contentAlignment: "MIDDLE",
          paddingTop: dimension(table.variant === "summary" ? 8 : 5),
          paddingBottom: dimension(table.variant === "summary" ? 8 : 5),
          paddingLeft: dimension(7),
          paddingRight: dimension(7),
          borderTop: thinBorder,
          borderBottom: thinBorder,
          borderLeft: thinBorder,
          borderRight: thinBorder,
        },
        fields: "backgroundColor,contentAlignment,paddingTop,paddingBottom,paddingLeft,paddingRight,borderTop,borderBottom,borderLeft,borderRight",
      },
    },
    ...table.columnWidths.map((width, columnIndex) => ({
      updateTableColumnProperties: {
        tableStartLocation,
        columnIndices: [columnIndex],
        tableColumnProperties: { widthType: "FIXED_WIDTH", width: dimension(width) },
        fields: "widthType,width",
      },
    })),
  ];

  if (table.variant === "summary") {
    requests.push(
      {
        updateTableCellStyle: {
          tableRange: { tableCellLocation: { tableStartLocation, rowIndex: 0, columnIndex: 0 }, rowSpan: 1, columnSpan: columns },
          tableCellStyle: { backgroundColor: optionalColor(DOC_COLORS.charcoal) },
          fields: "backgroundColor",
        },
      },
      {
        updateTableCellStyle: {
          tableRange: { tableCellLocation: { tableStartLocation, rowIndex: 1, columnIndex: 0 }, rowSpan: 1, columnSpan: columns },
          tableCellStyle: { backgroundColor: optionalColor(DOC_COLORS.softCopper) },
          fields: "backgroundColor",
        },
      },
    );
  } else if (table.headerRows) {
    requests.push({
      updateTableCellStyle: {
        tableRange: { tableCellLocation: { tableStartLocation, rowIndex: 0, columnIndex: 0 }, rowSpan: table.headerRows, columnSpan: columns },
        tableCellStyle: { backgroundColor: optionalColor(DOC_COLORS.charcoal) },
        fields: "backgroundColor",
      },
    });
    for (let rowIndex = table.headerRows; rowIndex < rows; rowIndex += 2) {
      requests.push({
        updateTableCellStyle: {
          tableRange: { tableCellLocation: { tableStartLocation, rowIndex, columnIndex: 0 }, rowSpan: 1, columnSpan: columns },
          tableCellStyle: { backgroundColor: optionalColor(DOC_COLORS.white) },
          fields: "backgroundColor",
        },
      });
    }
  }

  for (const [rowIndex, row] of filledRows.entries()) {
    for (const [columnIndex, cell] of (row.tableCells ?? []).entries()) {
      const range = cellTextRange(cell);
      if (!range) continue;
      const isSummaryValue = table.variant === "summary" && rowIndex === 0;
      const isSummaryLabel = table.variant === "summary" && rowIndex === 1;
      const isHeader = Boolean(table.headerRows && rowIndex < table.headerRows);
      const isChecklistBox = table.variant === "checklist" && columnIndex === 0;
      requests.push(
        {
          updateTextStyle: {
            range,
            textStyle: {
              weightedFontFamily: { fontFamily: isSummaryValue ? "Georgia" : "Arial" },
              fontSize: dimension(isSummaryValue ? 16 : isSummaryLabel || isHeader ? 8.5 : isChecklistBox ? 15 : 9.5),
              bold: isSummaryValue || isSummaryLabel || isHeader || Boolean(table.firstColumnEmphasis && columnIndex === 0),
              foregroundColor: optionalColor(isSummaryValue || isHeader ? DOC_COLORS.white : isSummaryLabel ? DOC_COLORS.copper : DOC_COLORS.charcoal),
            },
            fields: "weightedFontFamily,fontSize,bold,foregroundColor",
          },
        },
        {
          updateParagraphStyle: {
            range,
            paragraphStyle: { alignment: table.variant === "summary" ? "CENTER" : table.alignments?.[columnIndex] ?? "START", lineSpacing: 110 },
            fields: "alignment,lineSpacing",
          },
        },
      );
    }
  }
  await docBatchUpdate(fileId, token, requests);
}

async function appendSectionHeading(fileId: string, token: string, eyebrow: string, title: string) {
  const text = `${eyebrow}\n${title}\n`;
  const range = await appendDocText(fileId, token, text);
  const titleStart = range.startIndex + eyebrow.length + 1;
  await docBatchUpdate(fileId, token, [
    {
      updateTextStyle: {
        range: { startIndex: range.startIndex, endIndex: range.startIndex + eyebrow.length },
        textStyle: { weightedFontFamily: { fontFamily: "Arial" }, fontSize: dimension(8), bold: true, foregroundColor: optionalColor(DOC_COLORS.copper) },
        fields: "weightedFontFamily,fontSize,bold,foregroundColor",
      },
    },
    {
      updateTextStyle: {
        range: { startIndex: titleStart, endIndex: titleStart + title.length },
        textStyle: { weightedFontFamily: { fontFamily: "Georgia" }, fontSize: dimension(17), bold: true, foregroundColor: optionalColor(DOC_COLORS.charcoal) },
        fields: "weightedFontFamily,fontSize,bold,foregroundColor",
      },
    },
    {
      updateParagraphStyle: {
        range: { startIndex: range.startIndex, endIndex: titleStart },
        paragraphStyle: { spaceAbove: dimension(13), spaceBelow: dimension(2), keepWithNext: true },
        fields: "spaceAbove,spaceBelow,keepWithNext",
      },
    },
    {
      updateParagraphStyle: {
        range: { startIndex: titleStart, endIndex: range.endIndex },
        paragraphStyle: { spaceBelow: dimension(7), keepWithNext: true },
        fields: "spaceBelow,keepWithNext",
      },
    },
  ]);
}

async function appendPageBreak(fileId: string, token: string) {
  const document = await getGoogleDocument(fileId, token);
  await docBatchUpdate(fileId, token, [{ insertPageBreak: { location: { index: documentEndIndex(document) - 1 } } }]);
}

async function exportDoc(title: string, sections: ReportSection[], token: string, existingFileId?: string) {
  let fileId = existingFileId;
  if (!fileId) {
    const created = await googleFetch("https://docs.googleapis.com/v1/documents", token, { method: "POST", body: JSON.stringify({ title }) });
    fileId = created.documentId;
  }
  if (!fileId) throw new Error("Google did not return a document ID.");
  const model = buildGoogleDocModel(title, sections);
  const current = await getGoogleDocument(fileId, token);
  const endIndex = documentEndIndex(current);
  const resetRequests: Array<Record<string, unknown>> = [];
  if (endIndex > 2) resetRequests.push({ deleteContentRange: { range: { startIndex: 1, endIndex: endIndex - 1 } } });
  resetRequests.push({
    updateDocumentStyle: {
      documentStyle: { marginTop: dimension(48), marginBottom: dimension(48), marginLeft: dimension(60), marginRight: dimension(60) },
      fields: "marginTop,marginBottom,marginLeft,marginRight",
    },
  });
  await docBatchUpdate(fileId, token, resetRequests);

  const opening = `HADLEY’S KITCHEN\nBAKE PLANNER · PRODUCTION PACKET\n\n${model.eventName}\n${model.eventDate}\n${model.status.toUpperCase()}\n`;
  const openingRange = await appendDocText(fileId, token, opening);
  const packetLabelStart = openingRange.startIndex + "HADLEY’S KITCHEN\n".length;
  const eventNameStart = openingRange.startIndex + opening.indexOf(model.eventName);
  const dateStart = openingRange.startIndex + opening.indexOf(model.eventDate);
  const statusStart = openingRange.startIndex + opening.lastIndexOf(model.status.toUpperCase());
  await docBatchUpdate(fileId, token, [
    {
      updateTextStyle: {
        range: { startIndex: openingRange.startIndex, endIndex: openingRange.startIndex + "HADLEY’S KITCHEN".length },
        textStyle: { weightedFontFamily: { fontFamily: "Georgia" }, fontSize: dimension(10), bold: true, foregroundColor: optionalColor(DOC_COLORS.charcoal) },
        fields: "weightedFontFamily,fontSize,bold,foregroundColor",
      },
    },
    {
      updateTextStyle: {
        range: { startIndex: packetLabelStart, endIndex: packetLabelStart + "BAKE PLANNER · PRODUCTION PACKET".length },
        textStyle: { weightedFontFamily: { fontFamily: "Arial" }, fontSize: dimension(8), bold: true, foregroundColor: optionalColor(DOC_COLORS.copper) },
        fields: "weightedFontFamily,fontSize,bold,foregroundColor",
      },
    },
    {
      updateTextStyle: {
        range: { startIndex: eventNameStart, endIndex: eventNameStart + model.eventName.length },
        textStyle: { weightedFontFamily: { fontFamily: "Georgia" }, fontSize: dimension(28), bold: true, foregroundColor: optionalColor(DOC_COLORS.charcoal) },
        fields: "weightedFontFamily,fontSize,bold,foregroundColor",
      },
    },
    {
      updateParagraphStyle: {
        range: { startIndex: eventNameStart, endIndex: eventNameStart + model.eventName.length + 1 },
        paragraphStyle: { spaceAbove: dimension(7), spaceBelow: dimension(7), borderBottom: { color: optionalColor(DOC_COLORS.copper), width: dimension(1.5), padding: dimension(7), dashStyle: "SOLID" }, keepWithNext: true },
        fields: "spaceAbove,spaceBelow,borderBottom,keepWithNext",
      },
    },
    {
      updateTextStyle: {
        range: { startIndex: dateStart, endIndex: statusStart + model.status.length },
        textStyle: { weightedFontFamily: { fontFamily: "Arial" }, fontSize: dimension(9.5), foregroundColor: optionalColor(DOC_COLORS.charcoal), bold: false },
        fields: "weightedFontFamily,fontSize,foregroundColor,bold",
      },
    },
    {
      updateTextStyle: {
        range: { startIndex: statusStart, endIndex: statusStart + model.status.length },
        textStyle: { bold: true, foregroundColor: optionalColor(DOC_COLORS.copper) },
        fields: "bold,foregroundColor",
      },
    },
    {
      updateParagraphStyle: {
        range: { startIndex: dateStart, endIndex: openingRange.endIndex },
        paragraphStyle: { lineSpacing: 120, spaceBelow: dimension(2) },
        fields: "lineSpacing,spaceBelow",
      },
    },
  ]);

  await appendDocTable(fileId, token, {
    rows: [model.summary.map((item) => item.value), model.summary.map((item) => item.label)],
    columnWidths: [120, 120, 120, 120],
    alignments: ["CENTER", "CENTER", "CENTER", "CENTER"],
    variant: "summary",
  });

  for (const section of model.sections) {
    if (section.pageBreakBefore) await appendPageBreak(fileId, token);
    await appendSectionHeading(fileId, token, section.eyebrow, section.title);
    for (const table of section.tables) {
      await appendDocTable(fileId, token, table);
      await appendDocText(fileId, token, "\n");
    }
  }

  const footer = await appendDocText(fileId, token, "HADLEY’S KITCHEN · BAKE PLANNER\nGenerated as a planning snapshot. Verify final quantities before production.\n");
  await docBatchUpdate(fileId, token, [
    {
      updateTextStyle: {
        range: footer,
        textStyle: { weightedFontFamily: { fontFamily: "Arial" }, fontSize: dimension(7.5), bold: false, foregroundColor: optionalColor(DOC_COLORS.copper) },
        fields: "weightedFontFamily,fontSize,bold,foregroundColor",
      },
    },
    {
      updateParagraphStyle: {
        range: footer,
        paragraphStyle: { alignment: "CENTER", spaceAbove: dimension(12), borderTop: { color: optionalColor(DOC_COLORS.rule), width: dimension(0.5), padding: dimension(7), dashStyle: "SOLID" } },
        fields: "alignment,spaceAbove,borderTop",
      },
    },
  ]);
  return { fileId, fileUrl: `https://docs.google.com/document/d/${fileId}/edit` };
}

async function exportSheet(title: string, sections: ReportSection[], token: string, existingFileId?: string) {
  let fileId = existingFileId;
  if (!fileId) {
    const created = await googleFetch("https://sheets.googleapis.com/v4/spreadsheets", token, { method: "POST", body: JSON.stringify({ properties: { title }, sheets: sections.map((section) => ({ properties: { title: section.title.slice(0, 80), gridProperties: { frozenRowCount: 1 } } })) }) });
    fileId = created.spreadsheetId;
  }
  if (!fileId) throw new Error("Google did not return a spreadsheet ID.");
  let metadata = await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${fileId}?fields=sheets.properties`, token);
  const existingTitles = new Set((metadata.sheets ?? []).map((sheet: { properties: { title: string } }) => sheet.properties.title));
  const missing = sections.filter((section) => !existingTitles.has(section.title.slice(0, 80)));
  if (missing.length) {
    await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${fileId}:batchUpdate`, token, { method: "POST", body: JSON.stringify({ requests: missing.map((section) => ({ addSheet: { properties: { title: section.title.slice(0, 80), gridProperties: { frozenRowCount: 1 } } } })) }) });
    metadata = await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${fileId}?fields=sheets.properties`, token);
  }
  const ranges = sections.map((section) => `'${section.title.slice(0, 80).replaceAll("'", "''")}'`);
  await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${fileId}/values:batchClear`, token, { method: "POST", body: JSON.stringify({ ranges }) });
  await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${fileId}/values:batchUpdate`, token, { method: "POST", body: JSON.stringify({ valueInputOption: "RAW", data: sections.map((section) => ({ range: `'${section.title.slice(0, 80).replaceAll("'", "''")}'!A1`, values: section.rows })) }) });
  const sheetIds = new Map((metadata.sheets ?? []).map((sheet: { properties: { title: string; sheetId: number } }) => [sheet.properties.title, sheet.properties.sheetId]));
  await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${fileId}:batchUpdate`, token, { method: "POST", body: JSON.stringify({ requests: sections.flatMap((section) => {
    const sheetId = sheetIds.get(section.title.slice(0, 80));
    return sheetId === undefined ? [] : [
      { updateSheetProperties: { properties: { sheetId, gridProperties: { frozenRowCount: 1 } }, fields: "gridProperties.frozenRowCount" } },
      { repeatCell: { range: { sheetId, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { backgroundColor: { red: 0.16, green: 0.15, blue: 0.13 }, textFormat: { foregroundColor: { red: 1, green: 0.98, blue: 0.94 }, bold: true } } }, fields: "userEnteredFormat(backgroundColor,textFormat)" } },
      { autoResizeDimensions: { dimensions: { sheetId, dimension: "COLUMNS", startIndex: 0, endIndex: Math.max(...section.rows.map((row) => row.length), 1) } } },
    ];
  }) }) });
  return { fileId, fileUrl: `https://docs.google.com/spreadsheets/d/${fileId}/edit` };
}

export async function POST(request: Request) {
  try {
    const parsed = payloadSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid export request." }, { status: 400 });
    const supabase = await createClient();
    const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    if (!supabase || !auth.user) return NextResponse.json({ error: "Sign in before exporting." }, { status: 401 });
    const [{ data: connection }, eventData] = await Promise.all([
      supabase.from("google_connections").select("encrypted_refresh_token").eq("user_id", auth.user.id).maybeSingle(),
      getEvent(parsed.data.eventId),
    ]);
    if (!connection) return NextResponse.json({ error: "Connect Google Drive first.", reconnect: true }, { status: 409 });
    if (!eventData) return NextResponse.json({ error: "Event not found." }, { status: 404 });
    if (parsed.data.archive && parsed.data.existingFileId) return NextResponse.json({ error: "Archival exports must create a new copy." }, { status: 400 });
    if (parsed.data.existingFileId) {
      const { data: ownedExport } = await supabase.from("google_exports").select("id").eq("user_id", auth.user.id).eq("event_id", parsed.data.eventId).eq("kind", parsed.data.kind).eq("google_file_id", parsed.data.existingFileId).maybeSingle();
      if (!ownedExport) return NextResponse.json({ error: "That Google export does not belong to this event. Create a new copy instead." }, { status: 403 });
    }
    const token = await accessToken(decryptToken(connection.encrypted_refresh_token));
    const snapshot = buildEventArchiveSnapshot(eventData);
    const sections = snapshot.reportSections;
    const archivedAt = new Date();
    const archivedLabel = [
      archivedAt.getFullYear(),
      String(archivedAt.getMonth() + 1).padStart(2, "0"),
      String(archivedAt.getDate()).padStart(2, "0"),
    ].join(".") + `-${String(archivedAt.getHours()).padStart(2, "0")}.${String(archivedAt.getMinutes()).padStart(2, "0")}`;
    const title = parsed.data.archive
      ? `${eventData.event.name} — Archived ${archivedLabel}`
      : `${eventData.event.name} — ${parsed.data.kind === "doc" ? "Production Packet" : "Bake Plan"}`;
    const exported = parsed.data.kind === "doc" ? await exportDoc(title, sections, token, parsed.data.existingFileId) : await exportSheet(title, sections, token, parsed.data.existingFileId);
    const exportedAt = new Date().toISOString();
    const { error: exportError } = await supabase.from("google_exports").insert({ user_id: auth.user.id, event_id: parsed.data.eventId, kind: parsed.data.kind, google_file_id: exported.fileId, google_file_url: exported.fileUrl, exported_at: exportedAt });
    if (exportError) throw new Error("The Google file was created, but the planner could not record it.");
    let receiptId: string | undefined;
    if (parsed.data.archive) {
      const checksum = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
      const { data: receipt, error: receiptError } = await supabase.from("event_archive_receipts").insert({
        user_id: auth.user.id,
        event_id: parsed.data.eventId,
        destination: parsed.data.kind,
        checksum,
        google_file_url: exported.fileUrl,
        created_at: exportedAt,
      }).select("id").single();
      if (receiptError || !receipt) throw new Error("The Google file was created, but the archive receipt could not be saved.");
      receiptId = receipt.id;
    }
    return NextResponse.json({ ...exported, exportedAt, receiptId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed. Your event was not changed.";
    return NextResponse.json({ error: message, reconnect: /authorization|reconnect/i.test(message) }, { status: 500 });
  }
}

export async function DELETE() {
  const supabase = await createClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!supabase || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await supabase.from("google_connections").delete().eq("user_id", data.user.id);
  return NextResponse.json({ disconnected: true });
}
