import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { archiveBaseName, buildArchiveZip, buildEventArchiveSnapshot, type ArchiveGoogleExport } from "@/lib/event-archive";
import { getEvent } from "@/lib/planner-data";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!supabase || !auth.user) return NextResponse.json({ error: "Sign in before creating an archive." }, { status: 401 });

  const [eventData, exportsResult] = await Promise.all([
    getEvent(id),
    supabase.from("google_exports")
      .select("kind, google_file_url, exported_at")
      .eq("event_id", id)
      .eq("user_id", auth.user.id)
      .order("exported_at", { ascending: false }),
  ]);
  if (!eventData) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  const googleExports: ArchiveGoogleExport[] = (exportsResult.data ?? []).map((item) => ({
    kind: item.kind as "doc" | "sheet",
    fileUrl: item.google_file_url,
    exportedAt: item.exported_at,
  }));
  const snapshot = buildEventArchiveSnapshot({ ...eventData, googleExports });
  const archive = buildArchiveZip(snapshot);
  const checksum = createHash("sha256").update(archive).digest("hex");
  const { data: receipt, error } = await supabase.from("event_archive_receipts").insert({
    user_id: auth.user.id,
    event_id: id,
    destination: "download",
    checksum,
  }).select("id").single();
  if (error || !receipt) return NextResponse.json({ error: "The archive could not be prepared safely." }, { status: 500 });

  const responseBody = archive.buffer.slice(
    archive.byteOffset,
    archive.byteOffset + archive.byteLength,
  ) as ArrayBuffer;
  return new NextResponse(responseBody, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${archiveBaseName(eventData.event.name)}.zip"`,
      "cache-control": "private, no-store",
      "x-archive-receipt-id": receipt.id,
      "x-archive-checksum": checksum,
    },
  });
}
