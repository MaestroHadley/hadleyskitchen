import type { NextConfig } from "next";
import path from "node:path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (process.env.VERCEL) {
  if (!supabaseUrl?.startsWith("https://") || !supabaseUrl.endsWith(".supabase.co")) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing or invalid.");
  }
  if (!supabasePublishableKey?.startsWith("sb_publishable_")) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing or invalid.");
  }
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabasePublishableKey,
  },
};

export default nextConfig;
