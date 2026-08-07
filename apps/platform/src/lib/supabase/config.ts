export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

export function validateSupabasePublicConfig(
  urlValue: string | undefined,
  keyValue: string | undefined,
): SupabasePublicConfig | null {
  if (!urlValue || !keyValue) return null;
  if (urlValue !== urlValue.trim() || keyValue !== keyValue.trim()) return null;
  if (!keyValue.startsWith("sb_publishable_")) return null;

  try {
    const url = new URL(urlValue);
    const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if ((!isLocal && url.protocol !== "https:") || (!isLocal && !url.hostname.endsWith(".supabase.co"))) return null;
  } catch {
    return null;
  }

  return { url: urlValue, publishableKey: keyValue };
}

export function getSupabasePublicConfig() {
  return validateSupabasePublicConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
