import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseConfig } from "@/lib/supabase/server-config";

type PendingCookie = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const requestedNext = url.searchParams.get("next");
  const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/dashboard";
  const config = getServerSupabaseConfig();
  if (!code || !config) return NextResponse.redirect(new URL("/?error=auth_callback", url.origin));

  const pendingCookies: PendingCookie[] = [];
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        pendingCookies.push(...values);
      },
    },
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("Supabase OAuth code exchange failed", {
      code: error.code,
      message: error.message,
      status: error.status,
      hasVerifierCookie: request.cookies.getAll().some(({ name }) => name.endsWith("-code-verifier")),
      keyType: config.key.startsWith("eyJ") ? "legacy-anon" : "publishable",
    });
    return NextResponse.redirect(new URL("/?error=auth_callback", url.origin));
  }

  const response = NextResponse.redirect(new URL(next, url.origin));
  pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}
