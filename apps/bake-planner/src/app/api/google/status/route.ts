import { NextResponse, type NextRequest } from "next/server";
import { isDemoMode } from "@/lib/planner-data";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  if (isDemoMode()) return NextResponse.json({ connected: false, exports: [] });
  const supabase = await createClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!supabase || !auth.user) return NextResponse.json({ error: "Sign in to use Google exports." }, { status: 401 });
  const eventId = request.nextUrl.searchParams.get("eventId");
  const [{ data: connection }, exportsResult] = await Promise.all([
    supabase.from("google_connections").select("connected_at").eq("user_id", auth.user.id).maybeSingle(),
    eventId ? supabase.from("google_exports").select("kind, google_file_id, google_file_url, exported_at").eq("user_id", auth.user.id).eq("event_id", eventId).order("exported_at", { ascending: false }).limit(10) : Promise.resolve({ data: [] }),
  ]);
  const latest = new Map<string, unknown>();
  for (const item of exportsResult.data ?? []) if (!latest.has(item.kind)) latest.set(item.kind, item);
  return NextResponse.json({ connected: Boolean(connection), connectedAt: connection?.connected_at, exports: [...latest.values()] });
}
