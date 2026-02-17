"use client";

import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { UNIT_OPTIONS, type UnitOption } from "@/lib/units";
import { RECIPE_CATEGORY_OPTIONS, type RecipeCategory } from "@/lib/recipe-categories";
import {
  ALLERGEN_TAG_OPTIONS,
  DIETARY_TAG_OPTIONS,
  type AllergenTag,
  type DietaryTag,
} from "@/lib/recipe-tags";
import { useMobile } from "@/lib/use-mobile";

type Recipe = {
  id: string;
  title: string;
  category: string | null;
  yield_qty: number | null;
  yield_unit: string | null;
  description: string | null;
  instructions: string | null;
  archived_at: string | null;
  fermentation_minutes: number | null;
  proof_minutes: number | null;
  bake_temp_f: number | null;
  bake_minutes: number | null;
  allergen_tags: string[];
  dietary_tags: string[];
};

type Ingredient = {
  id: string;
  name: string;
  unit_type: string;
  owner_id: string | null;
};

type RecipeLine = {
  id: string;
  ingredient_id: string;
  qty: number;
  unit: string | null;
  ingredients: {
    name: string;
    unit_type: string;
  } | null;
};

type RecipeVersion = {
  id: string;
  version_number: number;
  created_at: string;
  note: string | null;
  title: string;
  yield_qty: number;
  yield_unit: string;
  ingredient_lines: Array<{
    ingredient_id: string;
    ingredient_name: string;
    qty: number;
    unit: string | null;
    canonical_unit: string | null;
  }>;
};

