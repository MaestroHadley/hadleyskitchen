import { describe, expect, it } from "vitest";
import { googleConnectionFailureMessage, isGoogleConnectionFailureReason } from "./google-oauth";

describe("Google Drive OAuth feedback", () => {
  it("recognizes only safe callback reason codes", () => {
    expect(isGoogleConnectionFailureReason("configuration")).toBe(true);
    expect(isGoogleConnectionFailureReason("invalid_client")).toBe(false);
  });

  it("provides actionable configuration feedback without exposing OAuth details", () => {
    expect(googleConnectionFailureMessage("configuration")).toContain("connection settings");
    expect(googleConnectionFailureMessage("unknown")).toBe("Google Drive could not be connected. Please try again.");
  });
});
