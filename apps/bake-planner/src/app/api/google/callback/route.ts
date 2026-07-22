import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptToken } from "@/lib/google";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  if (!url.searchParams.get("state") || url.searchParams.get("state") !== request.cookies.get("google_oauth_state")?.value) return NextResponse.json({ error: "Invalid OAuth state." }, { status: 400 });
  const code = url.searchParams.get("code");
  const supabase = await createClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const requestedReturn = request.cookies.get("google_oauth_return")?.value;
  const returnTo = requestedReturn?.startsWith("/") && !requestedReturn.startsWith("//") ? requestedReturn : "/account";
  if (!code || !supabase || !data.user) return NextResponse.redirect(new URL(`${returnTo}?google=failed`, url.origin));
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID ?? "", client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "", redirect_uri: `${url.origin}/api/google/callback`, grant_type: "authorization_code" }) });
  const tokens = await tokenResponse.json();
  if (!tokenResponse.ok || !tokens.refresh_token) return NextResponse.redirect(new URL(`${returnTo}?google=failed`, url.origin));
  await supabase.from("google_connections").upsert({ user_id: data.user.id, encrypted_refresh_token: encryptToken(tokens.refresh_token), scopes: tokens.scope?.split(" ") ?? [], connected_at: new Date().toISOString() });
  const response = NextResponse.redirect(new URL(`${returnTo}?google=connected`, url.origin));
  response.cookies.delete("google_oauth_state");
  response.cookies.delete("google_oauth_return");
  return response;
}