export default function RecipesWorkbench() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const isMobile = useMobile(980);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeLines, setRecipeLines] = useState<RecipeLine[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<RecipeCategory>("bread");
  const [newYieldQty, setNewYieldQty] = useState<number>(1);
  const [newYieldUnit, setNewYieldUnit] = useState("batch");
  const [newFermentationMinutes, setNewFermentationMinutes] = useState<string>("");
  const [newProofMinutes, setNewProofMinutes] = useState<string>("");
  const [newBakeTempF, setNewBakeTempF] = useState<string>("");
  const [newBakeMinutes, setNewBakeMinutes] = useState<string>("");
  const [newAllergenTags, setNewAllergenTags] = useState<AllergenTag[]>([]);
  const [newDietaryTags, setNewDietaryTags] = useState<DietaryTag[]>([]);
  const [newDescription, setNewDescription] = useState("");
  const [newInstructions, setNewInstructions] = useState("");

  const [inlineIngredientName, setInlineIngredientName] = useState("");
  const [inlineIngredientUnit, setInlineIngredientUnit] = useState<UnitOption>("g");

  const [lineIngredientId, setLineIngredientId] = useState("");
  const [lineQty, setLineQty] = useState<number>(1);
  const [lineUnit, setLineUnit] = useState<string>("g");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scaleOutputQty, setScaleOutputQty] = useState<number>(1);
  const [recipeAllergenTags, setRecipeAllergenTags] = useState<AllergenTag[]>([]);
  const [recipeDietaryTags, setRecipeDietaryTags] = useState<DietaryTag[]>([]);
  const [allergenFilters, setAllergenFilters] = useState<AllergenTag[]>([]);
  const [dietaryFilters, setDietaryFilters] = useState<DietaryTag[]>([]);
  const [recipeVersions, setRecipeVersions] = useState<RecipeVersion[]>([]);
  const [versionNote, setVersionNote] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId) ?? null;
  const selectedIngredient = ingredients.find((i) => i.id === lineIngredientId) ?? null;

  useEffect(() => {
    void loadRecipesAndIngredients();
  }, []);

  useEffect(() => {
    if (selectedRecipeId) {
      void loadRecipeLines(selectedRecipeId);
      void loadRecipeVersions(selectedRecipeId);
    } else {
      setRecipeLines([]);
      setRecipeVersions([]);
    }
  }, [selectedRecipeId]);

  useEffect(() => {
    if (selectedIngredient?.unit_type) {
      setLineUnit(selectedIngredient.unit_type);
    }
  }, [selectedIngredient?.id, selectedIngredient?.unit_type]);

  useEffect(() => {
    if (!selectedRecipe) return;
    setRecipeAllergenTags((selectedRecipe.allergen_tags ?? []) as AllergenTag[]);
    setRecipeDietaryTags((selectedRecipe.dietary_tags ?? []) as DietaryTag[]);
  }, [selectedRecipe?.id]);

  async function loadRecipesAndIngredients() {
    setLoading(true);
    setError(null);

    const [{ data: recipeData, error: recipeError }, { data: ingredientData, error: ingredientError }] =
      await Promise.all([
        supabase
          .from("recipes")
          .select(
            "id,title,category,yield_qty,yield_unit,description,instructions,archived_at,fermentation_minutes,proof_minutes,bake_temp_f,bake_minutes,allergen_tags,dietary_tags"
          )
          .order("title", { ascending: true }),
        supabase
          .from("ingredients")
          .select("id,name,unit_type,owner_id")
          .order("name", { ascending: true }),
      ]);

    setLoading(false);

    if (recipeError || ingredientError) {
      setError(recipeError?.message ?? ingredientError?.message ?? "Failed to load recipes.");
      return;
    }

    const parsedRecipes = (recipeData ?? []) as Recipe[];
    const parsedIngredients = (ingredientData ?? []) as Ingredient[];

    setRecipes(parsedRecipes);
    setIngredients(parsedIngredients);

    const firstActive = parsedRecipes.find((r) => !r.archived_at);
    if (!selectedRecipeId && firstActive) {
      setSelectedRecipeId(firstActive.id);
    }
  }

  async function loadRecipeLines(recipeId: string) {
    const { data, error: lineError } = await supabase
      .from("recipe_lines")
      .select("id,ingredient_id,qty,unit,ingredients(name,unit_type)")
      .eq("recipe_id", recipeId)
      .order("id", { ascending: true });

    if (lineError) {
      setError(lineError.message);
      return;
    }

    setRecipeLines((data ?? []) as unknown as RecipeLine[]);
  }

  async function loadRecipeVersions(recipeId: string) {
    const { data, error: versionError } = await supabase
      .from("recipe_versions")
      .select("id,version_number,created_at,note,title,yield_qty,yield_unit,ingredient_lines")
      .eq("recipe_id", recipeId)
      .order("version_number", { ascending: false });

    if (versionError) {
      setError(versionError.message);
      return;
    }

    setRecipeVersions((data ?? []) as unknown as RecipeVersion[]);
  }

  async function createVersionSnapshot(recipeId: string, note: string) {
    const { error: snapshotError } = await supabase.rpc("create_recipe_version", {
      p_recipe_id: recipeId,
      p_note: note || null,
    });

    if (snapshotError) {
      // If migrations are not applied yet, keep core UI actions working.
      console.warn("create_recipe_version failed:", snapshotError.message);
      return false;
    }

    await loadRecipeVersions(recipeId);
    return true;
  }

  async function restoreVersion(versionId: string) {
    if (!selectedRecipeId) return;
    setError(null);
    setSuccess(null);

    const { error: restoreError } = await supabase.rpc("restore_recipe_version", {
      p_version_id: versionId,
    });

    if (restoreError) {
      setError(restoreError.message);
      return;
    }

    await loadRecipesAndIngredients();
    await loadRecipeLines(selectedRecipeId);
    await loadRecipeVersions(selectedRecipeId);
    setSuccess("Recipe restored from selected version.");
  }

  async function saveVersionManually() {
    if (!selectedRecipeId) return;
    setError(null);
    setSuccess(null);

    const ok = await createVersionSnapshot(selectedRecipeId, versionNote.trim() || "Manual snapshot");
    if (!ok) {
      setError("Could not save version snapshot. Make sure Phase 6 SQL migration has been run.");
      return;
    }

    setVersionNote("");
    setSuccess("Version snapshot saved.");
  }

  async function createRecipe(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const title = newTitle.trim();
    if (title.length < 2) {
      setError("Recipe title must be at least 2 characters.");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("recipes")
      .insert([
        {
          title,
          category: newCategory,
          yield_qty: newYieldQty,
          yield_unit: newYieldUnit.trim() || "batch",
          fermentation_minutes: newFermentationMinutes ? Number(newFermentationMinutes) : null,
          proof_minutes: newProofMinutes ? Number(newProofMinutes) : null,
          bake_temp_f: newBakeTempF ? Number(newBakeTempF) : null,
          bake_minutes: newBakeMinutes ? Number(newBakeMinutes) : null,
          allergen_tags: newAllergenTags,
          dietary_tags: newDietaryTags,
          description: newDescription.trim() || null,
          instructions: newInstructions.trim() || null,
          archived_at: null,
        },
      ])
      .select(
        "id,title,category,yield_qty,yield_unit,description,instructions,archived_at,fermentation_minutes,proof_minutes,bake_temp_f,bake_minutes,allergen_tags,dietary_tags"
      )
      .single();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    const created = data as Recipe;
    setRecipes((prev) => [...prev, created].sort((a, b) => a.title.localeCompare(b.title)));
    setSelectedRecipeId(created.id);
    setNewTitle("");
    setNewCategory("bread");
    setNewYieldQty(1);
    setNewYieldUnit("batch");
    setNewFermentationMinutes("");
    setNewProofMinutes("");
    setNewBakeTempF("");
    setNewBakeMinutes("");
    setNewAllergenTags([]);
    setNewDietaryTags([]);
    setNewDescription("");
    setNewInstructions("");
    setSuccess("Recipe created.");
  }

  async function setRecipeArchived(recipeId: string, archived: boolean) {
    setError(null);
    setSuccess(null);

    const { error: updateError } = await supabase
      .from("recipes")
      .update({ archived_at: archived ? new Date().toISOString() : null })
      .eq("id", recipeId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadRecipesAndIngredients();

    if (archived && selectedRecipeId === recipeId) {
      const { data: nextActive } = await supabase
        .from("recipes")
        .select("id")
        .is("archived_at", null)
        .order("title", { ascending: true })
        .limit(1)
        .maybeSingle();
      setSelectedRecipeId(nextActive?.id ?? null);
    }

    setSuccess(archived ? "Recipe archived." : "Recipe restored.");
  }

  async function deleteRecipePermanently(recipeId: string) {
    const confirmed = window.confirm(
      "Delete this recipe permanently? This will remove its version history and plan references."
    );
    if (!confirmed) return;

    setError(null);
    setSuccess(null);

    // Remove plan references first because plan_items.recipe_id is NO ACTION.
    {
      const { error: planItemError } = await supabase.from("plan_items").delete().eq("recipe_id", recipeId);
      if (planItemError) {
        setError(planItemError.message);
        return;
      }
    }

    {
      const { error: versionsError } = await supabase.from("recipe_versions").delete().eq("recipe_id", recipeId);
      if (versionsError) {
        setError(versionsError.message);
        return;
      }
    }

    {
      const { error: recipeError } = await supabase.from("recipes").delete().eq("id", recipeId);
      if (recipeError) {
        setError(recipeError.message);
        return;
      }
    }

    await loadRecipesAndIngredients();
    if (selectedRecipeId === recipeId) {
      const next = recipes.find((r) => r.id !== recipeId && !r.archived_at);
      setSelectedRecipeId(next?.id ?? null);
      setRecipeLines([]);
      setRecipeVersions([]);
    }

    setSuccess("Recipe permanently deleted.");
  }

  async function deleteRecipeVersion(versionId: string) {
    const confirmed = window.confirm("Delete this version snapshot?");
    if (!confirmed) return;
    setError(null);
    setSuccess(null);

    const { error: deleteError } = await supabase.from("recipe_versions").delete().eq("id", versionId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    if (selectedRecipeId) {
      await loadRecipeVersions(selectedRecipeId);
    }
    setSuccess("Version deleted.");
    window.location.reload();
  }

  function toggleTag<T extends string>(setFn: Dispatch<SetStateAction<T[]>>, tag: T) {
    setFn((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
  }

  async function saveSelectedRecipeTags() {
    if (!selectedRecipeId) return;
    setError(null);
    setSuccess(null);

    const { error: updateError } = await supabase
      .from("recipes")
      .update({
        allergen_tags: recipeAllergenTags,
        dietary_tags: recipeDietaryTags,
      })
      .eq("id", selectedRecipeId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadRecipesAndIngredients();
    setSuccess("Recipe tags updated.");
  }

  async function addInlineIngredient(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const name = inlineIngredientName.trim();
    if (name.length < 2) {
      setError("Ingredient name must be at least 2 characters.");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("ingredients")
      .insert([{ name, unit_type: inlineIngredientUnit }])
      .select("id,name,unit_type,owner_id")
      .single();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    const created = data as Ingredient;
    const updated = [...ingredients, created].sort((a, b) => a.name.localeCompare(b.name));
    setIngredients(updated);
    setLineIngredientId(created.id);
    setLineUnit(created.unit_type);
    setInlineIngredientName("");
    setInlineIngredientUnit("g");
    setSuccess("Ingredient added.");
  }

  async function addRecipeLine(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedRecipeId) {
      setError("Select a recipe first.");
      return;
    }
    if (!lineIngredientId) {
      setError("Select an ingredient.");
      return;
    }
    if (!(lineQty > 0)) {
      setError("Quantity must be greater than 0.");
      return;
    }

    const { error: insertError } = await supabase.from("recipe_lines").insert([
      {
        recipe_id: selectedRecipeId,
        ingredient_id: lineIngredientId,
        qty: lineQty,
        unit: lineUnit || null,
      },
    ]);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    await loadRecipeLines(selectedRecipeId);
    setLineQty(1);
    setSuccess("Ingredient line added.");
  }

  async function deleteRecipeLine(lineId: string) {
    setError(null);
    setSuccess(null);

    const { error: deleteError } = await supabase.from("recipe_lines").delete().eq("id", lineId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setRecipeLines((prev) => prev.filter((line) => line.id !== lineId));
    setSuccess("Line removed.");
  }

  const filteredRecipes = recipes.filter((recipe) => {
    const allergenOk =
      allergenFilters.length === 0 ||
      allergenFilters.some((tag) => (recipe.allergen_tags ?? []).includes(tag));
    const dietaryOk =
      dietaryFilters.length === 0 ||
      dietaryFilters.some((tag) => (recipe.dietary_tags ?? []).includes(tag));
    return allergenOk && dietaryOk;
  });
  const activeRecipes = filteredRecipes.filter((r) => !r.archived_at);
  const archivedRecipes = filteredRecipes.filter((r) => !!r.archived_at);
  const recipesByCategory = activeRecipes.reduce<Record<string, Recipe[]>>((acc, recipe) => {
    const key = recipe.category?.trim() || "uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(recipe);
    return acc;
  }, {});

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "minmax(280px, 360px) minmax(0, 1fr)",
        gap: 18,
      }}
    >
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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <h2 style={{ margin: "0 0 10px" }}>Your Recipes</h2>
            <button
              type="button"
              onClick={() => setShowCreateForm((prev) => !prev)}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor: "pointer",
                marginBottom: 10,
              }}
            >
              {showCreateForm ? "Hide New Recipe" : "Add New Recipe"}
            </button>
          </div>
          <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
            <div style={{ color: "#6b7280", fontSize: 13 }}>Filter by allergen tags</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {ALLERGEN_TAG_OPTIONS.map((tag) => {
                const active = allergenFilters.includes(tag);
                return (
                  <button
                    key={`allergen-filter-${tag}`}
                    type="button"
                    onClick={() => toggleTag(setAllergenFilters, tag)}
                    style={{
                      border: active ? "1px solid #111827" : "1px solid #d1d5db",
                      background: active ? "#f3f4f6" : "#fff",
                      borderRadius: 999,
                      padding: "6px 8px",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <div style={{ color: "#6b7280", fontSize: 13 }}>Filter by dietary tags</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {DIETARY_TAG_OPTIONS.map((tag) => {
                const active = dietaryFilters.includes(tag);
                return (
                  <button
                    key={`dietary-filter-${tag}`}
                    type="button"
                    onClick={() => toggleTag(setDietaryFilters, tag)}
                    style={{
                      border: active ? "1px solid #111827" : "1px solid #d1d5db",
                      background: active ? "#f3f4f6" : "#fff",
                      borderRadius: 999,
                      padding: "6px 8px",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
          {loading && <p style={{ margin: 0, color: "#4b5563" }}>Loading...</p>}
          {!loading && activeRecipes.length === 0 && (
            <p style={{ margin: 0, color: "#4b5563" }}>No recipes yet. Create your first one below.</p>
          )}
          <div style={{ display: "grid", gap: 10 }}>
            {Object.entries(recipesByCategory)
              .sort((a, b) => a[0].localeCompare(b[0]))
              .map(([category, categoryRecipes]) => (
                <div key={category} style={{ display: "grid", gap: 8 }}>
                  <h3 style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>{category}</h3>
                  {categoryRecipes.map((recipe) => {
                    const active = selectedRecipeId === recipe.id;
                    return (
                      <button
                        key={recipe.id}
                        type="button"
                        onClick={() => setSelectedRecipeId(recipe.id)}
                        style={{
                          textAlign: "left",
                          padding: "10px 12px",
                          borderRadius: 10,
                          border: active ? "1px solid #111827" : "1px solid #d1d5db",
                          background: active ? "#f3f4f6" : "#ffffff",
                          color: "#111827",
                          cursor: "pointer",
                        }}
                      >
                        {recipe.title}
                        {!!recipe.yield_qty && (
                          <span style={{ marginLeft: 8, color: "#6b7280", fontSize: 12 }}>
                            {recipe.yield_qty} {recipe.yield_unit ?? "batch"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
          </div>
          {archivedRecipes.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <h3 style={{ margin: "10px 0 8px", fontSize: 14, color: "#6b7280" }}>Archived</h3>
              <div style={{ display: "grid", gap: 8 }}>
                {archivedRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
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
                    <span style={{ color: "#6b7280" }}>{recipe.title}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => void setRecipeArchived(recipe.id, false)}
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
                      <button
                        type="button"
                        onClick={() => void deleteRecipePermanently(recipe.id)}
                        style={{
                          border: "1px solid #ef4444",
                          color: "#b91c1c",
                          background: "#fff",
                          borderRadius: 8,
                          padding: "6px 8px",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
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
          <h2 style={{ margin: "0 0 10px" }}>New Recipe</h2>
          <p style={{ margin: "0 0 10px", color: "#4b5563" }}>
            Add a recipe with clear steps so anyone on your team can follow the process.
          </p>
          {showCreateForm ? (
            <form onSubmit={createRecipe} style={{ display: "grid", gap: 10 }}>
            <input
              placeholder="Recipe title (e.g. Country Sourdough)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as RecipeCategory)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
            >
              {RECIPE_CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 140px", gap: 10 }}>
              <input
                type="number"
                min={0.01}
                step="0.01"
                value={newYieldQty}
                onChange={(e) => setNewYieldQty(Number(e.target.value))}
                required
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
              />
              <input
                value={newYieldUnit}
                onChange={(e) => setNewYieldUnit(e.target.value)}
                placeholder="yield unit (e.g. loaf)"
                required
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
              <input
                type="number"
                min={0}
                step={1}
                value={newFermentationMinutes}
                onChange={(e) => setNewFermentationMinutes(e.target.value)}
                placeholder="fermentation minutes"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
              />
              <input
                type="number"
                min={0}
                step={1}
                value={newProofMinutes}
                onChange={(e) => setNewProofMinutes(e.target.value)}
                placeholder="proof minutes"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
              <input
                type="number"
                min={1}
                step={1}
                value={newBakeTempF}
                onChange={(e) => setNewBakeTempF(e.target.value)}
                placeholder="bake temp (F)"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
              />
              <input
                type="number"
                min={0}
                step={1}
                value={newBakeMinutes}
                onChange={(e) => setNewBakeMinutes(e.target.value)}
                placeholder="bake minutes"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
              />
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ color: "#6b7280", fontSize: 13 }}>Allergen tags</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ALLERGEN_TAG_OPTIONS.map((tag) => {
                  const active = newAllergenTags.includes(tag);
                  return (
                    <button
                      key={`new-allergen-${tag}`}
                      type="button"
                      onClick={() => toggleTag(setNewAllergenTags, tag)}
                      style={{
                        border: active ? "1px solid #111827" : "1px solid #d1d5db",
                        background: active ? "#f3f4f6" : "#fff",
                        borderRadius: 999,
                        padding: "6px 8px",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ color: "#6b7280", fontSize: 13 }}>Dietary tags</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {DIETARY_TAG_OPTIONS.map((tag) => {
                  const active = newDietaryTags.includes(tag);
                  return (
                    <button
                      key={`new-dietary-${tag}`}
                      type="button"
                      onClick={() => toggleTag(setNewDietaryTags, tag)}
                      style={{
                        border: active ? "1px solid #111827" : "1px solid #d1d5db",
                        background: active ? "#f3f4f6" : "#fff",
                        borderRadius: 999,
                        padding: "6px 8px",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
            <textarea
              placeholder="Description (optional): what is this recipe for?"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
            />
            <textarea
              placeholder="Instructions (recommended): write clear step-by-step baking directions."
              value={newInstructions}
              onChange={(e) => setNewInstructions(e.target.value)}
              rows={6}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
            />
            <button
              type="submit"
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "none",
                background: "var(--hk-button)",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Create recipe
            </button>
            </form>
          ) : (
            <p style={{ margin: 0, color: "#6b7280" }}>Click “Add New Recipe” above to open the form.</p>
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
          <h2 style={{ margin: "0 0 10px" }}>Quick Add Ingredient</h2>
          <form onSubmit={addInlineIngredient} style={{ display: "grid", gap: 10 }}>
            <input
              placeholder="Ingredient name"
              value={inlineIngredientName}
              onChange={(e) => setInlineIngredientName(e.target.value)}
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
            />
            <select
              value={inlineIngredientUnit}
              onChange={(e) => setInlineIngredientUnit(e.target.value as UnitOption)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
            >
              {UNIT_OPTIONS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
            <button
              type="submit"
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                background: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Add ingredient
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
        <h2 style={{ marginTop: 0 }}>{selectedRecipe?.title ?? "Select a recipe"}</h2>
        {selectedRecipe && (
          <>
            <p style={{ margin: "0 0 8px", color: "#6b7280" }}>
              Category: {selectedRecipe.category ?? "uncategorized"}
            </p>
            <p style={{ margin: "0 0 8px", color: "#6b7280" }}>
              Yield: {selectedRecipe.yield_qty ?? 1} {selectedRecipe.yield_unit ?? "batch"}
            </p>
            <p style={{ margin: "0 0 8px", color: "#6b7280" }}>
              Prep: ferment {selectedRecipe.fermentation_minutes ?? "-"} min, proof{" "}
              {selectedRecipe.proof_minutes ?? "-"} min, bake {selectedRecipe.bake_temp_f ?? "-"} F for{" "}
              {selectedRecipe.bake_minutes ?? "-"} min
            </p>
            <p style={{ margin: "0 0 8px", color: "#6b7280" }}>
              Allergens: {(selectedRecipe.allergen_tags ?? []).join(", ") || "none"}
            </p>
            <p style={{ margin: "0 0 8px", color: "#6b7280" }}>
              Dietary: {(selectedRecipe.dietary_tags ?? []).join(", ") || "none"}
            </p>
            <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
              <div style={{ color: "#374151", fontWeight: 600 }}>Edit tags</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ALLERGEN_TAG_OPTIONS.map((tag) => {
                  const active = recipeAllergenTags.includes(tag);
                  return (
                    <button
                      key={`edit-allergen-${tag}`}
                      type="button"
                      onClick={() => toggleTag(setRecipeAllergenTags, tag)}
                      style={{
                        border: active ? "1px solid #111827" : "1px solid #d1d5db",
                        background: active ? "#f3f4f6" : "#fff",
                        borderRadius: 999,
                        padding: "6px 8px",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {DIETARY_TAG_OPTIONS.map((tag) => {
                  const active = recipeDietaryTags.includes(tag);
                  return (
                    <button
                      key={`edit-dietary-${tag}`}
                      type="button"
                      onClick={() => toggleTag(setRecipeDietaryTags, tag)}
                      style={{
                        border: active ? "1px solid #111827" : "1px solid #d1d5db",
                        background: active ? "#f3f4f6" : "#fff",
                        borderRadius: 999,
                        padding: "6px 8px",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => void saveSelectedRecipeTags()}
                style={{
                  width: "fit-content",
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                Save tags
              </button>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => void setRecipeArchived(selectedRecipe.id, true)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Archive recipe
                </button>
                <button
                  type="button"
                  onClick={() => void deleteRecipePermanently(selectedRecipe.id)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #ef4444",
                    color: "#b91c1c",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Delete permanently
                </button>
              </div>
            </div>
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "10px 12px",
                marginBottom: 12,
                background: "#fffdfa",
              }}
            >
              <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Version History</h3>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr auto", gap: 8, marginBottom: 10 }}>
                <input
                  type="text"
                  value={versionNote}
                  onChange={(e) => setVersionNote(e.target.value)}
                  placeholder="Snapshot note (optional)"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db" }}
                />
                <button
                  type="button"
                  onClick={() => void saveVersionManually()}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Save snapshot
                </button>
              </div>
              {recipeVersions.length === 0 ? (
                <p style={{ margin: 0, color: "#6b7280" }}>No versions yet.</p>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {recipeVersions.map((version) => (
                    <div
                      key={version.id}
                      style={{
                        border: "1px solid #d1d5db",
                        borderRadius: 8,
                        padding: "8px 10px",
                        display: "grid",
                        gap: 4,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                        <strong>
                          v{version.version_number} - {version.title}
                        </strong>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => void restoreVersion(version.id)}
                            style={{
                              padding: "6px 8px",
                              borderRadius: 8,
                              border: "1px solid #d1d5db",
                              background: "#fff",
                              cursor: "pointer",
                            }}
                          >
                            Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteRecipeVersion(version.id)}
                            style={{
                              padding: "6px 8px",
                              borderRadius: 8,
                              border: "1px solid #ef4444",
                              color: "#b91c1c",
                              background: "#fff",
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div style={{ color: "#6b7280", fontSize: 12 }}>
                        {new Date(version.created_at).toLocaleString()} - {version.note || "No note"}
                      </div>
                      <div style={{ color: "#6b7280", fontSize: 12 }}>
                        Yield: {version.yield_qty} {version.yield_unit} - Lines: {version.ingredient_lines?.length ?? 0}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ marginTop: 4 }}>
              <strong>Description</strong>
              <p style={{ margin: "4px 0 10px", color: "#4b5563" }}>
                {selectedRecipe.description?.trim() || "No description yet."}
              </p>
            </div>
            <div style={{ marginTop: 4 }}>
              <strong>Instructions</strong>
              <p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap", color: "#374151" }}>
                {selectedRecipe.instructions?.trim() || "No instructions yet."}
              </p>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #e5e7eb", margin: "16px 0" }} />

            <h3 style={{ marginTop: 0 }}>Add Ingredient Line</h3>
            <form onSubmit={addRecipeLine} style={{ display: "grid", gap: 10, marginBottom: 16 }}>
              <select
                value={lineIngredientId}
                onChange={(e) => setLineIngredientId(e.target.value)}
                required
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
              >
                <option value="">Select ingredient</option>
                {ingredients.map((ingredient) => (
                  <option key={ingredient.id} value={ingredient.id}>
                    {ingredient.name} ({ingredient.unit_type})
                  </option>
                ))}
              </select>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 180px", gap: 10 }}>
                <input
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={lineQty}
                  onChange={(e) => setLineQty(Number(e.target.value))}
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                />
                <select
                  value={lineUnit}
                  onChange={(e) => setLineUnit(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                >
                  {UNIT_OPTIONS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
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
                Add line
              </button>
            </form>

            <h3 style={{ marginBottom: 10 }}>Ingredient Lines</h3>
            {recipeLines.length === 0 ? (
              <p style={{ margin: 0, color: "#4b5563" }}>No ingredient lines yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
                {recipeLines.map((line) => (
                  <div
                    key={line.id}
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
                      <strong>{line.ingredients?.name ?? "Unknown ingredient"}</strong>
                      <div style={{ color: "#4b5563" }}>
                        {line.qty} {line.unit ?? line.ingredients?.unit_type ?? "unit"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteRecipeLine(line.id)}
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

            {recipeLines.length > 0 && (
              <>
                <h3 style={{ marginBottom: 10 }}>Scale Preview</h3>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "220px 1fr", gap: 10, marginBottom: 10 }}>
                  <input
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={scaleOutputQty}
                    onChange={(e) => setScaleOutputQty(Number(e.target.value))}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                  />
                  <div style={{ alignSelf: "center", color: "#4b5563" }}>
                    target {selectedRecipe.yield_unit ?? "batch"}
                  </div>
                </div>
                <div style={{ color: "#374151", marginBottom: 10 }}>
                  Scale factor:{" "}
                  {selectedRecipe.yield_qty && selectedRecipe.yield_qty > 0
                    ? (scaleOutputQty / selectedRecipe.yield_qty).toFixed(3)
                    : "1.000"}
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {recipeLines.map((line) => {
                    const factor =
                      selectedRecipe.yield_qty && selectedRecipe.yield_qty > 0
                        ? scaleOutputQty / selectedRecipe.yield_qty
                        : 1;
                    const scaledQty = Number(line.qty) * factor;
                    return (
                      <div key={`scaled-${line.id}`} style={{ color: "#374151" }}>
                        {(Math.round(scaledQty * 1000) / 1000).toString()}{" "}
                        {line.unit ?? line.ingredients?.unit_type ?? "unit"} {line.ingredients?.name ?? "Unknown"}
                      </div>
                    );
                  })}
                </div>
              </>
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
