"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArrowDown, ArrowLeft, ArrowUp, Clock, Copy, FloppyDisk, Plus, Star, Trash } from "@phosphor-icons/react";
import { duplicateRecipe, saveRecipe, setRecipeFlags } from "@/app/actions";
import { recipeHydration, type Ingredient, type IngredientRole, type Recipe } from "@/lib/planner";

const roles: Array<{ value: IngredientRole; label: string }> = [
  { value: "flour", label: "Flour" }, { value: "water", label: "Water" }, { value: "active_starter", label: "Active starter" },
  { value: "discard", label: "Discard" }, { value: "inclusion", label: "Inclusion" }, { value: "other", label: "Other" },
];

export function RecipeEditor({ initialRecipe, versions }: { initialRecipe: Recipe; versions: Array<{ id: string; version: number; created_at: string }> }) {
  const router = useRouter();
  const [recipe, setRecipe] = useState(initialRecipe);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [message, setMessage] = useState("");
  const firstRender = useRef(true);
  const hydration = useMemo(() => recipeHydration(recipe, 1), [recipe]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = window.setTimeout(async () => {
      const result = await saveRecipe(recipe);
      setSaveState(result.ok ? "saved" : "error");
      setMessage(result.ok ? "" : result.error);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [recipe]);

  const changeRecipe = (change: (current: Recipe) => Recipe) => {
    setSaveState("saving");
    setRecipe(change);
  };
  const update = <K extends keyof Recipe>(key: K, value: Recipe[K]) => changeRecipe((current) => ({ ...current, [key]: value }));
  const updateIngredient = (index: number, changes: Partial<Ingredient>) => changeRecipe((current) => ({ ...current, ingredients: current.ingredients.map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item) }));
  const moveIngredient = (index: number, direction: -1 | 1) => changeRecipe((current) => {
    const next = [...current.ingredients];
    const target = index + direction;
    if (target < 0 || target >= next.length) return current;
    [next[index], next[target]] = [next[target], next[index]];
    return { ...current, ingredients: next };
  });

  async function duplicate() {
    const result = await duplicateRecipe(recipe.id);
    if (!result.ok) return setMessage(result.error);
    if (result.id) router.push(`/recipes/${result.id}`);
  }
  async function flag(changes: { favorite?: boolean; archived?: boolean }) {
    const result = await setRecipeFlags(recipe.id, changes);
    if (!result.ok) return setMessage(result.error);
    if (typeof changes.favorite === "boolean") setRecipe((current) => ({ ...current, isFavorite: changes.favorite }));
    if (typeof changes.archived === "boolean") router.push(`/recipes?status=${changes.archived ? "archived" : "active"}`);
  }

  return <div className="editor-page">
    <div className="editor-toolbar"><button className="text-link" onClick={() => router.push("/recipes")}><ArrowLeft />Recipe library</button><div className={`save-indicator ${saveState}`}><i />{saveState === "saving" ? "Saving changes…" : saveState === "error" ? "Couldn’t save" : "All changes saved"}</div></div>
    <section className="editor-header"><div><p className="eyebrow">Recipe workspace</p><input className="title-input" value={recipe.name} onChange={(event) => update("name", event.target.value)} aria-label="Recipe name" /></div><div className="button-row"><button className={recipe.isFavorite ? "compact-button favorite" : "compact-button"} onClick={() => flag({ favorite: !recipe.isFavorite })}><Star weight={recipe.isFavorite ? "fill" : "regular"} />{recipe.isFavorite ? "Favorited" : "Favorite"}</button><button className="compact-button" onClick={duplicate}><Copy />Duplicate</button><button className="compact-button" onClick={() => flag({ archived: !recipe.archivedAt })}><Archive />{recipe.archivedAt ? "Restore" : "Archive"}</button></div></section>
    {message && <p className="inline-message error">{message}</p>}
    <div className="editor-grid">
      <section className="panel recipe-form-panel">
        <div className="section-heading"><div><p className="eyebrow">Formula</p><h2>Recipe details</h2></div><span className="hydration-badge">{(hydration * 100).toFixed(1)}% hydration</span></div>
        <div className="form-grid three"><label>Category<input value={recipe.category} onChange={(event) => update("category", event.target.value)} /></label><label>Batch yield<input type="number" min="0.01" step="0.01" value={recipe.yieldPerBatch} onChange={(event) => update("yieldPerBatch", Number(event.target.value))} /></label><label>Yield unit<input value={recipe.yieldLabel} onChange={(event) => update("yieldLabel", event.target.value)} /></label><label>Oven capacity<input type="number" min="1" step="1" value={recipe.ovenCapacity} onChange={(event) => update("ovenCapacity", Number(event.target.value))} /></label><label>Cycle time<input type="number" min="1" step="1" value={recipe.cycleMinutes} onChange={(event) => update("cycleMinutes", Number(event.target.value))} /><small>minutes</small></label></div>
        <div className="ingredient-section"><div className="section-heading"><div><p className="eyebrow">Grams only</p><h2>Ingredients</h2></div><button className="compact-button" onClick={() => update("ingredients", [...recipe.ingredients, { name: "", grams: 0, role: "other" }])}><Plus weight="bold" />Add ingredient</button></div>
          <div className="ingredient-table"><div className="ingredient-table-head"><span>Ingredient</span><span>Grams / batch</span><span>Role</span><span>Buy size</span><span /></div>{recipe.ingredients.map((ingredient, index) => <div className="ingredient-edit-row" key={`${ingredient.id ?? "new"}-${index}`}><input value={ingredient.name} onChange={(event) => updateIngredient(index, { name: event.target.value })} aria-label={`Ingredient ${index + 1} name`} placeholder="Ingredient name" /><div className="number-suffix"><input type="number" min="0" step="0.1" value={ingredient.grams} onChange={(event) => updateIngredient(index, { grams: Number(event.target.value) })} aria-label={`${ingredient.name || `Ingredient ${index + 1}`} grams`} /><span>g</span></div><select value={ingredient.role} onChange={(event) => updateIngredient(index, { role: event.target.value as IngredientRole })} aria-label={`${ingredient.name || `Ingredient ${index + 1}`} role`}>{roles.map((role) => <option value={role.value} key={role.value}>{role.label}</option>)}</select><div className="number-suffix optional"><input type="number" min="0" step="0.1" value={ingredient.packageGrams ?? ""} onChange={(event) => updateIngredient(index, { packageGrams: event.target.value ? Number(event.target.value) : undefined })} aria-label={`${ingredient.name || `Ingredient ${index + 1}`} purchase package grams`} placeholder="Optional" /><span>g</span></div><div className="row-tools"><button onClick={() => moveIngredient(index, -1)} disabled={index === 0} aria-label="Move ingredient up"><ArrowUp /></button><button onClick={() => moveIngredient(index, 1)} disabled={index === recipe.ingredients.length - 1} aria-label="Move ingredient down"><ArrowDown /></button><button className="danger-icon" onClick={() => update("ingredients", recipe.ingredients.filter((_, itemIndex) => itemIndex !== index))} aria-label="Delete ingredient"><Trash /></button></div></div>)}</div>
        </div>
        <label className="notes-field">Recipe notes<textarea value={recipe.notes ?? ""} onChange={(event) => update("notes", event.target.value)} placeholder="Proofing notes, pan size, bake cues…" /></label>
      </section>
      <aside className="editor-aside"><article className="mini-panel"><Clock /><div><strong>Live formula</strong><span>{recipe.ingredients.length} ingredients · {recipe.yieldPerBatch} {recipe.yieldLabel}</span></div></article><article className="panel version-panel"><p className="eyebrow">History</p><h3>Recipe versions</h3>{versions.length ? versions.map((version) => <div key={version.id}><span>Version {version.version}</span><small>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(version.created_at))}</small></div>) : <p className="muted">Version history begins after your first saved change.</p>}</article><button className="button primary full-width" onClick={async () => { setSaveState("saving"); const result = await saveRecipe(recipe); setSaveState(result.ok ? "saved" : "error"); if (!result.ok) setMessage(result.error); }}><FloppyDisk weight="bold" />Save now</button></aside>
    </div>
  </div>;
}
