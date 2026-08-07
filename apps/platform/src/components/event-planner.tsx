"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarBlank, Check, CheckCircle, Clock, MagnifyingGlass, Plus, SpinnerGap, Trash, WarningCircle } from "@phosphor-icons/react";
import { finishEvent, reopenEvent, saveEventPlan } from "@/app/actions";
import { calculatePlan, formatBatches, formatGrams, type PlannerEvent, type PlannerSettings, type Recipe, type ScheduleBlock } from "@/lib/planner";

const steps = ["Details", "Products", "Plan review", "Schedule", "Finish"];

export function EventPlanner({ initialEvent, recipes, settings }: { initialEvent: PlannerEvent; recipes: Recipe[]; settings: PlannerSettings }) {
  const router = useRouter();
  const [event, setEvent] = useState(initialEvent);
  const [step, setStep] = useState(initialEvent.items.length ? 2 : 1);
  const [query, setQuery] = useState("");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const [message, setMessage] = useState("");
  const firstRender = useRef(true);
  const planSettings = useMemo(() => ({ ...settings, shoppingBuffer: event.shoppingBuffer, starterHydration: event.starterHydration }), [settings, event.shoppingBuffer, event.starterHydration]);
  const plan = useMemo(() => calculatePlan(recipes, event.items, planSettings), [recipes, event.items, planSettings]);
  const visibleRecipes = recipes.filter((recipe) => !recipe.archivedAt && recipe.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));

  const selected = new Map(event.items.map((item) => [item.recipeId, item]));
  const patchEvent = (changes: Partial<PlannerEvent>) => {
    setSaveState("saving");
    setEvent((current) => ({ ...current, ...changes }));
  };
  const updateItem = (recipeId: string, changes: Partial<PlannerEvent["items"][number]>) => patchEvent({ items: event.items.map((item) => item.recipeId === recipeId ? { ...item, ...changes } : item) });
  const toggleRecipe = (recipe: Recipe) => patchEvent({ items: selected.has(recipe.id) ? event.items.filter((item) => item.recipeId !== recipe.id) : [...event.items, { recipeId: recipe.id, target: recipe.yieldPerBatch, policy: "whole" }] });

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = window.setTimeout(async () => {
      const result = await saveEventPlan(event);
      setSaveState(result.ok ? "saved" : "error");
      setMessage(result.ok ? "" : result.error);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [event]);

  async function persist(nextStep?: number) {
    setSaveState("saving");
    setMessage("");
    const result = await saveEventPlan(event);
    setSaveState(result.ok ? "saved" : "error");
    if (!result.ok) return setMessage(result.error);
    if (nextStep) setStep(nextStep);
  }

  async function finish() {
    setSaveState("saving");
    setMessage("");
    const result = await finishEvent(event);
    if (!result.ok) {
      setSaveState("error");
      return setMessage(result.error);
    }
    setSaveState("saved");
    router.push(`/events/${event.id}/report`);
  }

  if (event.status === "finalized") return <section className="finalized-gate"><CheckCircle weight="fill" /><p className="eyebrow">Plan finalized</p><h1>{event.name} is ready.</h1><p>View the production packet, or reopen the plan to make changes.</p><div className="button-row"><button className="button secondary" onClick={async () => { const result = await reopenEvent(event.id); if (result.ok) setEvent((current) => ({ ...current, status: "draft" })); else setMessage(result.error); }}>Reopen plan</button><button className="button primary" onClick={() => router.push(`/events/${event.id}/report`)}>View production packet</button></div>{message && <p className="inline-message error">{message}</p>}</section>;

  return <div className="plan-page">
    <header className="plan-header"><div><button className="text-link" onClick={() => router.push("/dashboard")}><ArrowLeft />Overview</button><p className="eyebrow">Event planner</p><h1>{event.name || "Untitled event"}</h1><span>{plan.totalProducts} items · {formatBatches(plan.totalBatches)} batches</span></div><div className={`save-indicator ${saveState}`}><i />{saveState === "saving" ? "Saving…" : saveState === "error" ? "Needs attention" : "Draft saved"}</div></header>
    <nav className="step-rail" aria-label="Event planning progress">{steps.map((label, index) => <button key={label} className={step === index + 1 ? "current" : step > index + 1 ? "done" : ""} onClick={() => setStep(index + 1)}><b>{step > index + 1 ? <Check weight="bold" /> : index + 1}</b><span>{label}</span></button>)}</nav>
    <section className="mobile-plan-summary"><span><small>Items</small><strong>{plan.totalProducts}</strong></span><span><small>Batches</small><strong>{formatBatches(plan.totalBatches)}</strong></span><span><small>Flour</small><strong>{(plan.totalExactFlour / 1000).toFixed(1)} kg</strong></span></section>
    <article className="panel plan-panel">
      <div className="plan-step-heading"><div><p className="eyebrow">Step {step} of {steps.length}</p><h2>{steps[step - 1]}</h2></div>{step > 1 && <span className="step-count">{step}/{steps.length}</span>}</div>
      {step === 1 && <EventDetails event={event} patchEvent={patchEvent} />}
      {step === 2 && <ProductSelection recipes={visibleRecipes} selected={selected} query={query} setQuery={setQuery} toggleRecipe={toggleRecipe} updateItem={updateItem} />}
      {step === 3 && <PlanReview plan={plan} />}
      {step === 4 && <ScheduleStep plan={plan} schedule={event.schedule} onChange={(schedule) => patchEvent({ schedule })} />}
      {step === 5 && <FinishStep event={event} plan={plan} />}
      {message && <p className="inline-message error">{message}</p>}
      <footer className="plan-actions"><button className="button secondary icon-button" disabled={step === 1} onClick={() => setStep((current) => Math.max(1, current - 1))}><ArrowLeft />Back</button>{step < steps.length ? <button className="button primary icon-button" onClick={() => persist(step + 1)} disabled={saveState === "saving"}>{saveState === "saving" ? <SpinnerGap className="spin" /> : null}Continue to {steps[step]}<ArrowRight /></button> : <button className="button primary icon-button finish-button" onClick={finish} disabled={saveState === "saving"}>{saveState === "saving" ? <SpinnerGap className="spin" /> : <CheckCircle weight="fill" />}Finish plan</button>}</footer>
    </article>
  </div>;
}

