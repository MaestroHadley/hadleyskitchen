import Link from "next/link";
import { CalendarPlus } from "@phosphor-icons/react/dist/ssr";
import { EventLibrary } from "@/components/event-library";
import { PageHeader } from "@/components/page-header";
import type { EventSort, EventView } from "@/lib/event-library";
import { listEvents } from "@/lib/planner-data";

export default async function EventsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const view: EventView = params.view === "drafts" || params.view === "completed" || params.view === "past" ? params.view : "upcoming";
  const sort: EventSort = params.sort === "updated" || params.sort === "name" ? params.sort : "date";
  const filters = {
    query: typeof params.q === "string" ? params.q : "",
    view,
    sort,
    page: typeof params.page === "string" ? Math.max(1, Number(params.page) || 1) : 1,
  };
  const result = await listEvents(filters);
  return <>
    <PageHeader eyebrow="Production calendar" title="Your events" description="Plan what’s next, return to work in progress, and safely archive completed production." actions={<Link className="button primary icon-button" href="/events/new"><CalendarPlus weight="bold" />New event</Link>} />
    <EventLibrary
      {...result}
      filters={filters}
      archiveEventId={typeof params.archive === "string" ? params.archive : undefined}
      googleStatus={typeof params.google === "string" ? params.google : undefined}
      googleFailureReason={typeof params.googleReason === "string" ? params.googleReason : undefined}
      archivedName={typeof params.archived === "string" ? params.archived : undefined}
    />
  </>;
}
