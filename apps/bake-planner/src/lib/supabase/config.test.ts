import { describe, expect, it } from "vitest";
import { validateSupabasePublicConfig } from "./config";

const publishableKey = "sb_publishable_example";

describe("validateSupabasePublicConfig", () => {
  it("accepts a hosted Supabase URL with a modern publishable key", () => {
    expect(validateSupabasePublicConfig("https://project-ref.supabase.co", publishableKey)).toEqual({
      url: "https://project-ref.supabase.co",
      publishableKey,
    });
  });

  it("accepts a local Supabase URL for development", () => {
    expect(validateSupabasePublicConfig("http://127.0.0.1:54321", publishableKey)).not.toBeNull();
  });

  it.each([
    [undefined, publishableKey],
    ["https://project-ref.supabase.co", undefined],
    ["https://project-ref.supabase.co", "sb_secret_do-not-expose"],
    ["https://project-ref.supabase.co", "legacy-or-malformed-key"],
    ["https://example.com", publishableKey],
    ["http://project-ref.supabase.co", publishableKey],
    [" https://project-ref.supabase.co", publishableKey],
    ["https://project-ref.supabase.co", `\"${publishableKey}\"`],
  ])("rejects an unsafe or malformed URL/key pair", (url, key) => {
    expect(validateSupabasePublicConfig(url, key)).toBeNull();
  });
});
