"use client";

import { useEffect, useMemo, useState } from "react";
import { calculatePlan, formatGrams, type EventItem, type Recipe } from "@/lib/planner";
import { sampleEvent, sampleMixer, sampleRecipes, sampleSettings } from "@/data/sample";
import { AuthPanel } from "@/components/auth-panel";

type View = "dashboard" | "recipes" | "event" | "reports" | "account";
const steps = ["Details", "Products", "Batches", "Ingredients", "Mixer", "Schedule", "Package"];
const formatBatches = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "");

function Mark() { return <span className="brand-mark" aria-hidden="true">HK</span>; }

export function PlannerApp() {
  const [view, setView] = useState<View>("dashboard");
  const [step, setStep] = useState(2);
  const [items, setItems] = useState<EventItem[]>(sampleEvent);
  const [recipes, setRecipes] = useState<Recipe[]>(sampleRecipes);
  const [activeRecipeId, setActiveRecipeId] = useState("plain");
  const saved = "Saved just now";

  useEffect(() => {
    window.localStorage.setItem("hk-planner-event", JSON.stringify(items));
  }, [items]);

  const plan = useMemo(() => calculatePlan(recipes, items, sampleSettings, sampleMixer), [recipes, items]);
  const activeRecipe = recipes.find((recipe) => recipe.id === activeRecipeId) ?? recipes[0];

  function changeTarget(recipeId: string, delta: number) {
    setItems((current) => current.map((item) => item.recipeId === recipeId ? { ...item, target: Math.max(0, item.target + delta) } : item));
  }

  function updateIngredient(index: number, grams: number) {
    setRecipes((current) => current.map((recipe) => recipe.id !== activeRecipe.id ? recipe : {
      ...recipe,
      ingredients: recipe.ingredients.map((ingredient, ingredientIndex) => ingredientIndex === index ? { ...ingredient, grams: Math.max(0, grams) } : ingredient),
    }));
  }

  function downloadCsv() {
    const rows = [["Recipe", "Target", "Batches", "Planned", "Overage"], ...plan.production.map((row) => [row.recipe.name, row.target, row.batches, row.planned, row.overage])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "saturday-pop-up-production.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand-button" onClick={() => setView("dashboard")}><Mark /><span><strong>Hadley’s Kitchen</strong><small>Bake Planner</small></span></button>
        <div className="topbar-actions"><span className="save-state"><i />{saved}</span><button className="avatar" onClick={() => setView("account")} aria-label="Open account">NH</button></div>
      </header>

      <aside className="sidebar" aria-label="Planner navigation">
        <nav>
          <NavButton label="Overview" icon="⌂" active={view === "dashboard"} onClick={() => setView("dashboard")} />
          <NavButton label="Recipes" icon="◇" active={view === "recipes"} onClick={() => setView("recipes")} />
          <NavButton label="Events" icon="▣" active={view === "event"} onClick={() => setView("event")} />
          <NavButton label="Reports" icon="↗" active={view === "reports"} onClick={() => setView("reports")} />
        </nav>
        <div className="sidebar-note"><strong>Saturday Pop-Up</strong><span>Step {step} of 7</span><div className="mini-progress"><b style={{ width: `${step / 7 * 100}%` }} /></div></div>
      </aside>

      <main className="workspace">
        {view === "dashboard" && <Dashboard plan={plan} onPlan={() => setView("event")} />}
        {view === "recipes" && <RecipeLibrary recipes={recipes} activeRecipe={activeRecipe} setActive={setActiveRecipeId} updateIngredient={updateIngredient} />}
        {view === "event" && <EventPlanner step={step} setStep={setStep} items={items} recipes={recipes} plan={plan} changeTarget={changeTarget} />}
        {view === "reports" && <Reports plan={plan} onCsv={downloadCsv} />}
        {view === "account" && <Account />}
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <NavButton label="Home" icon="⌂" active={view === "dashboard"} onClick={() => setView("dashboard")} />
        <NavButton label="Events" icon="▣" active={view === "event"} onClick={() => setView("event")} />
        <NavButton label="Recipes" icon="◇" active={view === "recipes"} onClick={() => setView("recipes")} />
        <NavButton label="Account" icon="●" active={view === "account"} onClick={() => setView("account")} />
      </nav>
    </div>
  );
}

function NavButton({ label, icon, active, onClick }: { label: string; icon: string; active: boolean; onClick: () => void }) {
  return <button className={active ? "nav-button is-active" : "nav-button"} onClick={onClick}><span>{icon}</span>{label}</button>;
}

function Dashboard({ plan, onPlan }: { plan: ReturnType<typeof calculatePlan>; onPlan: () => void }) {
  return <>
    <section className="page-heading"><div><p className="eyebrow">Production workspace</p><h1>Your bake, beautifully organized.</h1><p>Pick up where you left off or prepare something new.</p></div><button className="button primary" onClick={onPlan}>Plan an event</button></section>
    <section className="next-event"><div><span>Next event</span><h2>Saturday Pop-Up</h2><p>Saturday, July 25 · 9:00 AM</p></div><button className="button light" onClick={onPlan}>Continue planning</button></section>
    <section className="metric-grid">
      <Metric label="Production" value={String(plan.totalProducts)} detail="items planned" />
      <Metric label="Batches" value={plan.totalBatches.toFixed(0)} detail="recipe batches" />
      <Metric label="Flour control" value={formatGrams(plan.totalBufferedFlour)} detail="buffered total" />
      <Metric label="Active starter" value={formatGrams(plan.activeStarter)} detail="build scheduled" />
    </section>
    <section className="desktop-split">
      <article className="panel"><div className="panel-heading"><div><p className="eyebrow">Recipe snapshot</p><h2>Plain Sourdough</h2></div><span className="pill sage">Saved</span></div><p className="muted">2 loaves per batch · 63.8% effective hydration</p><IngredientPreview /></article>
      <article className="panel"><StepHeader step={2} /><h2>What are you baking?</h2><p className="muted">Your saved recipes are ready for this event.</p>{plan.production.slice(0, 4).map((row) => <div className="compact-row" key={row.recipe.id}><span><strong>{row.recipe.name}</strong><small>{formatBatches(row.batches)} batches · {row.planned} planned</small></span><b>{row.target}</b></div>)}</article>
    </section>
  </>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <article className="metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }
function IngredientPreview() { return <div className="ingredient-preview">{[["Organic AP Flour", "1,105 g", "Flour"], ["Water", "705 g", "Water"], ["Active starter", "332 g", "Starter"], ["Fine sea salt", "22 g", "Other"]].map((row) => <div key={row[0]}><strong>{row[0]}</strong><span>{row[1]}</span><em>{row[2]}</em></div>)}</div>; }

function RecipeLibrary({ recipes, activeRecipe, setActive, updateIngredient }: { recipes: Recipe[]; activeRecipe: Recipe; setActive: (id: string) => void; updateIngredient: (index: number, grams: number) => void }) {
  return <><section className="page-heading"><div><p className="eyebrow">Saved once, ready every time</p><h1>Recipe library</h1><p>Build dependable formulas in grams and reuse them across every market.</p></div><button className="button primary">New recipe</button></section>
    <div className="recipe-layout"><aside className="recipe-list">{recipes.map((recipe) => <button key={recipe.id} onClick={() => setActive(recipe.id)} className={recipe.id === activeRecipe.id ? "recipe-choice is-active" : "recipe-choice"}><span>{recipe.name}</span><small>{recipe.yieldPerBatch} {recipe.yieldLabel} per batch</small></button>)}</aside>
      <article className="panel recipe-editor"><div className="panel-heading"><div><p className="eyebrow">Recipe editor</p><h2>{activeRecipe.name}</h2></div><button className="button secondary">Duplicate</button></div><div className="form-grid"><label>Recipe name<input value={activeRecipe.name} readOnly /></label><label>Yield<input value={`${activeRecipe.yieldPerBatch} ${activeRecipe.yieldLabel}`} readOnly /></label><label>Mixer dough<input value={`${activeRecipe.mixerDoughGrams.toLocaleString()} g`} readOnly /></label></div><div className="ingredient-editor"><div className="ingredient-head"><span>Ingredient</span><span>Amount</span><span>Role</span></div>{activeRecipe.ingredients.map((ingredient, index) => <div className="ingredient-line" key={`${ingredient.name}-${index}`}><strong>{ingredient.name}</strong><label><span className="sr-only">{ingredient.name} grams</span><input type="number" value={ingredient.grams} onChange={(event) => updateIngredient(index, Number(event.target.value))} /><small>grams</small></label><em>{ingredient.role.replace("_", " ")}</em></div>)}</div><button className="text-button">+ Add ingredient</button></article></div></>;
}

function EventPlanner({ step, setStep, items, recipes, plan, changeTarget }: { step: number; setStep: (step: number) => void; items: EventItem[]; recipes: Recipe[]; plan: ReturnType<typeof calculatePlan>; changeTarget: (id: string, delta: number) => void }) {
  return <><section className="event-title"><div><p className="eyebrow">Saturday, July 25</p><h1>Saturday Pop-Up</h1><span>{plan.totalProducts} items · {plan.totalBatches.toFixed(0)} batches · autosaved</span></div><span className="pill">Draft</span></section><div className="step-rail" aria-label="Event planning progress">{steps.map((label, index) => <button key={label} onClick={() => setStep(index + 1)} className={step === index + 1 ? "is-current" : step > index + 1 ? "is-done" : ""}><b>{index + 1}</b><span>{label}</span></button>)}</div>
    <section className="mobile-kpis"><Metric label="Items" value={String(plan.totalProducts)} detail="" /><Metric label="Batches" value={plan.totalBatches.toFixed(0)} detail="" /><Metric label="Flour" value={(plan.totalExactFlour / 1000).toFixed(1) + "kg"} detail="" /></section>
    <article className="panel event-panel"><StepHeader step={step} /><h2>{steps[step - 1]}</h2><p className="muted">{step === 2 ? "Choose saved recipes and set how many you want ready for market." : "This section is calculated from your recipes and event quantities."}</p>{step === 2 ? <div className="product-list">{items.map((item) => { const recipe = recipes.find((candidate) => candidate.id === item.recipeId)!; const row = plan.production.find((candidate) => candidate.recipe.id === item.recipeId); return <div className="product-row" key={item.recipeId}><span><strong>{recipe.name}</strong><small>{formatBatches(row?.batches ?? 0)} batches · {row?.planned ?? 0} planned{row?.overage ? ` · ${row.overage} over` : " · no overage"}</small></span><div className="stepper"><button onClick={() => changeTarget(item.recipeId, -1)} aria-label={`Decrease ${recipe.name}`}>−</button><output>{item.target}</output><button onClick={() => changeTarget(item.recipeId, 1)} aria-label={`Increase ${recipe.name}`}>+</button></div></div>; })}</div> : <StepReport step={step} plan={plan} />}
      <div className="event-actions"><button className="button secondary" disabled={step === 1} onClick={() => setStep(Math.max(1, step - 1))}>Back</button><button className="button primary" onClick={() => setStep(Math.min(7, step + 1))}>{step === 7 ? "Finish plan" : `Continue to ${steps[step]}`}</button></div></article></>;
}

function StepHeader({ step }: { step: number }) { return <div className="step-header"><span>Step {step} of 7</span><div>{steps.map((_, index) => <i className={index < step ? "filled" : ""} key={index} />)}</div></div>; }
function StepReport({ step, plan }: { step: number; plan: ReturnType<typeof calculatePlan> }) {
  if (step === 3) return <div className="report-list">{plan.production.map((row) => <div key={row.recipe.id}><span>{row.recipe.name}</span><strong>{row.batches.toFixed(2).replace(".00", "")} batches</strong></div>)}</div>;
  if (step === 4) return <div className="report-grid"><Metric label="Direct flour" value={formatGrams(plan.directFlour)} detail="dough formulas" /><Metric label="Starter flour" value={formatGrams(plan.starterFlour)} detail="counted once" /><Metric label="Exact flour" value={formatGrams(plan.totalExactFlour)} detail="production need" /><Metric label="Buffered" value={formatGrams(plan.totalBufferedFlour)} detail="10% cushion" /></div>;
  if (step === 5) return <div className="report-list">{plan.mixerLoads.map((load) => <div key={load.load}><span>Stella load {load.load}</span><strong>{formatGrams(load.grams)} · {(load.capacity * 100).toFixed(0)}%</strong></div>)}</div>;
  if (step === 6) return <div className="schedule"><div><b>Thursday</b><span>Build starter · scale inclusions</span></div><div><b>Friday</b><span>Mix, shape, bake bread and bagels</span></div><div><b>Saturday</b><span>Bake rolls · cool · package · load</span></div></div>;
  return <div className="report-list">{plan.production.map((row) => <div key={row.recipe.id}><span>{row.recipe.name}</span><strong>{Math.ceil(row.target * 1.1)} packages</strong></div>)}</div>;
}

function Reports({ plan, onCsv }: { plan: ReturnType<typeof calculatePlan>; onCsv: () => void }) {
  async function googleExport(kind: "doc" | "sheet") {
    const sections = [
      { title: "Event Overview", rows: [["Saturday Pop-Up", `${plan.totalProducts} items`, `${formatBatches(plan.totalBatches)} batches`]] },
      { title: "Production Plan", rows: [["Recipe", "Target", "Batches", "Planned"], ...plan.production.map((row) => [row.recipe.name, row.target, formatBatches(row.batches), row.planned])] },
      { title: "Ingredients", rows: [["Control", "Amount"], ["Direct flour", Math.round(plan.directFlour)], ["Starter flour", Math.round(plan.starterFlour)], ["Active starter", Math.round(plan.activeStarter)], ["Total exact flour", Math.round(plan.totalExactFlour)]] },
      { title: "Shopping List", rows: [["Ingredient", "Exact grams", "Buffered grams", "Packages"], ...plan.shopping.map((row) => [row.name, Math.round(row.exact), Math.round(row.buffered), row.packages ?? ""])] },
      { title: "Mixer Loads", rows: [["Load", "Grams", "Capacity"], ...plan.mixerLoads.map((load) => [load.load, Math.round(load.grams), `${(load.capacity * 100).toFixed(0)}%`])] },
      { title: "Oven & Schedule", rows: [["Estimated oven hours", (plan.ovenMinutes / 60).toFixed(1)], ["Thursday", "Starter and inclusion prep"], ["Friday", "Bread and bagel production"], ["Saturday", "Rolls, packaging, and loadout"]] },
      { title: "Packaging", rows: [["Recipe", "Buffered packages"], ...plan.production.map((row) => [row.recipe.name, Math.ceil(row.target * 1.1)])] },
    ];
    const response = await fetch("/api/google/export", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, title: `Saturday Pop-Up — ${kind === "doc" ? "Production Packet" : "Bake Plan"}`, sections }) });
    const result = await response.json();
    if (result.fileUrl) window.open(result.fileUrl, "_blank", "noopener,noreferrer"); else alert(result.error ?? "Google export is not available yet.");
  }
  return <><section className="page-heading"><div><p className="eyebrow">Production packet</p><h1>Reports & exports</h1><p>Everything stays reconciled with your saved recipes and event quantities.</p></div><div className="button-row"><button className="button secondary" onClick={onCsv}>Download CSV</button><button className="button primary" onClick={() => window.print()}>Print / Save PDF</button></div></section><section className="report-grid"><Metric label="Exact flour" value={formatGrams(plan.totalExactFlour)} detail="starter included once" /><Metric label="Buffered flour" value={formatGrams(plan.totalBufferedFlour)} detail="shopping target" /><Metric label="Active starter" value={formatGrams(plan.activeStarter)} detail="100% hydration" /><Metric label="Oven time" value={`${(plan.ovenMinutes / 60).toFixed(1)} hr`} detail="equipment blocks" /></section><section className="reports-layout"><article className="panel"><h2>Shopping list</h2>{plan.shopping.map((row) => <label className="check-row" key={row.name}><input type="checkbox" /><span>{row.name}<small>{formatGrams(row.buffered)}</small></span>{row.packages && <b>{row.packages} packages</b>}</label>)}</article><article className="panel"><h2>Google exports</h2><p className="muted">Connect Google only when you are ready to create a snapshot. Login never requests Drive access.</p><a className="button google button-link" href="/api/google/connect">Connect Google Drive</a><div className="button-row"><button className="button secondary" onClick={() => googleExport("doc")}>Create Google Doc</button><button className="button secondary" onClick={() => googleExport("sheet")}>Create Google Sheet</button></div><hr /><h3>Mixer loads</h3>{plan.mixerLoads.map((load) => <div className="load-row" key={load.load}><span>Load {load.load}</span><b>{formatGrams(load.grams)}</b><em>{(load.capacity * 100).toFixed(0)}%</em></div>)}</article></section></>;
}

function Account() { return <><section className="page-heading"><div><p className="eyebrow">Your workspace</p><h1>Account & settings</h1><p>Control sign-in, bakery defaults, exports, privacy, and your data.</p></div></section><section className="settings-grid"><AuthPanel /><article className="panel"><h2>Bakery defaults</h2><label>Bakery name<input defaultValue="Hadley’s Kitchen" /></label><label>Starter hydration<input defaultValue="100%" /></label><label>Shopping buffer<input defaultValue="10%" /></label><label>Mixer capacity<input defaultValue="19,050 g" /></label><button className="button primary">Save defaults</button></article></section><p className="legal-links"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><button>Export my data</button><button className="danger">Delete account</button></p></>;
}
