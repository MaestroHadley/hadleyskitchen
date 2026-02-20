import { supabaseServer } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";

type PlanItemRow = {
  id: string;
  recipe_id: string;
  qty?: number | null;
  ordered_qty?: number | null;
  quantity?: number | null;
};

type RecipeRow = {
  id: string;
  title: string | null;
  name?: string | null;
  category: string | null;
  yield_qty?: number | null;
  yield_unit?: string | null;
};

type RecipeLineRow = {
  recipe_id: string;
  ingredient_id: string;
  qty: number;
  unit: string | null;
};

type AggregateRow = {
  ingredient_id: string;
  ingredient_name: string;
  canonical_unit: string;
  total_qty: number;
  missing_line_count: number;
};

export default async function AppHome() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();

  const { data: latestPlan } = await supabase
    .from("weekly_plans")
    .select("id,title,week_start,week_end,archived_at")
    .is("archived_at", null)
    .lte("week_start", new Date().toISOString().slice(0, 10))
    .gte("week_end", new Date().toISOString().slice(0, 10))
    .order("week_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  let totals: AggregateRow[] = [];
  let totalsError: string | null = null;
  let recipeMix: Array<{ recipeId: string; label: string; count: number; category: string }> = [];

  if (latestPlan?.id) {
    let planItems: PlanItemRow[] = [];
    {
      const a = await supabase
        .from("plan_items")
        .select("id,recipe_id,qty,ordered_qty,quantity")
        .eq("plan_id", latestPlan.id);
      if (!a.error) {
        planItems = (a.data ?? []) as PlanItemRow[];
      } else if (a.error.code === "42703") {
        const b = await supabase.from("plan_items").select("id,recipe_id,qty,ordered_qty").eq("plan_id", latestPlan.id);
        if (!b.error) {
          planItems = (b.data ?? []) as PlanItemRow[];
        } else if (b.error.code === "42703") {
          const c = await supabase.from("plan_items").select("id,recipe_id,qty").eq("plan_id", latestPlan.id);
          if (!c.error) {
            planItems = (c.data ?? []) as PlanItemRow[];
          } else {
            totalsError = c.error.message;
          }
        } else {
          totalsError = b.error.message;
        }
      } else {
        totalsError = a.error.message;
      }
    }

    if (!totalsError && planItems.length > 0) {
      const recipeIds = [...new Set(planItems.map((item) => item.recipe_id))];
      const qtyByRecipeId = new Map<string, number>();
      for (const item of planItems) {
        const current = qtyByRecipeId.get(item.recipe_id) ?? 0;
        const next = Number(item.qty ?? item.ordered_qty ?? item.quantity ?? 0);
        qtyByRecipeId.set(item.recipe_id, current + next);
      }

      const { data: recipesData, error: recipesError } = await supabase
        .from("recipes")
        .select("id,title,name,category,yield_qty,yield_unit")
        .in("id", recipeIds);
      if (!recipesError) {
        const recipes = (recipesData ?? []) as RecipeRow[];
        recipeMix = recipes
          .map((recipe) => {
            const count = qtyByRecipeId.get(recipe.id) ?? 0;
            return {
              recipeId: recipe.id,
              label: recipe.title?.trim() || recipe.name?.trim() || "Untitled recipe",
              category: recipe.category?.trim() || "uncategorized",
              count,
            };
          })
          .filter((item) => item.count > 0)
          .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

      }

      const { data: linesData, error: linesError } = await supabase
        .from("recipe_lines")
        .select("recipe_id,ingredient_id,qty,unit")
        .in("recipe_id", recipeIds);

      if (linesError) {
        totalsError = linesError.message;
      } else {
        const lines = (linesData ?? []) as RecipeLineRow[];
        const linesByRecipe = new Map<string, RecipeLineRow[]>();
        for (const line of lines) {
          const bucket = linesByRecipe.get(line.recipe_id) ?? [];
          bucket.push(line);
          linesByRecipe.set(line.recipe_id, bucket);
        }

        const aggregateInput = planItems.flatMap((item) => {
          const orderedQty = Number(item.qty ?? item.ordered_qty ?? item.quantity ?? 0);
          const recipeYieldQty =
            Number(recipesData?.find((recipe) => recipe.id === item.recipe_id)?.yield_qty ?? 1) || 1;
          const multiplier = orderedQty / (recipeYieldQty > 0 ? recipeYieldQty : 1);
          const recipeLines = linesByRecipe.get(item.recipe_id) ?? [];
          return recipeLines.map((line) => ({
            ingredient_id: line.ingredient_id,
            qty: Number(line.qty),
            unit: line.unit,
            multiplier,
          }));
        });

        if (aggregateInput.length > 0) {
          const { data: totalsData, error: aggregateError } = await supabase.rpc("aggregate_ingredient_lines", {
            p_lines: aggregateInput,
          });
          if (aggregateError) {
            totalsError = aggregateError.message;
          } else {
            totals = ((totalsData ?? []) as AggregateRow[]).sort((a, b) =>
              a.ingredient_name.localeCompare(b.ingredient_name)
            );
          }
        }
      }
    }
  }

  return (
    <main style={{ maxWidth: 1040, margin: "36px auto", padding: "0 16px 40px" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 22,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 32 }}>Hadley&apos;s Kitchen Planner</h1>
          <p style={{ margin: "6px 0 0", color: "#4b5563" }}>
            Logged in as: {data.user?.email ?? "Unknown user"}
          </p>
        </div>
        <LogoutButton />
      </header>

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          boxShadow: "0 14px 32px rgba(17, 24, 39, 0.06)",
          padding: 24,
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>Dashboard</h2>
        <p style={{ margin: 0, color: "#4b5563" }}>
          Start by adding recipes and weekly order quantities. Latest plan totals are shown below.
        </p>
        {latestPlan && recipeMix.length > 0 && (
          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {recipeMix.length > 0 && (
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
                {recipeMix.map((item) => (
                  <div
                    key={`recipe-${item.recipeId}`}
                    style={{
                      border: "1px solid #d1d5db",
                      borderRadius: 999,
                      padding: "8px 14px",
                      background: "#fffdfa",
                      whiteSpace: "nowrap",
                      fontSize: 13,
                    }}
                  >
                    {item.count} {item.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "16px 0" }} />
        <h3 style={{ margin: "0 0 8px" }}>Current Aggregate Totals</h3>
        {!latestPlan && <p style={{ margin: 0, color: "#6b7280" }}>No current-week plan found yet.</p>}
        {latestPlan && (
          <p style={{ margin: "0 0 10px", color: "#6b7280" }}>
            {latestPlan.title} ({latestPlan.week_start} - {latestPlan.week_end})
          </p>
        )}
        {totalsError && <p style={{ margin: 0, color: "#b91c1c" }}>{totalsError}</p>}
        {!totalsError && latestPlan && totals.length === 0 && (
          <p style={{ margin: 0, color: "#6b7280" }}>No totals yet. Add recipe quantities to the plan.</p>
        )}
        {!totalsError && totals.length > 0 && (
          <div style={{ display: "grid", gap: 8 }}>
            {totals.map((total) => (
              <div
                key={total.ingredient_id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  padding: "10px 12px",
                  background: "#fff",
                }}
              >
                <strong>{total.ingredient_name}</strong>
                <div style={{ color: "#4b5563" }}>
                  {Math.round(Number(total.total_qty) * 1000) / 1000} {total.canonical_unit}
                </div>
                {total.missing_line_count > 0 && (
                  <div style={{ color: "#b45309", fontSize: 12 }}>
                    Missing conversions on {total.missing_line_count} line
                    {total.missing_line_count === 1 ? "" : "s"}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
