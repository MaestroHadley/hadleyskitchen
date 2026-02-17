"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

type WeeklyPlan = {
  id: string;
  title: string;
  week_start: string;
  week_end: string;
  archived_at: string | null;
};

type Recipe = {
  id: string;
  title: string;
  yield_qty: number | null;
  yield_unit: string | null;
  archived_at: string | null;
};

type PlanItem = {
  id: string;
  recipe_id: string;
  qty: number;
  recipes: {
    id: string;
    title: string;
    yield_qty: number | null;
    yield_unit: string | null;
  } | null;
};

type RecipeLine = {
  recipe_id: string;
  ingredient_id: string;
  qty: number;
  unit: string | null;
};

type AggregatedTotal = {
  ingredient_id: string;
  ingredient_name: string;
  canonical_unit: string;
  total_qty: number;
  missing_line_count: number;
};

export default function WeeklyPlanWorkbench() {
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [plans, setPlans] = useState<WeeklyPlan[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [totals, setTotals] = useState<AggregatedTotal[]>([]);

  const [newPlanTitle, setNewPlanTitle] = useState("This Week");
  const [newWeekStart, setNewWeekStart] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [newWeekEnd, setNewWeekEnd] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  });

  const [itemRecipeId, setItemRecipeId] = useState("");
  const [itemQty, setItemQty] = useState<number>(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    void loadPlansAndRecipes();
  }, []);

  useEffect(() => {
    if (!selectedPlanId) {
      setPlanItems([]);
      setTotals([]);
      return;
    }
    void loadPlanItems(selectedPlanId);
  }, [selectedPlanId]);

  async function loadPlansAndRecipes() {
    setLoading(true);
    setError(null);

    const [{ data: plansData, error: plansError }, { data: recipeData, error: recipesError }] = await Promise.all([
      supabase.from("weekly_plans").select("id,title,week_start,week_end,archived_at").order("week_start", {
        ascending: false,
      }),
      supabase.from("recipes").select("id,title,yield_qty,yield_unit,archived_at").order("title", {
        ascending: true,
      }),
    ]);

    setLoading(false);

    if (plansError || recipesError) {
      setError(plansError?.message ?? recipesError?.message ?? "Failed to load weekly planning data.");
      return;
    }

    const parsedPlans = (plansData ?? []) as WeeklyPlan[];
    const parsedRecipes = (recipeData ?? []) as Recipe[];

    setPlans(parsedPlans);
    setRecipes(parsedRecipes.filter((r) => !r.archived_at));

    if (!selectedPlanId) {
      const firstActivePlan = parsedPlans.find((p) => !p.archived_at);
      setSelectedPlanId(firstActivePlan?.id ?? null);
    }
  }

  async function loadPlanItems(planId: string) {
    const { data, error: itemsError } = await supabase
      .from("plan_items")
      .select("id,recipe_id,qty,recipes(id,title,yield_qty,yield_unit)")
      .eq("plan_id", planId)
      .order("id", { ascending: true });

    if (itemsError) {
      setError(itemsError.message);
      return;
    }

    const parsedItems = (data ?? []) as unknown as PlanItem[];
    setPlanItems(parsedItems);
    await recalculateTotals(parsedItems);
  }

  async function recalculateTotals(items: PlanItem[]) {
    if (items.length === 0) {
      setTotals([]);
      return;
    }

    const recipeIds = [...new Set(items.map((item) => item.recipe_id))];
    const { data: linesData, error: linesError } = await supabase
      .from("recipe_lines")
      .select("recipe_id,ingredient_id,qty,unit")
      .in("recipe_id", recipeIds);

    if (linesError) {
      setError(linesError.message);
      return;
    }

    const lines = (linesData ?? []) as RecipeLine[];
    const linesByRecipe = new Map<string, RecipeLine[]>();
    for (const line of lines) {
      const current = linesByRecipe.get(line.recipe_id) ?? [];
      current.push(line);
      linesByRecipe.set(line.recipe_id, current);
    }

    const aggregateInput = items.flatMap((item) => {
      const recipeLines = linesByRecipe.get(item.recipe_id) ?? [];
      return recipeLines.map((line) => ({
        ingredient_id: line.ingredient_id,
        qty: Number(line.qty),
        unit: line.unit,
        multiplier: Number(item.qty),
      }));
    });

    if (aggregateInput.length === 0) {
      setTotals([]);
      return;
    }

    const { data: totalData, error: totalsError } = await supabase.rpc("aggregate_ingredient_lines", {
      p_lines: aggregateInput,
    });

    if (totalsError) {
      setError(totalsError.message);
      return;
    }

    const parsedTotals = (totalData ?? []) as AggregatedTotal[];
    parsedTotals.sort((a, b) => a.ingredient_name.localeCompare(b.ingredient_name));
    setTotals(parsedTotals);
  }

  async function createPlan(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!newPlanTitle.trim()) {
      setError("Plan title is required.");
      return;
    }
    if (!newWeekStart || !newWeekEnd || newWeekEnd < newWeekStart) {
      setError("Choose a valid week range.");
      return;
    }

    const { data, error: createError } = await supabase
      .from("weekly_plans")
      .insert([
        {
          title: newPlanTitle.trim(),
          week_start: newWeekStart,
          week_end: newWeekEnd,
          archived_at: null,
        },
      ])
      .select("id,title,week_start,week_end,archived_at")
      .single();

    if (createError) {
      setError(createError.message);
      return;
    }

    const created = data as WeeklyPlan;
    setPlans((prev) => [created, ...prev]);
    setSelectedPlanId(created.id);
    setSuccess("Weekly plan created.");
  }

  async function addPlanItem(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedPlanId) {
      setError("Select a weekly plan first.");
      return;
    }
    if (!itemRecipeId) {
      setError("Select a recipe.");
      return;
    }
    if (!(itemQty > 0)) {
      setError("Quantity must be greater than 0.");
      return;
    }

    const { error: itemError } = await supabase.from("plan_items").insert([
      {
        plan_id: selectedPlanId,
        recipe_id: itemRecipeId,
        qty: itemQty,
      },
    ]);

    if (itemError) {
      setError(itemError.message);
      return;
    }

    await loadPlanItems(selectedPlanId);
    setItemQty(1);
    setSuccess("Recipe added to plan.");
  }

  async function removePlanItem(itemId: string) {
    setError(null);
    setSuccess(null);

    const { error: removeError } = await supabase.from("plan_items").delete().eq("id", itemId);
    if (removeError) {
      setError(removeError.message);
      return;
    }

    const remaining = planItems.filter((item) => item.id !== itemId);
    setPlanItems(remaining);
    await recalculateTotals(remaining);
    setSuccess("Plan item removed.");
  }

  async function setPlanArchived(planId: string, archived: boolean) {
    setError(null);
    setSuccess(null);

    const { error: archiveError } = await supabase
      .from("weekly_plans")
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq("id", planId);

    if (archiveError) {
      setError(archiveError.message);
      return;
    }

    await loadPlansAndRecipes();
    if (archived && selectedPlanId === planId) {
      const next = plans.find((p) => p.id !== planId && !p.archived_at);
      setSelectedPlanId(next?.id ?? null);
    }
    setSuccess(archived ? "Plan archived." : "Plan restored.");
  }

  const activePlans = plans.filter((plan) => !plan.archived_at);
  const archivedPlans = plans.filter((plan) => !!plan.archived_at);
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18 }}>
      <aside style={{ display: "grid", gap: 18 }}>
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            boxShadow: "0 14px 32px rgba(17, 24, 39, 0.06)",
            padding: 20,
          }}
        >
          <h2 style={{ margin: "0 0 10px" }}>Weekly Plans</h2>
          {loading && <p style={{ margin: 0, color: "#4b5563" }}>Loading...</p>}
          {!loading && activePlans.length === 0 && (
            <p style={{ margin: 0, color: "#4b5563" }}>No plans yet. Create one below.</p>
          )}
          <div style={{ display: "grid", gap: 8 }}>
            {activePlans.map((plan) => {
              const active = selectedPlanId === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: active ? "1px solid #111827" : "1px solid #d1d5db",
                    background: active ? "#f3f4f6" : "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  <strong>{plan.title}</strong>
                  <div style={{ color: "#6b7280", fontSize: 12 }}>
                    {plan.week_start} - {plan.week_end}
                  </div>
                </button>
              );
            })}
          </div>
          {archivedPlans.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <h3 style={{ margin: "10px 0 8px", fontSize: 14, color: "#6b7280" }}>Archived</h3>
              <div style={{ display: "grid", gap: 8 }}>
                {archivedPlans.map((plan) => (
                  <div
                    key={plan.id}
                    style={{
                      border: "1px solid #d1d5db",
                      borderRadius: 10,
                      padding: "8px 10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ color: "#6b7280" }}>{plan.title}</span>
                    <button
                      type="button"
                      onClick={() => void setPlanArchived(plan.id, false)}
                      style={{
                        border: "1px solid #d1d5db",
                        background: "#fff",
                        borderRadius: 8,
                        padding: "6px 8px",
                        cursor: "pointer",
                      }}
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            boxShadow: "0 14px 32px rgba(17, 24, 39, 0.06)",
            padding: 20,
          }}
        >
          <h2 style={{ margin: "0 0 10px" }}>New Weekly Plan</h2>
          <form onSubmit={createPlan} style={{ display: "grid", gap: 10 }}>
            <input
              value={newPlanTitle}
              onChange={(e) => setNewPlanTitle(e.target.value)}
              placeholder="Plan title"
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input
                type="date"
                value={newWeekStart}
                onChange={(e) => setNewWeekStart(e.target.value)}
                required
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
              />
              <input
                type="date"
                value={newWeekEnd}
                onChange={(e) => setNewWeekEnd(e.target.value)}
                required
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
              />
            </div>
            <button
              type="submit"
              style={{
                width: "fit-content",
                padding: "10px 12px",
                borderRadius: 10,
                border: "none",
                background: "var(--hk-button)",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Create plan
            </button>
          </form>
        </section>
      </aside>

      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          boxShadow: "0 14px 32px rgba(17, 24, 39, 0.06)",
          padding: 20,
        }}
      >
        <h2 style={{ marginTop: 0 }}>{selectedPlan?.title ?? "Select a weekly plan"}</h2>
        {selectedPlan && (
          <>
            <p style={{ margin: "0 0 8px", color: "#6b7280" }}>
              Week range: {selectedPlan.week_start} - {selectedPlan.week_end}
            </p>
            <div style={{ marginBottom: 10 }}>
              <button
                type="button"
                onClick={() => void setPlanArchived(selectedPlan.id, true)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Archive plan
              </button>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "16px 0" }} />

            <h3 style={{ marginTop: 0 }}>Add Recipe to Plan</h3>
            <form onSubmit={addPlanItem} style={{ display: "grid", gap: 10, marginBottom: 16 }}>
              <select
                value={itemRecipeId}
                onChange={(e) => setItemRecipeId(e.target.value)}
                required
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
              >
                <option value="">Select recipe</option>
                {recipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.title} ({recipe.yield_qty ?? 1} {recipe.yield_unit ?? "batch"})
                  </option>
                ))}
              </select>

              <input
                type="number"
                min={0.01}
                step="0.01"
                value={itemQty}
                onChange={(e) => setItemQty(Number(e.target.value))}
                required
                style={{ width: "220px", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
              />

              <button
                type="submit"
                style={{
                  width: "fit-content",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: "var(--hk-button)",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Add to plan
              </button>
            </form>

            <h3 style={{ marginBottom: 10 }}>Planned Recipes</h3>
            {planItems.length === 0 ? (
              <p style={{ margin: 0, color: "#4b5563" }}>No recipes added yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
                {planItems.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      border: "1px solid #e5e7eb",
                      borderRadius: 10,
                      padding: "10px 12px",
                    }}
                  >
                    <div>
                      <strong>{item.recipes?.title ?? "Unknown recipe"}</strong>
                      <div style={{ color: "#4b5563" }}>
                        {item.qty} batch{item.qty === 1 ? "" : "es"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void removePlanItem(item.id)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        background: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <h3 style={{ marginBottom: 10 }}>Aggregate Ingredient Totals</h3>
            {totals.length === 0 ? (
              <p style={{ margin: 0, color: "#4b5563" }}>No totals yet. Add planned recipes first.</p>
            ) : (
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
          </>
        )}
      </section>

      {(error || success) && (
        <div style={{ gridColumn: "1 / -1" }}>
          {error && <p style={{ margin: 0, color: "#b91c1c" }}>{error}</p>}
          {success && <p style={{ margin: 0, color: "#065f46" }}>{success}</p>}
        </div>
      )}
    </div>
  );
}