function EventDetails({ event, patchEvent }: { event: PlannerEvent; patchEvent: (changes: Partial<PlannerEvent>) => void }) {
  const localDate = event.eventAt ? (() => { const date = new Date(event.eventAt); const offset = date.getTimezoneOffset(); return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16); })() : "";
  return <div className="step-content"><p className="muted">Name the event and set the working assumptions for this production plan.</p><div className="form-grid two"><label>Event name<input value={event.name} onChange={(input) => patchEvent({ name: input.target.value })} /></label><label>Event date and time<div className="input-with-icon"><CalendarBlank /><input type="datetime-local" value={localDate} onChange={(input) => patchEvent({ eventAt: input.target.value ? new Date(input.target.value).toISOString() : null })} /></div></label><label>Shopping buffer<div className="number-suffix"><input type="number" min="0" max="100" value={Math.round(event.shoppingBuffer * 100)} onChange={(input) => patchEvent({ shoppingBuffer: Number(input.target.value) / 100 })} /><span>%</span></div></label><label>Starter hydration<div className="number-suffix"><input type="number" min="1" max="300" value={Math.round(event.starterHydration * 100)} onChange={(input) => patchEvent({ starterHydration: Number(input.target.value) / 100 })} /><span>%</span></div></label></div></div>;
}

function ProductSelection({ recipes, selected, query, setQuery, toggleRecipe, updateItem }: { recipes: Recipe[]; selected: Map<string, PlannerEvent["items"][number]>; query: string; setQuery: (value: string) => void; toggleRecipe: (recipe: Recipe) => void; updateItem: (id: string, changes: Partial<PlannerEvent["items"][number]>) => void }) {
  return <div className="step-content"><p className="muted">Choose saved recipes and enter the exact quantities you want ready for market.</p><label className="search-field product-search"><MagnifyingGlass /><span className="sr-only">Search saved recipes</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a recipe…" /></label><div className="product-picker">{recipes.map((recipe) => { const item = selected.get(recipe.id); return <div className={item ? "product-card selected" : "product-card"} key={recipe.id}><button className="product-select" onClick={() => toggleRecipe(recipe)} aria-pressed={Boolean(item)}><span className="select-check">{item && <Check weight="bold" />}</span><span><strong>{recipe.name}</strong><small>{recipe.category} · {recipe.yieldPerBatch} {recipe.yieldLabel} per batch</small></span></button>{item && <div className="product-controls"><label>Target<input type="number" min="0" step="1" value={item.target} onChange={(input) => updateItem(recipe.id, { target: Number(input.target.value) })} /></label><label>Batching<select value={item.policy} onChange={(input) => updateItem(recipe.id, { policy: input.target.value as "whole" | "exact" })}><option value="whole">Whole batches</option><option value="exact">Exact scaling</option></select></label></div>}</div>; })}</div>{!recipes.length && <div className="empty-state compact"><MagnifyingGlass /><h3>No recipes match</h3><p>Try a different name.</p></div>}</div>;
}

