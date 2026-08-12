import { NextResponse } from "next/server";
import { z } from "zod";
import { decryptToken, googleAccessToken } from "@/lib/google";
import { ensureRecipeFolder, exportRecipeGoogleDoc } from "@/lib/google-recipe-export";
import type { Ingredient, Recipe } from "@/lib/planner";
import { buildRecipeGoogleDocModel } from "@/lib/recipe-google-doc";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const payloadSchema = z.object({ recipeId: z.string().uuid() });

type RecipeRow = {
  id: string;
  name: string;
  category: string;
  yield_per_batch: number | string;
  yield_label: string;
  oven_capacity: number | string;
  cycle_minutes: number;
  instructions?: string;
  notes: string;
  archived_at: string | null;
  is_favorite?: boolean;
  version: number;
  updated_at: string;
  recipe_ingredients?: Array<{
    id: string;
    name: string;
    grams: number | string;
    role: Ingredient["role"];
    package_grams: number | string | null;
    sort_order: number;
  }>;
};

function mapRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    yieldPerBatch: Number(row.yield_per_batch),
    yieldLabel: row.yield_label,
    ovenCapacity: Number(row.oven_capacity),
    cycleMinutes: row.cycle_minutes,
    instructions: row.instructions ?? "",
    notes: row.notes,
    archivedAt: row.archived_at,
    isFavorite: row.is_favorite ?? false,
    version: row.version,
    updatedAt: row.updated_at,
    ingredients: (row.recipe_ingredients ?? [])
      .toSorted((a, b) => a.sort_order - b.sort_order)
      .map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
        grams: Number(ingredient.grams),
        role: ingredient.role,
        packageGrams: ingredient.package_grams ? Number(ingredient.package_grams) : undefined,
        sortOrder: ingredient.sort_order,
      })),
  };
}

export async function POST(request: Request) {
  try {
    const parsed = payloadSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid recipe export request." }, { status: 400 });

    const supabase = await createClient();
    const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    if (!supabase || !auth.user) return NextResponse.json({ error: "Sign in before exporting recipes." }, { status: 401 });

    const [{ data: connection }, { data: recipeRow }, { data: existingExport }] = await Promise.all([
      supabase.from("google_connections")
        .select("encrypted_refresh_token, google_email, recipe_folder_id")
        .eq("user_id", auth.user.id)
        .maybeSingle(),
      supabase.from("recipes")
        .select("*, recipe_ingredients(*)")
        .eq("id", parsed.data.recipeId)
        .eq("user_id", auth.user.id)
        .maybeSingle(),
      supabase.from("recipe_google_exports")
        .select("google_file_id")
        .eq("recipe_id", parsed.data.recipeId)
        .eq("user_id", auth.user.id)
        .maybeSingle(),
    ]);

    if (!connection) return NextResponse.json({ error: "Connect Google Drive first.", reconnect: true }, { status: 409 });
    if (!connection.google_email) return NextResponse.json({ error: "Reconnect Google Drive so Hearthworks can confirm which Google account owns recipe exports.", reconnect: true }, { status: 409 });
    if (!recipeRow) return NextResponse.json({ error: "Recipe not found." }, { status: 404 });

    const token = await googleAccessToken(decryptToken(connection.encrypted_refresh_token));
    const folder = await ensureRecipeFolder(token, connection.recipe_folder_id);
    if (folder.folderId !== connection.recipe_folder_id) {
      const { error } = await supabase.from("google_connections")
        .update({ recipe_folder_id: folder.folderId })
        .eq("user_id", auth.user.id);
      if (error) throw new Error("The recipe folder was created, but Hearthworks could not remember it.");
    }

    const recipe = mapRecipe(recipeRow as RecipeRow);
    const exportedAt = new Date().toISOString();
    const exported = await exportRecipeGoogleDoc({
      title: recipe.name,
      folderId: folder.folderId,
      token,
      model: buildRecipeGoogleDocModel(recipe, exportedAt),
      existingFileId: existingExport?.google_file_id,
    });
    const { error: recordError } = await supabase.from("recipe_google_exports").upsert({
      user_id: auth.user.id,
      recipe_id: recipe.id,
      google_file_id: exported.fileId,
      google_file_url: exported.fileUrl,
      exported_at: exportedAt,
    }, { onConflict: "user_id,recipe_id" });
    if (recordError) throw new Error("The Google Doc was created, but Hearthworks could not record it.");

    return NextResponse.json({
      recipeId: recipe.id,
      fileId: exported.fileId,
      fileUrl: exported.fileUrl,
      folderUrl: folder.folderUrl,
      exportedAt,
      action: exported.created ? "created" : "updated",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Recipe export failed.";
    return NextResponse.json({ error: message, reconnect: /authorization|reconnect/i.test(message) }, { status: 500 });
  }
}
