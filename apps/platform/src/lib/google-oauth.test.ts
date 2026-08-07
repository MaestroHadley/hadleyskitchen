import { describe, expect, it } from "vitest";
import { googleAuthorizationUrl } from "./google";
import { googleConnectionFailureMessage, googleEmailsMatch, isGoogleConnectionFailureReason } from "./google-oauth";

describe("Google Drive OAuth feedback", () => {
  it("recognizes only safe callback reason codes", () => {
    expect(isGoogleConnectionFailureReason("configuration")).toBe(true);
    expect(isGoogleConnectionFailureReason("invalid_client")).toBe(false);
  });

  it("provides actionable configuration feedback without exposing OAuth details", () => {
    expect(googleConnectionFailureMessage("configuration")).toContain("connection settings");
    expect(googleConnectionFailureMessage("unknown")).toBe("Google Drive could not be connected. Please try again.");
  });

  it("compares Google account emails without case or surrounding whitespace", () => {
    expect(googleEmailsMatch(" Baker@Example.com ", "baker@example.com")).toBe(true);
    expect(googleEmailsMatch("owner@example.com", "other@example.com")).toBe(false);
    expect(googleEmailsMatch(undefined, "owner@example.com")).toBe(false);
  });

  it("requests Drive access with account identity and an explicit chooser", () => {
    const url = new URL(googleAuthorizationUrl("https://app.example.com", "safe-state", "baker@example.com"));
    expect(url.searchParams.get("scope")).toContain("openid email");
    expect(url.searchParams.get("scope")).toContain("drive.file");
    expect(url.searchParams.get("prompt")).toBe("consent select_account");
    expect(url.searchParams.get("login_hint")).toBe("baker@example.com");
  });
});
