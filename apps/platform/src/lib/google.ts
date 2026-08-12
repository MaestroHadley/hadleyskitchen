import crypto from "node:crypto";

// `drive.file` limits file access to files the planner creates or the user
// explicitly opens with it. OpenID email identifies the Google account that
// granted that access so the owner is visible before an export is created.
const scopes = "openid email https://www.googleapis.com/auth/drive.file";

export function googleAuthorizationUrl(origin: string, state: string, loginHint?: string) {
  const params = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID ?? "", redirect_uri: `${origin}/api/google/callback`, response_type: "code", scope: scopes, access_type: "offline", prompt: "consent select_account", state });
  if (loginHint) params.set("login_hint", loginHint);
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

function key() { return crypto.createHash("sha256").update(process.env.GOOGLE_TOKEN_ENCRYPTION_KEY ?? "missing-key").digest(); }
export function encryptToken(value: string) { const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv); const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]); return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`; }
export function decryptToken(value: string) { const [iv, tag, payload] = value.split(".").map((part) => Buffer.from(part, "base64url")); const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv); decipher.setAuthTag(tag); return Buffer.concat([decipher.update(payload), decipher.final()]).toString("utf8"); }

export async function googleAccessToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) throw new Error("Google authorization has expired. Reconnect Google Drive to continue.");
  return body.access_token as string;
}
