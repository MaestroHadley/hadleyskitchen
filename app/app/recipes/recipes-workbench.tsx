"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { UNIT_OPTIONS, type UnitOption } from "@/lib/units";
import { RECIPE_CATEGORY_OPTIONS, type RecipeCategory } from "@/lib/recipe-categories";

type Recipe = {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  instructions: string | null;
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

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipeLines, setRecipeLines] = useState<RecipeLine[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<RecipeCategory>("bread");
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

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId) ?? null;
  const selectedIngredient = ingredients.find((i) => i.id === lineIngredientId) ?? null;

  useEffect(() => {
    void loadRecipesAndIngredients();
  }, []);

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

  async function loadRecipesAndIngredients() {
    setLoading(true);
    setError(null);

    const [{ data: recipeData, error: recipeError }, { data: ingredientData, error: ingredientError }] =
      await Promise.all([
        supabase
          .from("recipes")
          .select("id,title,category,description,instructions")
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

    if (!selectedRecipeId && parsedRecipes.length > 0) {
      setSelectedRecipeId(parsedRecipes[0].id);
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

    const { data, error: insertError } = await supabase
      .from("recipes")
      .insert([
        {
          title,
          category: newCategory,
          description: newDescription.trim() || null,
          instructions: newInstructions.trim() || null,
        },
      ])
      .select("id,title,category,description,instructions")
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
    setNewDescription("");
    setNewInstructions("");
    setSuccess("Recipe created.");
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
          <h2 style={{ margin: "0 0 10px" }}>Your Recipes</h2>
          {loading && <p style={{ margin: 0, color: "#4b5563" }}>Loading...</p>}
          {!loading && recipes.length === 0 && (
            <p style={{ margin: 0, color: "#4b5563" }}>No recipes yet. Create your first one below.</p>
          )}
          <div style={{ display: "grid", gap: 8 }}>
            {recipes.map((recipe) => {
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
                  {recipe.category && (
                    <span style={{ marginLeft: 8, color: "#6b7280", fontSize: 12 }}>
                      [{recipe.category}]
                    </span>
                  )}
                </button>
              );
            })}
          </div>
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
          <form onSubmit={createRecipe} style={{ display: "grid", gap: 10 }}>
            <input
              placeholder="Title"
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
            <textarea
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
            />
            <textarea
              placeholder="Instructions (optional)"
              value={newInstructions}
              onChange={(e) => setNewInstructions(e.target.value)}
              rows={5}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d1d5db" }}
            />
            <button
              type="submit"
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "none",
                background: "#1f2937",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Create recipe
            </button>
          </form>
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
            <p style={{ marginTop: 0, color: "#4b5563" }}>
              {selectedRecipe.description?.trim() || "No description yet."}
            </p>
            <p style={{ whiteSpace: "pre-wrap", color: "#374151" }}>
              {selectedRecipe.instructions?.trim() || "No instructions yet."}
            </p>

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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 10 }}>
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
                  background: "#1f2937",
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
              <div style={{ display: "grid", gap: 8 }}>
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
