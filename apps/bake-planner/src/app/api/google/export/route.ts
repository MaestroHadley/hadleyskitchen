import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decryptToken } from "@/lib/google";

type ExportPayload = {
  kind: "doc" | "sheet";
  eventId?: string;
  title: string;
  sections: Array<{ title: string; rows: Array<Array<string | number>> }>;
  existingFileId?: string;
};

async function accessToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID ?? "", client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "", refresh_token: refreshToken, grant_type: "refresh_token" }),
  });
  const body = await response.json();
  if (!response.ok || !body.access_token) throw new Error("Google authorization has expired.");
  return body.access_token as string;
}

async function googleFetch(url: string, token: string, init: RequestInit = {}) {
  const response = await fetch(url, { ...init, headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(init.headers ?? {}) } });
  if (!response.ok) throw new Error(`Google export failed (${response.status}).`);
  return response.json();
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as ExportPayload;
    if (!payload.title || !["doc", "sheet"].includes(payload.kind) || !Array.isArray(payload.sections) || payload.sections.length > 20) return NextResponse.json({ error: "Invalid export request." }, { status: 400 });
    const supabase = await createClient();
    const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    if (!supabase || !auth.user) return NextResponse.json({ error: "Sign in before exporting." }, { status: 401 });
    const { data: connection } = await supabase.from("google_connections").select("encrypted_refresh_token").eq("user_id", auth.user.id).single();
    if (!connection) return NextResponse.json({ error: "Connect Google Drive first.", reconnect: true }, { status: 409 });
    const token = await accessToken(decryptToken(connection.encrypted_refresh_token));
    let fileId = payload.existingFileId;
    let fileUrl: string;

    if (payload.kind === "doc") {
      if (!fileId) {
        const created = await googleFetch("https://docs.googleapis.com/v1/documents", token, { method: "POST", body: JSON.stringify({ title: payload.title }) });
        fileId = created.documentId;
      }
      const text = payload.sections.map((section) => `${section.title}\n${section.rows.map((row) => row.join("  ·  ")).join("\n")}`).join("\n\n");
      await googleFetch(`https://docs.googleapis.com/v1/documents/${fileId}:batchUpdate`, token, { method: "POST", body: JSON.stringify({ requests: [{ insertText: { location: { index: 1 }, text: `${payload.title}\n\n${text}\n` } }] }) });
      fileUrl = `https://docs.google.com/document/d/${fileId}/edit`;
    } else {
      if (!fileId) {
        const created = await googleFetch("https://sheets.googleapis.com/v4/spreadsheets", token, { method: "POST", body: JSON.stringify({ properties: { title: payload.title }, sheets: payload.sections.map((section) => ({ properties: { title: section.title.slice(0, 80) } })) }) });
        fileId = created.spreadsheetId;
      }
      await googleFetch(`https://sheets.googleapis.com/v4/spreadsheets/${fileId}/values:batchUpdate`, token, { method: "POST", body: JSON.stringify({ valueInputOption: "RAW", data: payload.sections.map((section) => ({ range: `'${section.title.slice(0, 80).replaceAll("'", "''")}'!A1`, values: section.rows })) }) });
      fileUrl = `https://docs.google.com/spreadsheets/d/${fileId}/edit`;
    }

    if (payload.eventId) await supabase.from("google_exports").insert({ user_id: auth.user.id, event_id: payload.eventId, kind: payload.kind, google_file_id: fileId, google_file_url: fileUrl });
    return NextResponse.json({ fileId, fileUrl, exportedAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Export failed.", reconnect: true }, { status: 500 });
  }
}

export async function DELETE() {
  const supabase = await createClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!supabase || !data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await supabase.from("google_connections").delete().eq("user_id", data.user.id);
  return NextResponse.json({ disconnected: true });
}
