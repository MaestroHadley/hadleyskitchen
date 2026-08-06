import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/planner-data";
import { hasValidAiImportConsent } from "@/lib/recipe-import";
import { extractRecipesWithGemini, isRecipeImportAiEnabled, RecipeImportAiError } from "@/lib/recipe-import-gemini";
import { recipeDraftsFromJsonLd, stripHtmlForRecipeImport } from "@/lib/recipe-import-jsonld";
import { fetchPublicRecipePage } from "@/lib/recipe-import-url";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TEXT_CHARS = 50_000;
const supportedFiles = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function positiveInteger(value: string | undefined, fallback: number, maximum: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, maximum) : fallback;
}

async function consumeFreeQuota(supabase: NonNullable<Awaited<ReturnType<typeof getSessionUser>>["supabase"]>) {
  const userLimit = positiveInteger(process.env.RECIPE_IMPORT_USER_DAILY_LIMIT, 3, 50);
  const globalLimit = positiveInteger(process.env.RECIPE_IMPORT_GLOBAL_DAILY_LIMIT, 50, 1000);
  const { data, error } = await supabase.rpc("consume_recipe_import_quota", {
    p_user_limit: userLimit,
    p_global_limit: globalLimit,
  });
  if (error) throw new RecipeImportAiError("Free AI import is not ready yet. Continue with guided manual import.", "disabled");
  if (!data) throw new RecipeImportAiError("The free AI allowance is currently exhausted. Continue with guided manual import.", "quota");
}

export async function POST(request: Request) {
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return NextResponse.json({ error: "Sign in to import recipes." }, { status: 401 });
  if (!isRecipeImportAiEnabled()) {
    return NextResponse.json({ error: "Free AI import is not configured right now. Continue with guided manual import.", kind: "disabled" }, { status: 503 });
  }

  try {
    const formData = await request.formData();
    const consent = formData.get("consent");
    const consentVersion = formData.get("consentVersion");
    if (!hasValidAiImportConsent(consent, consentVersion)) {
      return NextResponse.json({ error: "Review and accept the Google AI disclosure before importing." }, { status: 400 });
    }

    const sourceKind = String(formData.get("sourceKind") ?? "");
    if (sourceKind === "url") {
      const requestedUrl = String(formData.get("url") ?? "").trim();
      if (!requestedUrl || requestedUrl.length > 2000) return NextResponse.json({ error: "Enter a valid recipe URL." }, { status: 400 });
      const { html, finalUrl } = await fetchPublicRecipePage(requestedUrl);
      const deterministicDrafts = recipeDraftsFromJsonLd(html, finalUrl);
      if (deterministicDrafts.length) return NextResponse.json({ drafts: deterministicDrafts, aiUsed: false });
      await consumeFreeQuota(supabase);
      const text = stripHtmlForRecipeImport(html);
      const drafts = await extractRecipesWithGemini([{ text: `Source URL: ${finalUrl}\n\nRecipe page text:\n${text}` }], {
        type: "url",
        label: new URL(finalUrl).hostname,
        url: finalUrl,
      });
      return NextResponse.json({ drafts, aiUsed: true });
    }

    if (sourceKind === "text") {
      const text = String(formData.get("text") ?? "").trim();
      if (!text || text.length > MAX_TEXT_CHARS) {
        return NextResponse.json({ error: `Paste between 1 and ${MAX_TEXT_CHARS.toLocaleString()} characters.` }, { status: 400 });
      }
      await consumeFreeQuota(supabase);
      const drafts = await extractRecipesWithGemini([{ text: `Recipe source text:\n${text}` }], {
        type: "text",
        label: "Pasted recipe text",
      });
      return NextResponse.json({ drafts, aiUsed: true });
    }

    if (sourceKind === "file") {
      const file = formData.get("file");
      if (!(file instanceof File)) return NextResponse.json({ error: "Choose a supported image or PDF." }, { status: 400 });
      if (!supportedFiles.has(file.type) || file.size <= 0 || file.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: "Choose a JPEG, PNG, WebP, or PDF no larger than 5 MB." }, { status: 400 });
      }
      await consumeFreeQuota(supabase);
      const data = Buffer.from(await file.arrayBuffer()).toString("base64");
      const sourceType = file.type === "application/pdf" ? "pdf" : "image";
      const drafts = await extractRecipesWithGemini([{
        inline_data: { mime_type: file.type, data },
      }], {
        type: sourceType,
        label: file.name.slice(0, 240),
      });
      return NextResponse.json({ drafts, aiUsed: true });
    }

    return NextResponse.json({ error: "Choose pasted text, a URL, or a file." }, { status: 400 });
  } catch (error) {
    if (error instanceof RecipeImportAiError) {
      const status = error.kind === "quota" ? 429 : error.kind === "invalid" ? 422 : 503;
      return NextResponse.json({ error: error.message, kind: error.kind }, { status });
    }
    const message = error instanceof Error ? error.message : "The recipe could not be imported.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
