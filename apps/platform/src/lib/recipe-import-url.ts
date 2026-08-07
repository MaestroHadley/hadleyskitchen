import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_URL_BYTES = 750_000;
const MAX_REDIRECTS = 3;

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return a === 0
    || a === 10
    || a === 127
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 100 && b >= 64 && b <= 127)
    || a >= 224;
}

function isPrivateAddress(address: string) {
  const normalized = address.toLocaleLowerCase().split("%")[0];
  if (isIP(normalized) === 4) return isPrivateIpv4(normalized);
  if (isIP(normalized) !== 6) return true;
  if (normalized === "::1" || normalized === "::") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb") || normalized.startsWith("ff")) return true;
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mapped ? isPrivateIpv4(mapped[1]) : false;
}

async function assertSafeUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Enter a valid public HTTPS recipe URL.");
  }
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) {
    throw new Error("Only public HTTPS recipe URLs are supported.");
  }
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("Private or local network URLs are not supported.");
  }
  return url;
}

async function readLimitedText(response: Response) {
  const declaredSize = Number(response.headers.get("content-length") ?? "0");
  if (declaredSize > MAX_URL_BYTES) throw new Error("That recipe page is too large to import.");
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_URL_BYTES) {
      await reader.cancel();
      throw new Error("That recipe page is too large to import.");
    }
    chunks.push(value);
  }
  const combined = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(combined);
}

export async function fetchPublicRecipePage(value: string) {
  let url = await assertSafeUrl(value);
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const response = await fetch(url, {
      redirect: "manual",
      headers: {
        Accept: "text/html,application/xhtml+xml,application/ld+json,text/plain;q=0.8",
        "User-Agent": "HearthworksRecipeImporter/1.0",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location || redirect === MAX_REDIRECTS) throw new Error("The recipe page redirected too many times.");
      url = await assertSafeUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok) throw new Error("That recipe page could not be opened. Paste its recipe text instead.");
    const contentType = response.headers.get("content-type")?.toLocaleLowerCase() ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml") && !contentType.includes("application/ld+json") && !contentType.includes("text/plain")) {
      throw new Error("That URL is not a supported recipe page. Upload the file instead.");
    }
    return { html: await readLimitedText(response), finalUrl: url.toString() };
  }
  throw new Error("That recipe page could not be opened.");
}
