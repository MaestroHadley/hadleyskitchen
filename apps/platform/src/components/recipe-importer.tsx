"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle,
  FilePdf,
  FileText,
  LinkSimple,
  MagicWand,
  PencilSimple,
  Plus,
  SpinnerGap,
  Trash,
  UploadSimple,
  WarningCircle,
} from "@phosphor-icons/react";
import { confirmRecipeImport } from "@/app/actions";
import {
  AI_IMPORT_CONSENT_VERSION,
  emptyRecipeImportDraft,
  parseIngredientLines,
  recipeCategories,
  type IngredientImportDraft,
  type RecipeImportDraft,
} from "@/lib/recipe-import";
import type { IngredientRole } from "@/lib/planner";

type ImportMode = "manual" | "ai";
type ImportStage = "source" | "select" | "review";
type AiSourceKind = "text" | "url" | "file";

const roles: Array<{ value: IngredientRole; label: string }> = [
  { value: "flour", label: "Flour" },
  { value: "water", label: "Water" },
  { value: "active_starter", label: "Active starter" },
  { value: "discard", label: "Discard" },
  { value: "inclusion", label: "Inclusion" },
  { value: "other", label: "Other" },
];

const confidenceLabels = {
  exact: "Exact",
  suggested: "Density suggestion",
  estimated: "AI estimate",
  missing: "Needs grams",
};

