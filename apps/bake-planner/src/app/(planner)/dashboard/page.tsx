import Link from "next/link";
import { ArrowRight, CalendarBlank, CheckCircle, Notebook, ShoppingCartSimple, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { seedSampleWorkspace, startCleanWorkspace } from "@/app/actions";
import { PageHeader } from "@/components/page-header";
import { calculatePlan, formatBatches, formatGrams } from "@/lib/planner";
import { getEvent, listEvents, listRecipes } from "@/lib/planner-data";

export default async function DashboardPage() {
  const [eventResult, recipeResult] = await Promise.all([listEvents({ view: "upcoming", pageSize: 1 }), listRecipes({ pageSize: 4 })]);
  if (!eventResult.total && !recipeResult.total) return <>
    <PageHeader eyebrow="Welcome to your workspace" title="Start with a little momentum." description="Choose the setup that feels right. You can remove the sample at any time." />
    <section className="onboarding-grid">
      <article className="onboarding-card featured"><span className="onboarding-icon"><Sparkle weight="fill" /></span><p className="eyebrow">Recommended</p><h2>Explore the Saturday sample</h2><p>See a complete event with nine recipes, exact starter control, and a production-ready shopping list.</p><form action={seedSampleWorkspace}><button className="button light icon-button" type="submit">Add the sample workspace<ArrowRight /></button></form></article>
      <article className="onboarding-card"><span className="onboarding-icon neutral"><Notebook /></span><p className="eyebrow">Fresh start</p><h2>Build your own library</h2><p>Begin with a clean workspace and add the recipes you bake most often.</p><form action={startCleanWorkspace}><button className="button secondary icon-button" type="submit">Start clean<ArrowRight /></button></form></article>
    </section>
  </>;

  const nextEvent = eventResult.events[0];
  const eventData = nextEvent ? await getEvent(nextEvent.id) : null;
  const plan = eventData ? calculatePlan(eventData.recipes, eventData.event.items, eventData.settings) : null;
  return <>
    <PageHeader eyebrow="Production workspace" title="Good bakes start with a calm plan." description="Everything you need for the next market, without the spreadsheet." actions={<div className="button-row"><Link className="button secondary" href="/events">View all events</Link><Link className="button primary icon-button" href="/events/new"><CalendarBlank weight="bold" />Plan an event</Link></div>} />
    {nextEvent && plan ? <section className="hero-event">
      <div><p className="eyebrow">Next event</p><h2>{nextEvent.name}</h2><p>{nextEvent.eventAt ? new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(nextEvent.eventAt)) : "Date not set"}</p></div>
      <div className="hero-event-status"><span className={nextEvent.status === "finalized" ? "status-pill finalized" : "status-pill"}>{nextEvent.status === "finalized" ? <CheckCircle weight="fill" /> : <i />}{nextEvent.status}</span><Link className="button light icon-button" href={`/events/${nextEvent.id}/${nextEvent.status === "finalized" ? "report" : "plan"}`}>{nextEvent.status === "finalized" ? "View report" : "Continue planning"}<ArrowRight /></Link></div>
    </section> : <section className="hero-event empty"><div><p className="eyebrow">Your next market</p><h2>Ready when you are.</h2><p>Create an event and choose recipes from your saved library.</p></div><Link className="button light" href="/events/new">Plan an event</Link></section>}
    <section className="metric-grid">
      <article className="metric-card"><span>Production</span><strong>{plan?.totalProducts ?? 0}</strong><small>items planned</small></article>
      <article className="metric-card"><span>Batches</span><strong>{formatBatches(plan?.totalBatches ?? 0)}</strong><small>recipe batches</small></article>
      <article className="metric-card"><span>Flour control</span><strong>{formatGrams(plan?.totalBufferedFlour ?? 0)}</strong><small>buffered total</small></article>
      <article className="metric-card"><span>Active starter</span><strong>{formatGrams(plan?.activeStarter ?? 0)}</strong><small>required in dough</small></article>
    </section>
    <section className="dashboard-grid">
      <article className="panel"><div className="section-heading"><div><p className="eyebrow">Recipe library</p><h2>Recently updated</h2></div><Link className="text-link" href="/recipes">View all <ArrowRight /></Link></div>{recipeResult.recipes.map((recipe) => <Link className="dashboard-row" href={`/recipes/${recipe.id}`} key={recipe.id}><span className="row-icon"><Notebook /></span><span><strong>{recipe.name}</strong><small>{recipe.category} · {recipe.yieldPerBatch} {recipe.yieldLabel}</small></span><ArrowRight /></Link>)}</article>
      <article className="panel"><div className="section-heading"><div><p className="eyebrow">Plan control</p><h2>{nextEvent ? nextEvent.name : "No active event"}</h2></div><ShoppingCartSimple /></div>{plan ? <><div className="control-summary"><span><small>Exact flour</small><strong>{formatGrams(plan.totalExactFlour)}</strong></span><span><small>Oven blocks</small><strong>{(plan.ovenMinutes / 60).toFixed(1)} hr</strong></span></div>{plan.production.slice(0, 4).map((row) => <div className="compact-production" key={row.recipe.id}><span>{row.recipe.name}</span><strong>{formatBatches(row.batches)} batches</strong></div>)}</> : <p className="muted">Your next event’s flour, starter, and oven totals will appear here.</p>}</article>
    </section>
  </>;
}
