import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sampleRecipes } from "@/data/sample";
import { filterRecipeCollection } from "@/lib/recipe-library";
import { isDemoMode } from "@/lib/planner-data";
import { createClient } from "@/lib/supabase/server";

const filtersSchema = z.object({
  q: z.string().max(120).default(""),
  category: z.string().max(120).default(""),
  status: z.enum(["active", "archived"]).default("active"),
  favorites: z.enum(["0", "1"]).default("0"),
  sort: z.enum(["recent", "name", "category"]).default("recent"),
});

export async function GET(request: NextRequest) {
  const parsed = filtersSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid recipe filters." }, { status: 400 });
  const filters = {
    query: parsed.data.q,
    category: parsed.data.category,
    status: parsed.data.status,
    favorites: parsed.data.favorites === "1",
    sort: parsed.data.sort,
  } as const;

  if (isDemoMode()) {
    const recipes = filterRecipeCollection(sampleRecipes, filters).map(({ id, name }) => ({ id, name }));
    return NextResponse.json({ recipes, total: recipes.length });
  }

  const supabase = await createClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!supabase || !auth.user) return NextResponse.json({ error: "Sign in before selecting recipes." }, { status: 401 });

  const pageSize = 1000;
  const recipes: Array<{ id: string; name: string }> = [];
  for (let from = 0; ; from += pageSize) {
    let query = supabase.from("recipes")
      .select("id, name")
      .eq("user_id", auth.user.id);
    query = filters.status === "archived" ? query.not("archived_at", "is", null) : query.is("archived_at", null);
    if (filters.query) query = query.ilike("name", `%${filters.query.replaceAll("%", "")}%`);
    if (filters.category) query = query.eq("category", filters.category);
    if (filters.favorites) query = query.eq("is_favorite", true);
    query = query.order("name");
    const { data, error } = await query.range(from, from + pageSize - 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    recipes.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return NextResponse.json({ recipes, total: recipes.length });
}
