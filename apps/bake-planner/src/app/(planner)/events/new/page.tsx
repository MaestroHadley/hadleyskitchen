import Link from "next/link";
import { ArrowLeft, CalendarBlank } from "@phosphor-icons/react/dist/ssr";
import { createEvent } from "@/app/actions";

export default function NewEventPage() {
  return <div className="narrow-page"><Link className="text-link" href="/dashboard"><ArrowLeft />Back to overview</Link><section className="panel new-event-card"><span className="feature-icon"><CalendarBlank weight="duotone" /></span><p className="eyebrow">New production plan</p><h1>What are you baking for?</h1><p className="muted">Give the event a name and date. You can refine everything else in the planner.</p><form action={createEvent} className="stack-form"><label>Event name<input name="name" required maxLength={120} placeholder="Saturday Market" autoFocus /></label><label>Event date<input name="date" type="date" /></label><button className="button primary" type="submit">Create event plan</button></form></section></div>;
}
