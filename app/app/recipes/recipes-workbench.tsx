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

export default function RecipesWorkbench() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const isMobile = useMobile(980);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeLines, setRecipeLines] = useState<RecipeLine[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<RecipeCategory>("bread");
  const [newYieldQty, setNewYieldQty] = useState<string>("1");
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
  const [inlineIngredientQty, setInlineIngredientQty] = useState<string>("");
  const [inlineIngredientLineUnit, setInlineIngredientLineUnit] = useState<UnitOption>("g");

  const [lineIngredientId, setLineIngredientId] = useState("");
  const [lineQtyInput, setLineQtyInput] = useState<string>("");
  const [lineUnit, setLineUnit] = useState<string>("g");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scaleOutputQty, setScaleOutputQty] = useState<number>(1);
  const [recipeAllergenTags, setRecipeAllergenTags] = useState<AllergenTag[]>([]);
  const [recipeDietaryTags, setRecipeDietaryTags] = useState<DietaryTag[]>([]);
  const [allergenFilters, setAllergenFilters] = useState<AllergenTag[]>([]);
  const [dietaryFilters, setDietaryFilters] = useState<DietaryTag[]>([]);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.sessionStorage.getItem("hk-hide-create-recipe-modal") !== "1";
  });
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState<RecipeCategory>("bread");
  const [editYieldQty, setEditYieldQty] = useState<string>("1");
  const [editYieldUnit, setEditYieldUnit] = useState("batch");
  const [editFermentationMinutes, setEditFermentationMinutes] = useState<string>("");
  const [editProofMinutes, setEditProofMinutes] = useState<string>("");
  const [editBakeTempF, setEditBakeTempF] = useState<string>("");
  const [editBakeMinutes, setEditBakeMinutes] = useState<string>("");
  const [editDescription, setEditDescription] = useState("");
  const [editInstructions, setEditInstructions] = useState("");

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId) ?? null;
  const selectedIngredient = ingredients.find((i) => i.id === lineIngredientId) ?? null;

  useEffect(() => {
    void loadRecipesAndIngredients();
  }, []);

  function hideCreateRecipeModal() {
    setShowCreateForm(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("hk-hide-create-recipe-modal", "1");
    }
  }

  useEffect(() => {
    if (selectedRecipeId) {
      void loadRecipeLines(selectedRecipeId);
    } else {
      setRecipeLines([]);
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
    setEditTitle(selectedRecipe.title ?? "");
    setEditCategory((selectedRecipe.category as RecipeCategory) ?? "bread");
    setEditYieldQty(String(selectedRecipe.yield_qty ?? 1));
    setEditYieldUnit(selectedRecipe.yield_unit ?? "batch");
    setEditFermentationMinutes(
      selectedRecipe.fermentation_minutes === null ? "" : String(selectedRecipe.fermentation_minutes)
    );
    setEditProofMinutes(selectedRecipe.proof_minutes === null ? "" : String(selectedRecipe.proof_minutes));
    setEditBakeTempF(selectedRecipe.bake_temp_f === null ? "" : String(selectedRecipe.bake_temp_f));
    setEditBakeMinutes(selectedRecipe.bake_minutes === null ? "" : String(selectedRecipe.bake_minutes));
    setEditDescription(selectedRecipe.description ?? "");
    setEditInstructions(selectedRecipe.instructions ?? "");
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

  async function createRecipe(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const title = newTitle.trim();
    if (title.length < 2) {
      setError("Recipe title must be at least 2 characters.");
      return;
    }
    const parsedYieldQty = Number.parseFloat(newYieldQty);
    if (!(parsedYieldQty > 0)) {
      setError("Yield quantity must be greater than 0.");
      return;
    }

    const { data, error: insertError } = await supabase
      .from("recipes")
      .insert([
        {
          name: title,
          title,
          category: newCategory,
          yield_qty: parsedYieldQty,
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
    setNewYieldQty("1");
    setNewYieldUnit("batch");
    setNewFermentationMinutes("");
    setNewProofMinutes("");
    setNewBakeTempF("");
    setNewBakeMinutes("");
    setNewAllergenTags([]);
    setNewDietaryTags([]);
    setNewDescription("");
    setNewInstructions("");
    hideCreateRecipeModal();
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
      "Delete this recipe permanently? This will remove plan references too."
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
    }

    setSuccess("Recipe permanently deleted.");
  }

  function toggleTag<T extends string>(setFn: Dispatch<SetStateAction<T[]>>, tag: T) {
    setFn((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
  }

  async function saveSelectedRecipeDetails() {
    if (!selectedRecipeId) return;
    setError(null);
    setSuccess(null);

    const parsedYieldQty = Number.parseFloat(editYieldQty);
    if (!editTitle.trim()) {
      setError("Recipe title is required.");
      return;
    }
    if (!(parsedYieldQty > 0)) {
      setError("Yield quantity must be greater than 0.");
      return;
    }

    const { error: updateError } = await supabase
      .from("recipes")
      .update({
        name: editTitle.trim(),
        title: editTitle.trim(),
        category: editCategory,
        yield_qty: parsedYieldQty,
        yield_unit: editYieldUnit.trim() || "batch",
        fermentation_minutes: editFermentationMinutes ? Number(editFermentationMinutes) : null,
        proof_minutes: editProofMinutes ? Number(editProofMinutes) : null,
        bake_temp_f: editBakeTempF ? Number(editBakeTempF) : null,
        bake_minutes: editBakeMinutes ? Number(editBakeMinutes) : null,
        description: editDescription.trim() || null,
        instructions: editInstructions.trim() || null,
        allergen_tags: recipeAllergenTags,
        dietary_tags: recipeDietaryTags,
      })
      .eq("id", selectedRecipeId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadRecipesAndIngredients();
    setSuccess("Recipe details and tags updated.");
  }

  async function addIngredientAndLine(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedRecipeId) {
      setError("Select a recipe first.");
      return;
    }

    const name = inlineIngredientName.trim();
    if (name.length < 2) {
      setError("Ingredient name must be at least 2 characters.");
      return;
    }
    const parsedQty = Number.parseFloat(inlineIngredientQty);
    if (!(parsedQty > 0)) {
      setError("New ingredient quantity must be greater than 0.");
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

    const { error: lineError } = await supabase.from("recipe_lines").insert([
      {
        recipe_id: selectedRecipeId,
        ingredient_id: created.id,
        qty: parsedQty,
        unit: inlineIngredientLineUnit || created.unit_type,
      },
    ]);

    if (lineError) {
      setError(lineError.message);
      return;
    }

    await loadRecipeLines(selectedRecipeId);
    setInlineIngredientName("");
    setInlineIngredientUnit("g");
    setInlineIngredientQty("");
    setInlineIngredientLineUnit("g");
    setSuccess("Ingredient created and added to this recipe.");
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
    const parsedQty = Number.parseFloat(lineQtyInput);
    if (!(parsedQty > 0)) {
      setError("Quantity must be greater than 0.");
      return;
    }

    const { error: insertError } = await supabase.from("recipe_lines").insert([
      {
        recipe_id: selectedRecipeId,
        ingredient_id: lineIngredientId,
        qty: parsedQty,
        unit: lineUnit || null,
      },
    ]);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    await loadRecipeLines(selectedRecipeId);
    setLineQtyInput("");
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
              onClick={() => setShowCreateForm(true)}
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor: "pointer",
                marginBottom: 10,
              }}
            >
              New Recipe
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
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: "12px",
                marginBottom: 12,
                background: "#fffdfa",
                display: "grid",
                gap: 10,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16 }}>Recipe Details</h3>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, color: "#4b5563" }}>Recipe title</span>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, color: "#4b5563" }}>Category</span>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as RecipeCategory)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                >
                  {RECIPE_CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 160px", gap: 10 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "#4b5563" }}>Yield quantity</span>
                  <input
                    type="number"
                    min={0.01}
                    step="0.01"
                    value={editYieldQty}
                    onChange={(e) => setEditYieldQty(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                  />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "#4b5563" }}>Yield unit</span>
                  <input
                    value={editYieldUnit}
                    onChange={(e) => setEditYieldUnit(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                  />
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "#4b5563" }}>Fermentation minutes</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={editFermentationMinutes}
                    onChange={(e) => setEditFermentationMinutes(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                  />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "#4b5563" }}>Proof minutes</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={editProofMinutes}
                    onChange={(e) => setEditProofMinutes(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                  />
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "#4b5563" }}>Bake temperature (F)</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={editBakeTempF}
                    onChange={(e) => setEditBakeTempF(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                  />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "#4b5563" }}>Bake minutes</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={editBakeMinutes}
                    onChange={(e) => setEditBakeMinutes(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                  />
                </label>
              </div>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, color: "#4b5563" }}>Description (optional)</span>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, color: "#4b5563" }}>Instructions</span>
                <textarea
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  rows={4}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                />
              </label>
            </div>
            <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
              <div style={{ color: "#374151", fontWeight: 600 }}>Tags (saved with recipe details)</div>
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
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => void saveSelectedRecipeDetails()}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Save recipe details
                </button>
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
            <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
              <form
                onSubmit={addRecipeLine}
                style={{
                  display: "grid",
                  gap: 10,
                  padding: "12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 10,
                  background: "#ffffff",
                }}
              >
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: 16 }}>Use existing ingredient</h4>
                  <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
                    Pick an ingredient, set quantity and unit, then add the line.
                  </p>
                </div>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "#4b5563" }}>Ingredient</span>
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
                </label>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 180px", gap: 10 }}>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 13, color: "#4b5563" }}>Quantity</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0.01}
                      step="0.01"
                      placeholder="e.g. 45"
                      value={lineQtyInput}
                      onChange={(e) => setLineQtyInput(e.target.value)}
                      required
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                    />
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 13, color: "#4b5563" }}>Unit</span>
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
                  </label>
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

              <form
                onSubmit={addIngredientAndLine}
                style={{
                  display: "grid",
                  gap: 10,
                  padding: "12px",
                  border: "1px dashed #d1d5db",
                  borderRadius: 10,
                  background: "#fffdfa",
                }}
              >
                <div>
                  <h4 style={{ margin: "0 0 4px", fontSize: 16 }}>Create and add new ingredient</h4>
                  <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
                    This creates the ingredient in your library and adds it to this recipe at once.
                  </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr", gap: 10 }}>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 13, color: "#4b5563" }}>Ingredient name</span>
                    <input
                      placeholder="e.g. Bread flour"
                      value={inlineIngredientName}
                      onChange={(e) => setInlineIngredientName(e.target.value)}
                      required
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                    />
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 13, color: "#4b5563" }}>Canonical unit</span>
                    <select
                      value={inlineIngredientUnit}
                      onChange={(e) => {
                        const next = e.target.value as UnitOption;
                        setInlineIngredientUnit(next);
                        setInlineIngredientLineUnit(next);
                      }}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                    >
                      {UNIT_OPTIONS.map((unit) => (
                        <option key={`inline-base-${unit}`} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 180px", gap: 10 }}>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 13, color: "#4b5563" }}>Starting quantity for this recipe</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0.01}
                      step="0.01"
                      placeholder="e.g. 45"
                      value={inlineIngredientQty}
                      onChange={(e) => setInlineIngredientQty(e.target.value)}
                      required
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                    />
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span style={{ fontSize: 13, color: "#4b5563" }}>Line unit</span>
                    <select
                      value={inlineIngredientLineUnit}
                      onChange={(e) => setInlineIngredientLineUnit(e.target.value as UnitOption)}
                      style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                    >
                      {UNIT_OPTIONS.map((unit) => (
                        <option key={`inline-line-${unit}`} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <button
                  type="submit"
                  style={{
                    width: "fit-content",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    cursor: "pointer",
                  }}
                >
                  Add ingredient + line
                </button>
              </form>
            </div>

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

      {showCreateForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(17, 24, 39, 0.35)",
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <section
            style={{
              width: "100%",
              maxWidth: 760,
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              border: "1px solid #d1d5db",
              borderRadius: 14,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
              padding: 18,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <h2 style={{ margin: 0 }}>New Recipe</h2>
              <button
                type="button"
                onClick={hideCreateRecipeModal}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  border: "1px solid #d1d5db",
                  background: "#fff",
                  fontSize: 20,
                  lineHeight: "20px",
                  cursor: "pointer",
                }}
                aria-label="Close new recipe form"
              >
                ×
              </button>
            </div>
            <p style={{ margin: "8px 0 12px", color: "#4b5563" }}>
              Add a recipe with clear steps so anyone on your team can follow the process.
            </p>
            {error && <p style={{ margin: "0 0 10px", color: "#b91c1c" }}>{error}</p>}
            <form onSubmit={createRecipe} style={{ display: "grid", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, color: "#4b5563" }}>Recipe title</span>
                <input
                  placeholder="e.g. Country Sourdough"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, color: "#4b5563" }}>Category</span>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as RecipeCategory)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                >
                  {RECIPE_CATEGORY_OPTIONS.map((category) => (
                    <option key={`modal-${category}`} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 140px", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, color: "#4b5563" }}>Yield quantity</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0.01}
                  step="0.01"
                  value={newYieldQty}
                  onChange={(e) => setNewYieldQty(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                />
              </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "#4b5563" }}>Yield unit</span>
                  <input
                    value={newYieldUnit}
                    onChange={(e) => setNewYieldUnit(e.target.value)}
                    placeholder="e.g. loaf"
                    required
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                  />
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "#4b5563" }}>Fermentation minutes</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={newFermentationMinutes}
                    onChange={(e) => setNewFermentationMinutes(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                  />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "#4b5563" }}>Proof minutes</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={newProofMinutes}
                    onChange={(e) => setNewProofMinutes(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                  />
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "#4b5563" }}>Bake temperature (F)</span>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={newBakeTempF}
                    onChange={(e) => setNewBakeTempF(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                  />
                </label>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 13, color: "#4b5563" }}>Bake minutes</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={newBakeMinutes}
                    onChange={(e) => setNewBakeMinutes(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                  />
                </label>
              </div>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, color: "#4b5563" }}>Description (optional)</span>
                <textarea
                  placeholder="What is this recipe for?"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 13, color: "#4b5563" }}>Instructions</span>
                <textarea
                  placeholder="Write clear step-by-step baking directions."
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  rows={6}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
                />
              </label>
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
          </section>
        </div>
      )}

      {(error || success) && (
        <div style={{ gridColumn: "1 / -1" }}>
          {error && <p style={{ margin: 0, color: "#b91c1c" }}>{error}</p>}
          {success && <p style={{ margin: 0, color: "#065f46" }}>{success}</p>}
        </div>
      )}
    </div>
  );
}
