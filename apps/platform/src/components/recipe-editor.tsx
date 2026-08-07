"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CaretDown,
  CheckCircle,
  ClipboardText,
  Copy,
  PencilSimple,
  Plus,
  Star,
  Trash,
  WarningCircle,
} from "@phosphor-icons/react";
import { duplicateRecipe, saveRecipe, setRecipeFlags } from "@/app/actions";
import { formatBakeryDate } from "@/lib/date-format";
import { parseIngredientLines, roleForIngredient } from "@/lib/recipe-import";
import { recipeHydration, type Ingredient, type IngredientRole, type Recipe } from "@/lib/planner";

const roles: Array<{ value: IngredientRole; label: string }> = [
  { value: "flour", label: "Flour" },
  { value: "water", label: "Water" },
  { value: "active_starter", label: "Active starter / levain" },
  { value: "discard", label: "Sourdough discard" },
  { value: "inclusion", label: "Inclusion" },
  { value: "other", label: "Other" },
];

function ingredientsFromPaste(value: string): Ingredient[] {
  return parseIngredientLines(value).map((ingredient) => ({
    name: ingredient.name,
    grams: ingredient.grams ?? 0,
    role: ingredient.role,
  }));
}

export function RecipeEditor({ initialRecipe, versions }: { initialRecipe: Recipe; versions: Array<{ id: string; version: number; created_at: string }> }) {
  const router = useRouter();
  const [savedRecipe, setSavedRecipe] = useState(initialRecipe);
  const [recipe, setRecipe] = useState(initialRecipe);
  const [isEditing, setIsEditing] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [message, setMessage] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientGrams, setNewIngredientGrams] = useState("");

  const hydration = useMemo(() => recipeHydration(recipe, 1), [recipe]);
  const hasHydrationFormula = recipe.ingredients.some((ingredient) => ingredient.role === "flour")
    && recipe.ingredients.some((ingredient) => ingredient.role === "water" || ingredient.role === "active_starter");
  const totalGrams = useMemo(() => recipe.ingredients.reduce((sum, ingredient) => sum + ingredient.grams, 0), [recipe.ingredients]);
  const pastedIngredients = useMemo(() => ingredientsFromPaste(pasteText), [pasteText]);
  const pastedMissing = useMemo(() => parseIngredientLines(pasteText).filter((ingredient) => ingredient.grams === null).length, [pasteText]);

  const changeRecipe = (change: (current: Recipe) => Recipe) => {
    setMessage("");
    setRecipe(change);
  };
  const update = <K extends keyof Recipe>(key: K, value: Recipe[K]) => changeRecipe((current) => ({ ...current, [key]: value }));
  const updateIngredient = (index: number, changes: Partial<Ingredient>) => changeRecipe((current) => ({
    ...current,
    ingredients: current.ingredients.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item),
  }));
  const updateIngredientName = (index: number, name: string) => {
    const current = recipe.ingredients[index];
    const wasAutomaticallyClassified = current.role === roleForIngredient(current.name);
    updateIngredient(index, {
      name,
      role: wasAutomaticallyClassified ? roleForIngredient(name) : current.role,
    });
  };
  const moveIngredient = (index: number, direction: -1 | 1) => changeRecipe((current) => {
    const next = [...current.ingredients];
    const target = index + direction;
    if (target < 0 || target >= next.length) return current;
    [next[index], next[target]] = [next[target], next[index]];
    return { ...current, ingredients: next };
  });

  function beginEditing() {
    setRecipe(savedRecipe);
    setMessage("");
    setSaveState("saved");
    setIsEditing(true);
  }

  function cancelEditing() {
    setRecipe(savedRecipe);
    setPasteOpen(false);
    setPasteText("");
    setNewIngredientName("");
    setNewIngredientGrams("");
    setMessage("");
    setSaveState("saved");
    setIsEditing(false);
  }

  async function save() {
    setSaveState("saving");
    setMessage("");
    const result = await saveRecipe(recipe);
    if (!result.ok) {
      setSaveState("error");
      setMessage(result.error);
      return;
    }
    setSavedRecipe(recipe);
    setSaveState("saved");
    setPasteOpen(false);
    setPasteText("");
    setIsEditing(false);
    router.refresh();
  }

  async function duplicate() {
    const result = await duplicateRecipe(savedRecipe.id);
    if (!result.ok) return setMessage(result.error);
    if (result.id) router.push(`/recipes/${result.id}`);
  }

  async function flag(changes: { favorite?: boolean; archived?: boolean }) {
    const result = await setRecipeFlags(savedRecipe.id, changes);
    if (!result.ok) return setMessage(result.error);
    if (typeof changes.favorite === "boolean") {
      setSavedRecipe((current) => ({ ...current, isFavorite: changes.favorite }));
      setRecipe((current) => ({ ...current, isFavorite: changes.favorite }));
    }
    if (typeof changes.archived === "boolean") router.push(`/recipes?status=${changes.archived ? "archived" : "active"}`);
  }

  function addBlankIngredient() {
    update("ingredients", [...recipe.ingredients, { name: "", grams: 0, role: "other" }]);
  }

  function addQuickIngredient() {
    const name = newIngredientName.trim();
    const grams = Number(newIngredientGrams);
    if (!name || !Number.isFinite(grams) || grams < 0) return;
    update("ingredients", [...recipe.ingredients, { name, grams, role: roleForIngredient(name) }]);
    setNewIngredientName("");
    setNewIngredientGrams("");
  }

  function applyPaste(mode: "replace" | "append") {
    if (!pastedIngredients.length) {
      setMessage("Paste at least one ingredient line.");
      return;
    }
    if (pastedMissing) {
      setMessage(`${pastedMissing} ingredient${pastedMissing === 1 ? "" : "s"} need gram amounts. Use a line like “2160 g Bread Flour”.`);
      return;
    }
    update("ingredients", mode === "replace" ? pastedIngredients : [...recipe.ingredients, ...pastedIngredients]);
    setPasteText("");
    setPasteOpen(false);
  }

  if (!isEditing) {
    return <div className="editor-page recipe-view-page">
      <div className="editor-toolbar">
        <button className="text-link" onClick={() => router.push("/recipes")}><ArrowLeft />Recipe library</button>
        <div className="save-indicator saved"><i />All changes saved</div>
      </div>

      <header className="recipe-view-header">
        <div>
          <p className="eyebrow">Recipe</p>
          <h1>{savedRecipe.name}</h1>
        </div>
        <div className="recipe-view-actions">
          <button className="button primary" onClick={beginEditing}><PencilSimple weight="bold" />Edit recipe</button>
          <button className={savedRecipe.isFavorite ? "compact-button favorite" : "compact-button"} onClick={() => flag({ favorite: !savedRecipe.isFavorite })}><Star weight={savedRecipe.isFavorite ? "fill" : "regular"} />{savedRecipe.isFavorite ? "Favorited" : "Favorite"}</button>
          <button className="compact-button" onClick={duplicate}><Copy />Duplicate</button>
          <button className="compact-button" onClick={() => flag({ archived: !savedRecipe.archivedAt })}><Archive />{savedRecipe.archivedAt ? "Restore" : "Archive"}</button>
        </div>
      </header>

      {message && <p className="inline-message error" role="alert"><WarningCircle />{message}</p>}

      <section className="recipe-meta" aria-label="Recipe details">
        <div><span>Category</span><strong>{savedRecipe.category}</strong></div>
        <div><span>Yield</span><strong>{savedRecipe.yieldPerBatch} {savedRecipe.yieldLabel}</strong></div>
        <div><span>Oven capacity</span><strong>{savedRecipe.ovenCapacity} per load</strong></div>
        <div><span>Cycle time</span><strong>{savedRecipe.cycleMinutes} minutes</strong></div>
      </section>

      {hasHydrationFormula && <p className="formula-insight"><span>Formula hydration</span><strong>{(hydration * 100).toFixed(1)}%</strong></p>}

      <div className="recipe-document-grid">
        <section className="recipe-document-section">
          <p className="eyebrow">Grams per batch</p>
          <h2>Ingredients</h2>
          <div className="recipe-ingredient-list">
            {savedRecipe.ingredients.map((ingredient, index) => <div key={`${ingredient.id ?? ingredient.name}-${index}`}><span>{ingredient.name}</span><strong>{ingredient.grams.toLocaleString()} g</strong></div>)}
            <div className="recipe-total"><span>Total ingredient weight</span><strong>{totalGrams.toLocaleString()} g</strong></div>
          </div>
        </section>

        <section className="recipe-document-section">
          <p className="eyebrow">Method</p>
          <h2>Instructions</h2>
          {savedRecipe.instructions?.trim()
            ? <div className="recipe-prose">{savedRecipe.instructions}</div>
            : <p className="recipe-empty-copy">No instructions have been added yet.</p>}
          {savedRecipe.notes?.trim() && <div className="recipe-notes"><h3>Recipe notes</h3><p>{savedRecipe.notes}</p></div>}
        </section>
      </div>

      {versions.length > 0 && <details className="recipe-history"><summary>Recipe history</summary><div>{versions.map((version) => <p key={version.id}><span>Version {version.version}</span><small>{formatBakeryDate(version.created_at, { month: "short", day: "numeric", year: "numeric" })}</small></p>)}</div></details>}
    </div>;
  }

  return <div className="editor-page recipe-edit-page">
    <div className="editor-toolbar">
      <button className="text-link" onClick={cancelEditing}><ArrowLeft />Recipe view</button>
      <div className={`save-indicator ${saveState}`}><i />{saveState === "saving" ? "Saving recipe…" : saveState === "error" ? "Couldn’t save" : "Editing"}</div>
    </div>

    <header className="recipe-edit-header">
      <div><p className="eyebrow">Recipe workspace</p><h1>Edit recipe</h1></div>
      <div className="recipe-edit-actions"><button className="button secondary" onClick={cancelEditing}>Cancel</button><button className="button primary" onClick={save} disabled={saveState === "saving"}>{saveState === "saving" ? "Saving…" : "Save recipe"}</button></div>
    </header>

    {message && <p className="inline-message error" role="alert"><WarningCircle />{message}</p>}

    <main className="recipe-edit-form">
      <label className="recipe-name-field"><span>Recipe name</span><input value={recipe.name} onChange={(event) => update("name", event.target.value)} /></label>

      <div className="recipe-detail-grid">
        <label><span>Category</span><input value={recipe.category} onChange={(event) => update("category", event.target.value)} /></label>
        <label><span>Batch yield</span><input type="number" min="0.01" step="0.01" value={recipe.yieldPerBatch} onChange={(event) => update("yieldPerBatch", Number(event.target.value))} /></label>
        <label><span>Yield unit</span><input value={recipe.yieldLabel} onChange={(event) => update("yieldLabel", event.target.value)} /></label>
        <label><span>Oven capacity</span><input type="number" min="1" step="1" value={recipe.ovenCapacity} onChange={(event) => update("ovenCapacity", Number(event.target.value))} /></label>
        <label><span>Cycle time <small>(minutes)</small></span><input type="number" min="1" step="1" value={recipe.cycleMinutes} onChange={(event) => update("cycleMinutes", Number(event.target.value))} /></label>
      </div>

      <section className="quick-ingredients">
        <div className="quick-ingredient-heading">
          <div><h2>Ingredients</h2><p>Add ingredients quickly. Flour, water, starter, and discard are recognized automatically.</p></div>
          <div><button className="compact-button" onClick={() => setPasteOpen((current) => !current)}><ClipboardText />Paste ingredient list</button><button className="compact-button" onClick={addBlankIngredient}><Plus />Add ingredient</button></div>
        </div>

        {pasteOpen && <div className="ingredient-paste-panel">
          <label><span>Paste one ingredient per line</span><textarea value={pasteText} onChange={(event) => setPasteText(event.target.value)} placeholder={"2160 g Bread Flour\n540 g Buttermilk\n440 g Granulated sugar"} autoFocus /></label>
          <p>Use grams, kilograms, ounces, or pounds. Safe conversions happen automatically; uncertain volume conversions will ask for review.</p>
          <div><button className="button secondary" onClick={() => setPasteOpen(false)}>Close</button><button className="button secondary" onClick={() => applyPaste("append")}>Add to recipe</button><button className="button primary" onClick={() => applyPaste("replace")}>Replace current list</button></div>
        </div>}

        <div className="quick-ingredient-table">
          <div className="quick-ingredient-labels"><span>Ingredient</span><span>Amount</span><span /></div>
          {recipe.ingredients.map((ingredient, index) => <div className="quick-ingredient-row" key={`${ingredient.id ?? "new"}-${index}`}>
            <div className="row-order-controls"><button onClick={() => moveIngredient(index, -1)} disabled={index === 0} aria-label={`Move ${ingredient.name || `ingredient ${index + 1}`} up`}><ArrowUp /></button><button onClick={() => moveIngredient(index, 1)} disabled={index === recipe.ingredients.length - 1} aria-label={`Move ${ingredient.name || `ingredient ${index + 1}`} down`}><ArrowDown /></button></div>
            <input value={ingredient.name} onChange={(event) => updateIngredientName(index, event.target.value)} aria-label={`Ingredient ${index + 1} name`} placeholder="Ingredient name" />
            <div className="number-suffix"><input type="number" min="0" step="0.1" value={ingredient.grams} onChange={(event) => updateIngredient(index, { grams: Number(event.target.value) })} aria-label={`${ingredient.name || `Ingredient ${index + 1}`} grams`} /><span>g</span></div>
            <button className="quick-delete" onClick={() => update("ingredients", recipe.ingredients.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Delete ${ingredient.name || `ingredient ${index + 1}`}`}><Trash /></button>
          </div>)}
          <div className="quick-ingredient-row quick-add-row">
            <span className="quick-add-icon"><Plus /></span>
            <input value={newIngredientName} onChange={(event) => setNewIngredientName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addQuickIngredient(); }} aria-label="New ingredient name" placeholder="Add next ingredient" />
            <div className="number-suffix"><input type="number" min="0" step="0.1" value={newIngredientGrams} onChange={(event) => setNewIngredientGrams(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addQuickIngredient(); }} aria-label="New ingredient grams" placeholder="Amount" /><span>g</span></div>
            <button className="quick-add-button" onClick={addQuickIngredient} aria-label="Add ingredient"><Plus /></button>
          </div>
        </div>
      </section>

      <details className="formula-settings">
        <summary><CaretDown /><span><strong>Advanced formula settings</strong><small>Review how ingredients count toward hydration, starter, and production totals.</small></span></summary>
        <div className="formula-role-list">
          {recipe.ingredients.map((ingredient, index) => <label key={`${ingredient.id ?? ingredient.name}-role-${index}`}><span>{ingredient.name || `Ingredient ${index + 1}`}</span><select value={ingredient.role} onChange={(event) => updateIngredient(index, { role: event.target.value as IngredientRole })}>{roles.map((role) => <option value={role.value} key={role.value}>{role.label}</option>)}</select></label>)}
        </div>
        {hasHydrationFormula && <p className="formula-result"><CheckCircle weight="fill" />Current hydration: <strong>{(hydration * 100).toFixed(1)}%</strong></p>}
      </details>

      <div className="recipe-writing-grid">
        <label><span>Instructions</span><textarea value={recipe.instructions ?? ""} onChange={(event) => update("instructions", event.target.value)} placeholder="Mixing, proofing, shaping, and baking steps…" /></label>
        <label><span>Recipe notes</span><textarea value={recipe.notes ?? ""} onChange={(event) => update("notes", event.target.value)} placeholder="Proofing notes, pan size, bake cues…" /></label>
      </div>
    </main>

    <div className="mobile-recipe-actions"><button className="button secondary" onClick={cancelEditing}>Cancel</button><button className="button primary" onClick={save} disabled={saveState === "saving"}>{saveState === "saving" ? "Saving…" : "Save recipe"}</button></div>
  </div>;
}
