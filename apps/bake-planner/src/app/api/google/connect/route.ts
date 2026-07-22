import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { googleAuthorizationUrl } from "@/lib/google";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!data.user) return NextResponse.redirect(new URL("/?auth=required", request.url));
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_TOKEN_ENCRYPTION_KEY) return NextResponse.json({ error: "Google export is not configured." }, { status: 503 });
  const state = crypto.randomBytes(24).toString("base64url");
  const response = NextResponse.redirect(googleAuthorizationUrl(new URL(request.url).origin, state));
  response.cookies.set("google_oauth_state", state, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/" });
  const requestedReturn = new URL(request.url).searchParams.get("returnTo");
  const returnTo = requestedReturn?.startsWith("/") && !requestedReturn.startsWith("//") ? requestedReturn : "/account";
  response.cookies.set("google_oauth_return", returnTo, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/" });
  return response;
}
