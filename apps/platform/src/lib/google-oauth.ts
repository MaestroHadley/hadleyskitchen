export const googleConnectionFailureReasons = [
  "declined",
  "session",
  "state",
  "configuration",
  "token_exchange",
  "refresh_token",
  "identity",
  "account_mismatch",
  "storage",
] as const;

export type GoogleConnectionFailureReason = (typeof googleConnectionFailureReasons)[number];

export function isGoogleConnectionFailureReason(value: string | undefined): value is GoogleConnectionFailureReason {
  return googleConnectionFailureReasons.includes(value as GoogleConnectionFailureReason);
}

export function googleConnectionFailureMessage(reason?: string) {
  switch (reason) {
    case "declined":
      return "Google Drive access was not granted. Your plan is unchanged.";
    case "session":
      return "Your planner session expired before Google Drive connected. Sign in and try again.";
    case "state":
      return "The Google Drive connection expired before it finished. Please try again.";
    case "configuration":
      return "Google Drive is temporarily unavailable because its connection settings need attention.";
    case "refresh_token":
      return "Google did not provide the reusable permission needed for exports. Please reconnect and approve Drive access.";
    case "identity":
      return "Google Drive connected, but its account identity could not be confirmed. Please reconnect and approve email access.";
    case "account_mismatch":
      return "Choose the same Google account you use to sign in to Hearthworks, or sign in to Hearthworks with a different method first.";
    case "storage":
      return "Google approved access, but the planner could not save the connection. Please try again.";
    default:
      return "Google Drive could not be connected. Please try again.";
  }
}

export function googleEmailsMatch(first?: string | null, second?: string | null) {
  return Boolean(first && second && first.trim().toLocaleLowerCase() === second.trim().toLocaleLowerCase());
}