function PlanReview({ plan }: { plan: ReturnType<typeof calculatePlan> }) {
  return <div className="step-content"><p className="muted">Every total below comes from the selected recipe versions and event quantities.</p><div className="report-metrics"><Metric label="Direct flour" value={formatGrams(plan.directFlour)} detail="recipe formulas" /><Metric label="Starter flour" value={formatGrams(plan.starterFlour)} detail="counted once" /><Metric label="Exact flour" value={formatGrams(plan.totalExactFlour)} detail="production need" /><Metric label="Buffered flour" value={formatGrams(plan.totalBufferedFlour)} detail="shopping target" /></div><div className="review-columns"><section><h3>Batch plan</h3>{plan.production.map((row) => <div className="review-row" key={row.recipe.id}><span><strong>{row.recipe.name}</strong><small>{row.target} target · {row.planned} planned{row.overage ? ` · ${row.overage} over` : ""}</small></span><b>{formatBatches(row.batches)} batches</b></div>)}</section><section><h3>Shopping list</h3>{plan.shopping.map((row) => <div className="review-row" key={row.name}><span><strong>{row.name}</strong><small>{Math.round(row.exact).toLocaleString()} g exact</small></span><b>{Math.round(row.buffered).toLocaleString()} g{row.packages ? ` · ${row.packages} packs` : ""}</b></div>)}</section></div></div>;
}

function ScheduleStep({ plan, schedule, onChange }: { plan: ReturnType<typeof calculatePlan>; schedule: ScheduleBlock[]; onChange: (schedule: ScheduleBlock[]) => void }) {
  const update = (index: number, changes: Partial<ScheduleBlock>) => onChange(schedule.map((block, blockIndex) => blockIndex === index ? { ...block, ...changes } : block));
  return <div className="step-content"><p className="muted">Use the oven estimates as a guide, then shape the production sequence around your kitchen.</p><section className="oven-overview"><div><Clock weight="duotone" /><span><small>Estimated oven time</small><strong>{(plan.ovenMinutes / 60).toFixed(1)} hours</strong></span></div>{plan.production.map((row) => <span key={row.recipe.id}><strong>{row.recipe.name}</strong><small>{Math.ceil(row.target / row.recipe.ovenCapacity)} loads · {row.recipe.cycleMinutes} min each</small></span>)}</section><div className="section-heading schedule-heading"><div><p className="eyebrow">Editable</p><h3>Production sequence</h3></div><button className="button secondary compact-button icon-button" onClick={() => onChange([...schedule, { dayLabel: "", title: "", notes: "", sortOrder: schedule.length }])}><Plus />Add block</button></div><div className="schedule-editor">{schedule.map((block, index) => <div className="schedule-block" key={block.id ?? index}><input value={block.dayLabel} onChange={(event) => update(index, { dayLabel: event.target.value })} placeholder="Day / block" aria-label={`Schedule block ${index + 1} day`} /><input value={block.title} onChange={(event) => update(index, { title: event.target.value })} placeholder="Task" aria-label={`Schedule block ${index + 1} task`} /><textarea value={block.notes} onChange={(event) => update(index, { notes: event.target.value })} placeholder="Notes" aria-label={`Schedule block ${index + 1} notes`} /><button onClick={() => onChange(schedule.filter((_, blockIndex) => blockIndex !== index))} aria-label="Delete schedule block"><Trash /></button></div>)}</div></div>;
}

function FinishStep({ event, plan }: { event: PlannerEvent; plan: ReturnType<typeof calculatePlan> }) {
  const checks = [
    { label: "Event details", ready: Boolean(event.name.trim()) },
    { label: "Production quantities", ready: plan.totalProducts > 0 },
    { label: "Flour and starter control", ready: plan.totalExactFlour > 0 },
    { label: "Production schedule", ready: event.schedule.some((block) => block.title.trim()) },
  ];
  return <div className="step-content finish-review"><p className="muted">Finishing locks in the current recipe versions and creates your production packet. You can reopen the plan later.</p><div className="finish-hero"><span><small>Total production</small><strong>{plan.totalProducts} items</strong></span><span><small>Recipe batches</small><strong>{formatBatches(plan.totalBatches)}</strong></span><span><small>Buffered flour</small><strong>{formatGrams(plan.totalBufferedFlour)}</strong></span></div><div className="finish-checks">{checks.map((check) => <div key={check.label}><span className={check.ready ? "ready" : "not-ready"}>{check.ready ? <Check weight="bold" /> : <WarningCircle weight="fill" />}</span><strong>{check.label}</strong><em>{check.ready ? "Ready" : "Review"}</em></div>)}</div></div>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) { return <article className="report-metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }
