import crypto from "node:crypto";

const scopes = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/spreadsheets",
].join(" ");

export function googleAuthorizationUrl(origin: string, state: string) {
  const params = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID ?? "", redirect_uri: `${origin}/api/google/callback`, response_type: "code", scope: scopes, access_type: "offline", prompt: "consent", state });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

function key() { return crypto.createHash("sha256").update(process.env.GOOGLE_TOKEN_ENCRYPTION_KEY ?? "missing-key").digest(); }
export function encryptToken(value: string) { const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv); const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]); return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${encrypted.toString("base64url")}`; }
export function decryptToken(value: string) { const [iv, tag, payload] = value.split(".").map((part) => Buffer.from(part, "base64url")); const decipher = crypto.createDecipheriv("aes-256-gcm", key(), iv); decipher.setAuthTag(tag); return Buffer.concat([decipher.update(payload), decipher.final()]).toString("utf8"); }
