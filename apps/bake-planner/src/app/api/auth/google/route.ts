import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getServerSupabaseConfig } from "@/lib/supabase/server-config";

type PendingCookie = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const config = getServerSupabaseConfig();

  if (!config) {
    return NextResponse.redirect(new URL("/?error=auth_unavailable", origin));
  }

  const pendingCookies: PendingCookie[] = [];
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => {
        pendingCookies.push(...values);
      },
    },
  });
  const callback = new URL("/api/auth/callback", origin);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callback.toString(),
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    console.error("Supabase Google sign-in could not start", {
      code: error?.code,
      message: error?.message,
      status: error?.status,
    });
    return NextResponse.redirect(new URL("/?error=auth_start", origin));
  }

  const response = NextResponse.redirect(data.url);
  pendingCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}
