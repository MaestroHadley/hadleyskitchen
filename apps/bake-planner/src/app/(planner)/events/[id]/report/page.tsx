import Link from "next/link";
import { ArrowLeft, Check, Clock } from "@phosphor-icons/react/dist/ssr";
import { GoogleExportPanel } from "@/components/google-export-panel";
import { PageHeader } from "@/components/page-header";
import { ReportActions } from "@/components/report-actions";
import { calculatePlan, formatBatches, formatGrams } from "@/lib/planner";
import { getEvent } from "@/lib/planner-data";
import { buildReportSections, reportCsv } from "@/lib/reports";
import { notFound } from "next/navigation";

export default async function EventReportPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ google?: string; googleReason?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const data = await getEvent(id);
  if (!data) notFound();
  const plan = calculatePlan(data.recipes, data.event.items, data.settings);
  const sections = buildReportSections(data.event, data.recipes, data.settings);
  return <div className="report-page">
    <div className="print-hide"><Link className="text-link" href={`/events/${id}/plan`}><ArrowLeft />{data.event.status === "finalized" ? "Plan details" : "Back to plan"}</Link></div>
    <PageHeader eyebrow={data.event.status === "finalized" ? "Production packet · Finalized" : "Production packet · Draft"} title={data.event.name} description={data.event.eventAt ? new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(data.event.eventAt)) : "Date not set"} actions={<ReportActions csv={reportCsv(sections)} filename={`${data.event.name.toLocaleLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}-production.csv`} />} />
    <section className="report-metrics"><ReportMetric label="Production" value={`${plan.totalProducts} items`} detail={`${formatBatches(plan.totalBatches)} batches`} /><ReportMetric label="Exact flour" value={formatGrams(plan.totalExactFlour)} detail="starter counted once" /><ReportMetric label="Active starter" value={formatGrams(plan.activeStarter)} detail={`${Math.round(data.event.starterHydration * 100)}% hydration`} /><ReportMetric label="Oven time" value={`${(plan.ovenMinutes / 60).toFixed(1)} hr`} detail="estimated blocks" /></section>
    <section className="report-layout"><div className="report-main"><article className="panel report-section"><p className="eyebrow">Production</p><h2>Batch overview</h2><div className="report-table"><div><b>Recipe</b><b>Target</b><b>Batches</b><b>Planned</b></div>{plan.production.map((row) => <div key={row.recipe.id}><span>{row.recipe.name}</span><span>{row.target}</span><span>{formatBatches(row.batches)}</span><span>{row.planned}</span></div>)}</div></article><article className="panel report-section"><p className="eyebrow">Ingredient control</p><h2>Shopping list</h2>{plan.shopping.map((row) => <label className="shopping-row" key={row.name}><input type="checkbox" /><span><strong>{row.name}</strong><small>{Math.round(row.exact).toLocaleString()} g exact</small></span><b>{Math.round(row.buffered).toLocaleString()} g</b>{row.packages && <em>{row.packages} packages</em>}</label>)}</article><article className="panel report-section"><p className="eyebrow">Sequence</p><h2>Oven & schedule</h2>{data.event.schedule.map((block) => <div className="schedule-report-row" key={block.id ?? block.sortOrder}><span>{block.dayLabel}</span><div><strong>{block.title}</strong><small>{block.notes}</small></div></div>)}</article></div><aside className="report-aside"><article className="panel starter-card"><p className="eyebrow">Starter build</p><h2>{formatGrams(plan.starterBuild.target)}</h2><p>Buffered target</p><div><span>Seed starter<b>{formatGrams(plan.starterBuild.seed)}</b></span><span>Flour feed<b>{formatGrams(plan.starterBuild.flour)}</b></span><span>Water feed<b>{formatGrams(plan.starterBuild.water)}</b></span></div></article><article className="panel qa-card"><p className="eyebrow">Final QA</p><h2>Ready for production</h2>{["Quantities verified", "Starter scheduled", "Shopping completed", "Oven sequence confirmed", "Final count reconciled"].map((label) => <label key={label}><input type="checkbox" /><span>{label}</span><Check /></label>)}</article><article className="mini-panel"><Clock /><span><strong>{(plan.ovenMinutes / 60).toFixed(1)} oven hours</strong><small>Across {plan.production.length} products</small></span></article></aside></section>
    {id !== "sample" && <div className="print-hide google-report"><GoogleExportPanel eventId={id} callbackStatus={query.google} failureReason={query.googleReason} /></div>}
  </div>;
}

function ReportMetric({ label, value, detail }: { label: string; value: string; detail: string }) { return <article className="report-metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>; }
