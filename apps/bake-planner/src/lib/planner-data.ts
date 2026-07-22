import { samplePlannerEvent, sampleRecipes, sampleSettings } from "@/data/sample";
import type { Ingredient, PlannerEvent, PlannerSettings, Recipe } from "@/lib/planner";
import { filterRecipeCollection, type RecipeCollectionFilters } from "@/lib/recipe-library";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const isDemoMode = () => process.env.NODE_ENV !== "production" && !getSupabasePublicConfig();

export async function getSessionUser() {
  const supabase = await createClient();
  if (!supabase) return { supabase: null, user: null };
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user };
}

type RecipeRow = {
  id: string;
  name: string;
  category: string;
  yield_per_batch: number | string;
  yield_label: string;
  oven_capacity: number | string;
  cycle_minutes: number;
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

export function mapRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    yieldPerBatch: Number(row.yield_per_batch),
    yieldLabel: row.yield_label,
    ovenCapacity: Number(row.oven_capacity),
    cycleMinutes: row.cycle_minutes,
    notes: row.notes,
    archivedAt: row.archived_at,
    isFavorite: row.is_favorite ?? false,
    version: row.version,
    updatedAt: row.updated_at,
    ingredients: (row.recipe_ingredients ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => ({
        id: item.id,
        name: item.name,
        grams: Number(item.grams),
        role: item.role,
        packageGrams: item.package_grams ? Number(item.package_grams) : undefined,
        sortOrder: item.sort_order,
      })),
  };
}

export type RecipeFilters = RecipeCollectionFilters & {
  page?: number;
  pageSize?: number;
};

export async function listRecipes(filters: RecipeFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(250, Math.max(1, filters.pageSize ?? 25));
  if (isDemoMode()) {
    const rows = filterRecipeCollection(sampleRecipes, filters);
    const from = (page - 1) * pageSize;
    return { recipes: rows.slice(from, from + pageSize), total: rows.length, page, pageSize };
  }

  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return { recipes: [], total: 0, page, pageSize };
  let query = supabase.from("recipes").select("*, recipe_ingredients(*)", { count: "exact" }).eq("user_id", user.id);
  query = filters.status === "archived" ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  if (filters.query) query = query.ilike("name", `%${filters.query.replaceAll("%", "")}%`);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.favorites) query = query.eq("is_favorite", true);
  if (filters.sort === "name") query = query.order("name");
  else if (filters.sort === "category") query = query.order("category").order("name");
  else query = query.order("updated_at", { ascending: false });
  const from = (page - 1) * pageSize;
  const { data, count, error } = await query.range(from, from + pageSize - 1);
  if (error) throw new Error(error.message);
  return { recipes: (data as RecipeRow[]).map(mapRecipe), total: count ?? 0, page, pageSize };
}

export async function getRecipe(id: string) {
  if (isDemoMode()) return sampleRecipes.find((recipe) => recipe.id === id) ?? null;
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return null;
  const { data, error } = await supabase.from("recipes").select("*, recipe_ingredients(*)").eq("id", id).eq("user_id", user.id).single();
  if (error) return null;
  return mapRecipe(data as RecipeRow);
}

export async function getRecipeVersions(id: string) {
  if (isDemoMode()) return [];
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return [];
  const { data } = await supabase.from("recipe_versions").select("id, version, created_at").eq("recipe_id", id).eq("user_id", user.id).order("version", { ascending: false }).limit(10);
  return data ?? [];
}

export async function getSettings(): Promise<PlannerSettings> {
  if (isDemoMode()) return sampleSettings;
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return sampleSettings;
  const { data } = await supabase.from("planner_settings").select("*").eq("user_id", user.id).single();
  return data ? {
    starterHydration: Number(data.starter_hydration),
    shoppingBuffer: Number(data.shopping_buffer),
    starterSeedParts: Number(data.starter_seed_parts),
    starterFlourParts: Number(data.starter_flour_parts),
    starterWaterParts: Number(data.starter_water_parts),
  } : sampleSettings;
}

export async function listEvents() {
  if (isDemoMode()) return [samplePlannerEvent];
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return [];
  const { data, error } = await supabase.from("events").select("id, name, event_at, status, updated_at, event_items(target)").eq("user_id", user.id).neq("status", "archived").order("event_at", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((event) => ({
    id: event.id,
    name: event.name,
    eventAt: event.event_at,
    status: event.status as PlannerEvent["status"],
    updatedAt: event.updated_at,
    totalProducts: (event.event_items ?? []).reduce((sum: number, item: { target: number | string }) => sum + Number(item.target), 0),
  }));
}

export async function getEvent(id: string): Promise<{ event: PlannerEvent; recipes: Recipe[]; settings: PlannerSettings } | null> {
  if (isDemoMode() && id === "sample") return { event: samplePlannerEvent, recipes: sampleRecipes, settings: sampleSettings };
  const { supabase, user } = await getSessionUser();
  if (!supabase || !user) return null;
  const [{ data: event, error }, available, settings] = await Promise.all([
    supabase.from("events").select("*, event_items(*), schedule_blocks(*)").eq("id", id).eq("user_id", user.id).single(),
    listRecipes({ pageSize: 250, status: "active", sort: "name" }),
    getSettings(),
  ]);
  if (error || !event) return null;
  const items = (event.event_items ?? []).sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order);
  const snapshotRecipes = items.map((item: { recipe_snapshot: Recipe }) => item.recipe_snapshot);
  const recipeMap = new Map([...available.recipes, ...snapshotRecipes].map((recipe) => [recipe.id, recipe]));
  return {
    event: {
      id: event.id,
      name: event.name,
      eventAt: event.event_at,
      status: event.status,
      shoppingBuffer: Number(event.shopping_buffer),
      starterHydration: Number(event.starter_hydration),
      items: items.map((item: { id: string; recipe_id: string; target: number | string; batch_policy: "whole" | "exact" }) => ({ id: item.id, recipeId: item.recipe_id, target: Number(item.target), policy: item.batch_policy })),
      schedule: (event.schedule_blocks ?? []).sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order).map((block: { id: string; day_label: string; title: string; notes: string; sort_order: number }) => ({ id: block.id, dayLabel: block.day_label, title: block.title, notes: block.notes, sortOrder: block.sort_order })),
      createdAt: event.created_at,
      updatedAt: event.updated_at,
    },
    recipes: [...recipeMap.values()],
    settings: { ...settings, shoppingBuffer: Number(event.shopping_buffer), starterHydration: Number(event.starter_hydration) },
  };
}
