import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/google";
import { getEvent } from "@/lib/planner-data";
import { buildReportSections } from "@/lib/reports";

const payloadSchema = z.object({
  kind: z.enum(["doc", "sheet"]),
  eventId: z.string().uuid(),
  existingFileId: z.string().min(5).max(300).optional(),
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

async function exportDoc(title: string, sections: ReturnType<typeof buildReportSections>, token: string, existingFileId?: string) {
  let fileId = existingFileId;
  if (!fileId) {
    const created = await googleFetch("https://docs.googleapis.com/v1/documents", token, { method: "POST", body: JSON.stringify({ title }) });
    fileId = created.documentId;
  }
  if (!fileId) throw new Error("Google did not return a document ID.");
  const current = await googleFetch(`https://docs.googleapis.com/v1/documents/${fileId}`, token);
  const endIndex = current.body?.content?.at(-1)?.endIndex ?? 1;
  const blocks = sections.map((section) => `${section.title}\n${section.rows.map((row) => row.join("  ·  ")).join("\n")}`).join("\n\n");
  const content = `${title}\n\n${blocks}\n`;
  const requests: Array<Record<string, unknown>> = [];
  if (endIndex > 2) requests.push({ deleteContentRange: { range: { startIndex: 1, endIndex: endIndex - 1 } } });
  requests.push({ insertText: { location: { index: 1 }, text: content } });
  requests.push({ updateParagraphStyle: { range: { startIndex: 1, endIndex: title.length + 1 }, paragraphStyle: { namedStyleType: "TITLE" }, fields: "namedStyleType" } });
  let cursor = title.length + 3;
  for (const section of sections) {
    requests.push({ updateParagraphStyle: { range: { startIndex: cursor, endIndex: cursor + section.title.length + 1 }, paragraphStyle: { namedStyleType: "HEADING_1", spaceAbove: { magnitude: 12, unit: "PT" }, spaceBelow: { magnitude: 4, unit: "PT" } }, fields: "namedStyleType,spaceAbove,spaceBelow" } });
    cursor += section.title.length + 1 + section.rows.map((row) => row.join("  ·  ")).join("\n").length + 2;
  }
  await googleFetch(`https://docs.googleapis.com/v1/documents/${fileId}:batchUpdate`, token, { method: "POST", body: JSON.stringify({ requests }) });
  return { fileId, fileUrl: `https://docs.google.com/document/d/${fileId}/edit` };
}

async function exportSheet(title: string, sections: ReturnType<typeof buildReportSections>, token: string, existingFileId?: string) {
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
    if (parsed.data.existingFileId) {
      const { data: ownedExport } = await supabase.from("google_exports").select("id").eq("user_id", auth.user.id).eq("event_id", parsed.data.eventId).eq("kind", parsed.data.kind).eq("google_file_id", parsed.data.existingFileId).maybeSingle();
      if (!ownedExport) return NextResponse.json({ error: "That Google export does not belong to this event. Create a new copy instead." }, { status: 403 });
    }
    const token = await accessToken(decryptToken(connection.encrypted_refresh_token));
    const sections = buildReportSections(eventData.event, eventData.recipes, eventData.settings);
    const title = `${eventData.event.name} — ${parsed.data.kind === "doc" ? "Production Packet" : "Bake Plan"}`;
    const exported = parsed.data.kind === "doc" ? await exportDoc(title, sections, token, parsed.data.existingFileId) : await exportSheet(title, sections, token, parsed.data.existingFileId);
    const exportedAt = new Date().toISOString();
    await supabase.from("google_exports").insert({ user_id: auth.user.id, event_id: parsed.data.eventId, kind: parsed.data.kind, google_file_id: exported.fileId, google_file_url: exported.fileUrl, exported_at: exportedAt });
    return NextResponse.json({ ...exported, exportedAt });
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
