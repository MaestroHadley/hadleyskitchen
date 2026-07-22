import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServerSupabaseConfig } from "./server-config";

export async function createClient() {
  const config = getServerSupabaseConfig();
  if (!config) return null;
  const cookieStore = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        try { values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* Server Component */ }
      },
    },
  });
}
