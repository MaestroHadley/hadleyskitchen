import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encryptToken } from "@/lib/google";
import { googleEmailsMatch, type GoogleConnectionFailureReason } from "@/lib/google-oauth";

type GoogleTokenResponse = {
  error?: string;
  error_description?: string;
  access_token?: string;
  refresh_token?: string;
  scope?: string;
};

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
};

function callbackResponse(request: NextRequest, returnTo: string, status: "connected" | "failed", reason?: GoogleConnectionFailureReason) {
  const destination = new URL(returnTo, request.nextUrl.origin);
  destination.searchParams.set("google", status);
  if (reason) destination.searchParams.set("googleReason", reason);
  const response = NextResponse.redirect(destination);
  response.cookies.delete("google_oauth_state");
  response.cookies.delete("google_oauth_return");
  return response;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const requestedReturn = request.cookies.get("google_oauth_return")?.value;
  const returnTo = requestedReturn?.startsWith("/") && !requestedReturn.startsWith("//") ? requestedReturn : "/account";
  const state = url.searchParams.get("state");
  if (!state || state !== request.cookies.get("google_oauth_state")?.value) return callbackResponse(request, returnTo, "failed", "state");
  if (url.searchParams.get("error")) return callbackResponse(request, returnTo, "failed", "declined");

  const code = url.searchParams.get("code");
  const supabase = await createClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!code || !supabase || !data.user) return callbackResponse(request, returnTo, "failed", "session");

  let tokenResponse: Response;
  try {
    tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        redirect_uri: `${url.origin}/api/google/callback`,
        grant_type: "authorization_code",
      }),
    });
  } catch (error) {
    console.error("Google Drive OAuth token request failed", { message: error instanceof Error ? error.message : "Unknown request error" });
    return callbackResponse(request, returnTo, "failed", "token_exchange");
  }

  const tokens = await tokenResponse.json().catch(() => ({})) as GoogleTokenResponse;
  if (!tokenResponse.ok) {
    const reason = tokens.error === "invalid_client" ? "configuration" : "token_exchange";
    console.error("Google Drive OAuth token exchange failed", {
      status: tokenResponse.status,
      error: tokens.error ?? "unknown",
      description: tokens.error_description?.slice(0, 200),
    });
    return callbackResponse(request, returnTo, "failed", reason);
  }
  if (!tokens.refresh_token) {
    console.error("Google Drive OAuth response omitted refresh token", { hasScope: Boolean(tokens.scope) });
    return callbackResponse(request, returnTo, "failed", "refresh_token");
  }
  if (!tokens.access_token) return callbackResponse(request, returnTo, "failed", "identity");

  let googleIdentity: GoogleUserInfo;
  try {
    const identityResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { authorization: `Bearer ${tokens.access_token}` },
    });
    googleIdentity = await identityResponse.json().catch(() => ({})) as GoogleUserInfo;
    if (!identityResponse.ok || !googleIdentity.sub || !googleIdentity.email || googleIdentity.email_verified === false) {
      console.error("Google Drive account identity lookup failed", {
        status: identityResponse.status,
        hasSubject: Boolean(googleIdentity.sub),
        hasEmail: Boolean(googleIdentity.email),
      });
      return callbackResponse(request, returnTo, "failed", "identity");
    }
  } catch (error) {
    console.error("Google Drive account identity request failed", { message: error instanceof Error ? error.message : "Unknown request error" });
    return callbackResponse(request, returnTo, "failed", "identity");
  }

  if (data.user.app_metadata.provider === "google" && !googleEmailsMatch(data.user.email, googleIdentity.email)) {
    return callbackResponse(request, returnTo, "failed", "account_mismatch");
  }

  const { error: storageError } = await supabase.from("google_connections").upsert({
    user_id: data.user.id,
    encrypted_refresh_token: encryptToken(tokens.refresh_token),
    scopes: tokens.scope?.split(" ") ?? [],
    google_account_id: googleIdentity.sub,
    google_email: googleIdentity.email,
    connected_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (storageError) {
    console.error("Google Drive connection storage failed", { code: storageError.code, message: storageError.message });
    return callbackResponse(request, returnTo, "failed", "storage");
  }
  return callbackResponse(request, returnTo, "connected");
}