export function RecipeImporter({ aiConfigured }: { aiConfigured: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<ImportMode>("manual");
  const [stage, setStage] = useState<ImportStage>("source");
  const [aiSourceKind, setAiSourceKind] = useState<AiSourceKind>("text");
  const [sourceText, setSourceText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<RecipeImportDraft[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [reviewQueue, setReviewQueue] = useState<RecipeImportDraft[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [bulkIngredients, setBulkIngredients] = useState("");
  const [savedCount, setSavedCount] = useState(0);

  const currentDraft = reviewQueue[reviewIndex];
  const unresolved = currentDraft?.ingredients.filter((ingredient) => ingredient.grams === null).length ?? 0;
  const canSave = Boolean(currentDraft)
    && unresolved === 0
    && currentDraft.ingredients.length > 0
    && currentDraft.name.trim().length > 0
    && currentDraft.yieldPerBatch > 0;

  function chooseMode(nextMode: ImportMode) {
    setMode(nextMode);
    setError("");
  }

  function startManual() {
    const draft = emptyRecipeImportDraft();
    if (sourceText.trim()) {
      draft.notes = `Original pasted source:\n${sourceText.trim()}`.slice(0, 5000);
      draft.source.label = "Pasted source, continued manually";
      setBulkIngredients(sourceText);
    }
    if (sourceUrl.trim()) {
      try {
        draft.source.label = new URL(sourceUrl).hostname;
      } catch {
        draft.source.label = "Recipe URL";
      }
      draft.source.url = sourceUrl;
    }
    if (sourceFile) draft.source.label = sourceFile.name;
    setReviewQueue([draft]);
    setReviewIndex(0);
    setStage("review");
    setError("");
  }

  async function parseWithAi() {
    if (!consent) {
      setError("Accept the Google AI disclosure before continuing.");
      return;
    }
    setPending(true);
    setError("");
    const formData = new FormData();
    formData.set("sourceKind", aiSourceKind);
    formData.set("consent", "true");
    formData.set("consentVersion", AI_IMPORT_CONSENT_VERSION);
    if (aiSourceKind === "text") formData.set("text", sourceText);
    if (aiSourceKind === "url") formData.set("url", sourceUrl);
    if (aiSourceKind === "file" && sourceFile) formData.set("file", sourceFile);
    try {
      const response = await fetch("/api/recipes/import/parse", { method: "POST", body: formData });
      const body = await response.json() as { drafts?: RecipeImportDraft[]; error?: string; kind?: string };
      if (!response.ok || !body.drafts?.length) {
        setError(body.error ?? "The recipe could not be imported. Continue manually.");
        if (body.kind === "quota" || body.kind === "disabled" || body.kind === "unavailable") setAiUnavailable(true);
        return;
      }
      setDrafts(body.drafts);
      if (body.drafts.length === 1) {
        setReviewQueue(body.drafts);
        setReviewIndex(0);
        setStage("review");
      } else {
        setSelected(new Set(body.drafts.map((_, index) => index)));
        setStage("select");
      }
    } catch {
      setError("Free AI import is temporarily unavailable. Your source is still here, so you can continue manually.");
      setAiUnavailable(true);
    } finally {
      setConsent(false);
      setPending(false);
    }
  }

  function beginSelectedReview() {
    const queue = drafts.filter((_, index) => selected.has(index));
    if (!queue.length) {
      setError("Select at least one recipe to review.");
      return;
    }
    setReviewQueue(queue);
    setReviewIndex(0);
    setStage("review");
    setError("");
  }

  function updateDraft(change: (draft: RecipeImportDraft) => RecipeImportDraft) {
    setReviewQueue((current) => current.map((draft, index) => index === reviewIndex ? change(draft) : draft));
  }

  function updateField<K extends keyof RecipeImportDraft>(key: K, value: RecipeImportDraft[K]) {
    updateDraft((draft) => ({ ...draft, [key]: value }));
  }

  function updateIngredient(index: number, changes: Partial<IngredientImportDraft>) {
    updateDraft((draft) => ({
      ...draft,
      ingredients: draft.ingredients.map((ingredient, ingredientIndex) => ingredientIndex === index ? { ...ingredient, ...changes } : ingredient),
    }));
  }

  function addBulkIngredients() {
    const parsed = parseIngredientLines(bulkIngredients);
    if (!parsed.length) {
      setError("Paste at least one ingredient line.");
      return;
    }
    updateDraft((draft) => ({
      ...draft,
      ingredients: draft.ingredients.length === 1 && draft.ingredients[0].name === "Ingredient" && !draft.ingredients[0].sourceText
        ? parsed
        : [...draft.ingredients, ...parsed].slice(0, 200),
    }));
    setBulkIngredients("");
    setError("");
  }

  async function saveCurrent() {
    if (!currentDraft || !canSave) {
      setError(unresolved ? `${unresolved} ingredient${unresolved === 1 ? "" : "s"} still need gram amounts.` : "Review the required recipe fields.");
      return;
    }
    setPending(true);
    setError("");
    const result = await confirmRecipeImport(currentDraft);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const nextSavedCount = savedCount + 1;
    setSavedCount(nextSavedCount);
    if (reviewIndex < reviewQueue.length - 1) {
      setReviewIndex((index) => index + 1);
      setBulkIngredients("");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (reviewQueue.length === 1 && result.id) router.push(`/recipes/${result.id}`);
    else router.push(`/recipes?imported=${nextSavedCount}`);
  }

  if (stage === "select") {
    return <section className="import-shell">
      <button className="text-link import-back" onClick={() => setStage("source")}><ArrowLeft />Change source</button>
      <div className="panel import-select-panel">
        <div className="section-heading"><div><p className="eyebrow">Recipes detected</p><h2>Choose what to review</h2></div><span className="pill">{selected.size} selected</span></div>
        <p className="muted">Each selected recipe will get its own editable review before anything is saved.</p>
        <div className="detected-recipes">
          {drafts.map((draft, index) => <label className="detected-recipe" key={`${draft.name}-${index}`}>
            <input type="checkbox" checked={selected.has(index)} onChange={(event) => setSelected((current) => {
              const next = new Set(current);
              if (event.target.checked) next.add(index); else next.delete(index);
              return next;
            })} />
            <span><strong>{draft.name}</strong><small>{draft.ingredients.length} ingredients · {draft.yieldPerBatch} {draft.yieldLabel}</small></span>
            <span className="category-chip">{draft.category}</span>
          </label>)}
        </div>
        {error && <p className="inline-message error"><WarningCircle />{error}</p>}
        <div className="import-actions"><button className="button secondary" onClick={() => setStage("source")}>Cancel</button><button className="button primary" onClick={beginSelectedReview}><Check />Review selected</button></div>
      </div>
    </section>;
  }

  if (stage === "review" && currentDraft) {
    return <section className="import-shell">
      <div className="import-review-toolbar">
        <button className="text-link import-back" onClick={() => setStage(reviewQueue.length > 1 ? "select" : "source")}><ArrowLeft />Back</button>
        <span className="pill neutral">Recipe {reviewIndex + 1} of {reviewQueue.length}</span>
      </div>
      <div className="import-review-grid">
        <div className="panel import-review-main">
          <div className="section-heading"><div><p className="eyebrow">Review before saving</p><h2>{currentDraft.name}</h2></div>{unresolved ? <span className="pill import-warning-pill"><WarningCircle />{unresolved} unresolved</span> : <span className="pill sage"><CheckCircle />Ready</span>}</div>
          {currentDraft.warnings.length > 0 && <div className="import-warnings"><strong>Importer notes</strong><ul>{currentDraft.warnings.map((warning, index) => <li key={`${warning}-${index}`}>{warning}</li>)}</ul></div>}

          <div className="form-grid three import-form-grid">
            <label className="full-width">Recipe name<input value={currentDraft.name} onChange={(event) => updateField("name", event.target.value)} /></label>
            <label>Category<select value={currentDraft.category} onChange={(event) => updateField("category", event.target.value)}>{recipeCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label>Batch yield<input type="number" min="0.01" step="0.01" value={currentDraft.yieldPerBatch} onChange={(event) => updateField("yieldPerBatch", Number(event.target.value))} /></label>
            <label>Yield unit<input value={currentDraft.yieldLabel} onChange={(event) => updateField("yieldLabel", event.target.value)} /></label>
            <label>Oven capacity<input type="number" min="1" step="1" value={currentDraft.ovenCapacity} onChange={(event) => updateField("ovenCapacity", Number(event.target.value))} /></label>
            <label>Cycle minutes<input type="number" min="1" step="1" value={currentDraft.cycleMinutes} onChange={(event) => updateField("cycleMinutes", Number(event.target.value))} /></label>
          </div>

          <div className="import-ingredient-heading"><div><p className="eyebrow">Grams per batch</p><h3>Ingredients</h3></div><button className="compact-button" onClick={() => updateField("ingredients", [...currentDraft.ingredients, { name: "", grams: null, role: "other", sourceText: "", confidence: "missing" }])}><Plus />Add row</button></div>
          <div className="import-ingredient-list">
            {currentDraft.ingredients.map((ingredient, index) => <article className={`import-ingredient ${ingredient.confidence}`} key={`${ingredient.sourceText}-${index}`}>
              <div className="import-ingredient-source"><span className={`confidence-badge ${ingredient.confidence}`}>{confidenceLabels[ingredient.confidence]}</span><small>{ingredient.sourceText || "Added during review"}</small></div>
              <div className="import-ingredient-fields">
                <label>Ingredient<input value={ingredient.name} onChange={(event) => updateIngredient(index, { name: event.target.value })} /></label>
                <label>Grams<input type="number" min="0" step="0.1" value={ingredient.grams ?? ""} placeholder="Required" onChange={(event) => updateIngredient(index, {
                  grams: event.target.value === "" ? null : Number(event.target.value),
                  confidence: event.target.value === "" ? "missing" : "exact",
                  conversionNote: event.target.value === "" ? ingredient.conversionNote : "Entered or confirmed during review.",
                })} /></label>
                <label>Role<select value={ingredient.role} onChange={(event) => updateIngredient(index, { role: event.target.value as IngredientRole })}>{roles.map((role) => <option value={role.value} key={role.value}>{role.label}</option>)}</select></label>
                <button className="danger-icon import-delete" onClick={() => updateField("ingredients", currentDraft.ingredients.filter((_, ingredientIndex) => ingredientIndex !== index))} aria-label={`Delete ${ingredient.name || `ingredient ${index + 1}`}`}><Trash /></button>
              </div>
              {ingredient.conversionNote && <p>{ingredient.conversionNote}</p>}
            </article>)}
          </div>

          <details className="bulk-ingredient-panel">
            <summary><Plus />Paste several ingredient lines</summary>
            <p>Mass units convert exactly. Known volume conversions are suggestions; anything uncertain stays blank.</p>
            <textarea value={bulkIngredients} onChange={(event) => setBulkIngredients(event.target.value)} placeholder={"500 g bread flour\n12 oz water\n1 cup sugar"} />
            <button className="compact-button" onClick={addBulkIngredients}>Add parsed lines</button>
          </details>

          <label className="notes-field">Instructions<textarea value={currentDraft.instructions} onChange={(event) => updateField("instructions", event.target.value)} placeholder="Mixing, proofing, shaping, and baking steps…" /></label>
          <label className="notes-field">Recipe notes<textarea value={currentDraft.notes} onChange={(event) => updateField("notes", event.target.value)} placeholder="Temperatures, pans, visual cues, or production notes…" /></label>
        </div>

        <aside className="import-review-aside">
          <article className="panel import-source-card">
            <p className="eyebrow">Provenance</p>
            <h3>{currentDraft.source.processingMethod === "ai" ? "Google AI assisted" : currentDraft.source.processingMethod === "json_ld" ? "Website recipe data" : "Manual import"}</h3>
            <label>Source label<input value={currentDraft.source.label} onChange={(event) => updateDraft((draft) => ({ ...draft, source: { ...draft.source, label: event.target.value } }))} /></label>
            <label>Source URL<input type="url" value={currentDraft.source.url ?? ""} onChange={(event) => updateDraft((draft) => ({ ...draft, source: { ...draft.source, url: event.target.value || undefined } }))} placeholder="Optional" /></label>
            <small>Only the confirmed recipe details and provenance are saved. Uploaded files are not retained.</small>
          </article>
          <article className="panel import-ready-card">
            <strong>{currentDraft.ingredients.length}</strong><span>ingredients</span>
            <strong>{unresolved}</strong><span>need grams</span>
          </article>
          {error && <p className="inline-message error"><WarningCircle />{error}</p>}
          <button className="button primary full-width" onClick={saveCurrent} disabled={pending || !canSave}>{pending ? <SpinnerGap className="spin" /> : <CheckCircle weight="fill" />}{reviewIndex < reviewQueue.length - 1 ? "Save & review next" : "Save recipe"}</button>
          {!canSave && <small className="muted">Complete the recipe name, yield, and every gram amount to save.</small>}
        </aside>
      </div>
    </section>;
  }

  return <section className="import-shell">
    <div className="import-mode-grid">
      <button className={mode === "manual" ? "import-mode-card active" : "import-mode-card"} onClick={() => chooseMode("manual")}>
        <span className="feature-icon"><PencilSimple /></span>
        <span><strong>Guided manual</strong><small>Always available · private · no AI</small></span>
        {mode === "manual" && <CheckCircle weight="fill" />}
      </button>
      <button className={mode === "ai" ? "import-mode-card active" : "import-mode-card"} onClick={() => chooseMode("ai")}>
        <span className="feature-icon"><MagicWand /></span>
        <span><strong>Google AI assist <em>Free beta</em></strong><small>Best effort · may be unavailable</small></span>
        {mode === "ai" && <CheckCircle weight="fill" />}
      </button>
    </div>

    {mode === "manual" ? <div className="panel import-source-panel">
      <div className="section-heading"><div><p className="eyebrow">Private path</p><h2>Build a clean recipe draft</h2></div><span className="pill sage">No AI</span></div>
      <p className="muted">Enter the formula in a guided review screen. You can paste several ingredient lines at once, and safe mass conversions happen automatically.</p>
      <div className="manual-benefits">
        <span><Check />Nothing is sent to Google</span>
        <span><Check />Works if AI is disabled</span>
        <span><Check />You approve every gram amount</span>
      </div>
      <button className="button primary" onClick={startManual}><PencilSimple />Start guided import</button>
    </div> : <div className="panel import-source-panel">
      <div className="section-heading"><div><p className="eyebrow">Free beta</p><h2>Choose your source</h2></div><span className={aiConfigured && !aiUnavailable ? "pill sage" : "pill neutral"}>{aiConfigured && !aiUnavailable ? "Configured" : "Unavailable"}</span></div>
      <div className="ai-source-tabs" role="tablist" aria-label="AI recipe source">
        <button id="ai-source-text-tab" type="button" role="tab" aria-selected={aiSourceKind === "text"} aria-controls="ai-source-text-panel" className={aiSourceKind === "text" ? "active" : ""} onClick={() => setAiSourceKind("text")}><FileText />Paste text</button>
        <button id="ai-source-url-tab" type="button" role="tab" aria-selected={aiSourceKind === "url"} aria-controls="ai-source-url-panel" className={aiSourceKind === "url" ? "active" : ""} onClick={() => setAiSourceKind("url")}><LinkSimple />Recipe URL</button>
        <button id="ai-source-file-tab" type="button" role="tab" aria-selected={aiSourceKind === "file"} aria-controls="ai-source-file-panel" className={aiSourceKind === "file" ? "active" : ""} onClick={() => setAiSourceKind("file")}><UploadSimple />Image or PDF</button>
      </div>
      {aiSourceKind === "text" && <div id="ai-source-text-panel" role="tabpanel" aria-labelledby="ai-source-text-tab"><label className="ai-source-field">Recipe text<textarea value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="Paste the recipe, ingredient list, or notes here…" /></label></div>}
      {aiSourceKind === "url" && <div id="ai-source-url-panel" role="tabpanel" aria-labelledby="ai-source-url-tab"><label className="ai-source-field">Public HTTPS recipe URL<div className="input-with-icon"><LinkSimple /><input type="url" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://example.com/recipe" /></div></label></div>}
      {aiSourceKind === "file" && <div id="ai-source-file-panel" role="tabpanel" aria-labelledby="ai-source-file-tab"><label className="file-drop"><input type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setSourceFile(event.target.files?.[0] ?? null)} /><span className="feature-icon">{sourceFile?.type === "application/pdf" ? <FilePdf /> : <UploadSimple />}</span><strong>{sourceFile?.name ?? "Choose an image or PDF"}</strong><small>JPEG, PNG, WebP, or PDF · 5 MB maximum · not retained</small></label></div>}

      <div className="ai-disclosure">
        <WarningCircle weight="fill" />
        <div><strong>Google AI processes this import</strong><p>Because this uses Google’s unpaid service, submitted content and responses may be used to improve Google products and may be reviewed by people. Do not upload confidential, personal, or proprietary recipes. Use guided manual import for private material. <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer">Read Google’s terms</a>.</p></div>
      </div>
      <label className="ai-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I’m 18 or older, understand this disclosure, and want Google AI to process this source.</span></label>
      {error && <div className="ai-import-error"><p className="inline-message error"><WarningCircle />{error}</p><button className="button secondary" onClick={startManual}>Continue manually</button></div>}
      <div className="import-actions"><button className="button secondary" onClick={startManual}>Use manual import</button><button className="button primary" onClick={parseWithAi} disabled={pending || !aiConfigured || aiUnavailable || !consent}>{pending ? <SpinnerGap className="spin" /> : <MagicWand />}Create review draft</button></div>
    </div>}
  </section>;
}
