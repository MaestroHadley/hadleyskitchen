"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArrowRight, ArrowSquareOut, CalendarBlank, CaretLeft, CaretRight, Check, CheckCircle, FileArchive, FileDoc, GoogleDriveLogo, MagnifyingGlass, SpinnerGap, Table, WarningCircle, X } from "@phosphor-icons/react";
import { deleteEventPermanently } from "@/app/actions";
import type { EventSort, EventSummary, EventView } from "@/lib/event-library";
import { googleConnectionFailureMessage } from "@/lib/google-oauth";

type Props = {
  events: EventSummary[];
  total: number;
  page: number;
  pageSize: number;
  filters: { query: string; view: EventView; sort: EventSort };
  archiveEventId?: string;
  googleStatus?: string;
  googleFailureReason?: string;
  archivedName?: string;
};

type Destination = "doc" | "sheet" | "download";
type ArchiveResult = { destination: Destination; url?: string; exportedAt: string; receiptId?: string };

const views: Array<{ value: EventView; label: string }> = [
  { value: "upcoming", label: "Upcoming" },
  { value: "drafts", label: "Drafts" },
  { value: "completed", label: "Completed" },
  { value: "past", label: "Past" },
];

function hrefFor(filters: Props["filters"], changes: Record<string, string | number>) {
  const merged = { ...filters, ...changes };
  const params = new URLSearchParams();
  if (merged.query) params.set("q", String(merged.query));
  if (merged.view !== "upcoming") params.set("view", String(merged.view));
  if (merged.sort !== "date") params.set("sort", String(merged.sort));
  if (Number(changes.page ?? 1) > 1) params.set("page", String(changes.page));
  return `/events${params.size ? `?${params}` : ""}`;
}

function eventDestination(event: EventSummary) {
  return `/events/${event.id}/${event.status === "finalized" ? "report" : "plan"}`;
}

function formatEventDate(value: string | null) {
  if (!value) return "Date not set";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatUpdated(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

export function EventLibrary(props: Props) {
  const { events, total, page, pageSize, filters } = props;
  const router = useRouter();
  const [query, setQuery] = useState(filters.query);
  const [selected, setSelected] = useState<EventSummary | null>(() => events.find((event) => event.id === props.archiveEventId) ?? null);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const archiveReturnTo = (eventId: string) => {
    const currentView = hrefFor(filters, { page });
    return `${currentView}${currentView.includes("?") ? "&" : "?"}archive=${encodeURIComponent(eventId)}`;
  };

  useEffect(() => {
    if (query === filters.query) return;
    const timer = window.setTimeout(() => router.replace(hrefFor(filters, { query, page: 1 })), 350);
    return () => window.clearTimeout(timer);
  }, [filters, query, router]);

  return <>
    {props.archivedName && <div className="success-banner" role="status"><CheckCircle weight="fill" /><span><strong>{props.archivedName} was archived and deleted.</strong><small>Its external files remain available outside the planner.</small></span></div>}
    <div className="event-toolbar">
      <label className="search-field"><MagnifyingGlass aria-hidden="true" /><span className="sr-only">Search events</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events…" /></label>
      <select value={filters.sort} aria-label="Sort events" onChange={(event) => router.replace(hrefFor(filters, { sort: event.target.value, page: 1 }))}>
        <option value="date">Event date</option>
        <option value="updated">Recently updated</option>
        <option value="name">A–Z</option>
      </select>
    </div>
    <nav className="library-tabs" aria-label="Event views">
      {views.map((view) => <Link className={filters.view === view.value ? "active" : ""} href={hrefFor(filters, { view: view.value, page: 1 })} key={view.value}>{view.label}</Link>)}
    </nav>
    {events.length ? <div className="event-table" role="list">
      <div className="event-table-head"><span>Event</span><span>Status</span><span>Production</span><span>Updated</span><span /></div>
      {events.map((event) => <article className="event-table-row" role="listitem" key={event.id}>
        <Link className="event-primary" href={eventDestination(event)}>
          <span className="event-icon"><CalendarBlank weight="duotone" /></span>
          <span><strong>{event.name}</strong><small>{formatEventDate(event.eventAt)}</small></span>
        </Link>
        <span><em className={event.status === "finalized" ? "status-pill finalized" : "status-pill"}>{event.status}</em></span>
        <span><strong>{event.totalProducts.toLocaleString()}</strong><small>items</small></span>
        <span><strong>{formatUpdated(event.updatedAt)}</strong><small>last change</small></span>
        <span className="event-row-actions"><Link className="compact-button event-open" href={eventDestination(event)}>{event.status === "finalized" ? "Report" : "Open"}<ArrowRight /></Link><button className="icon-action danger" onClick={() => setSelected(event)} aria-label={`Archive and delete ${event.name}`}><Archive /></button></span>
      </article>)}
    </div> : <div className="empty-state panel"><span className="empty-icon"><CalendarBlank /></span><h2>No events in this view</h2><p>Try another view or create a new production plan.</p><Link className="button primary" href="/events/new">Plan a new event</Link></div>}
    {pages > 1 && <nav className="pagination" aria-label="Event pages"><Link aria-disabled={page === 1} href={hrefFor(filters, { page: Math.max(1, page - 1) })}><CaretLeft />Previous</Link><span>Page {page} of {pages} · {total} events</span><Link aria-disabled={page === pages} href={hrefFor(filters, { page: Math.min(pages, page + 1) })}>Next<CaretRight /></Link></nav>}
    {selected && <ArchiveEventDialog event={selected} returnTo={archiveReturnTo(selected.id)} googleStatus={props.googleStatus} googleFailureReason={props.googleFailureReason} onClose={() => setSelected(null)} />}
  </>;
}

function ArchiveEventDialog({ event, returnTo, googleStatus, googleFailureReason, onClose }: { event: EventSummary; returnTo: string; googleStatus?: string; googleFailureReason?: string; onClose: () => void }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [stage, setStage] = useState<"archive" | "confirm">("archive");
  const [selected, setSelected] = useState<Record<Destination, boolean>>({ doc: false, sheet: false, download: true });
  const [connection, setConnection] = useState<"loading" | "connected" | "disconnected">("loading");
  const [results, setResults] = useState<ArchiveResult[]>([]);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState(googleStatus === "failed" ? googleConnectionFailureMessage(googleFailureReason) : "");
  const [acknowledged, setAcknowledged] = useState(false);
  const [typedName, setTypedName] = useState("");

  useEffect(() => {
    if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
    void fetch(`/api/google/status?eventId=${encodeURIComponent(event.id)}`).then(async (response) => {
      const result = await response.json();
      setConnection(response.ok && result.connected ? "connected" : "disconnected");
    }).catch(() => setConnection("disconnected"));
  }, [event.id]);

  function close() {
    dialogRef.current?.close();
    onClose();
  }

  async function exportGoogle(destination: "doc" | "sheet") {
    const response = await fetch("/api/google/export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: destination, eventId: event.id, archive: true }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? `Could not create the Google ${destination === "doc" ? "Doc" : "Sheet"}.`);
    return { destination, url: body.fileUrl, exportedAt: body.exportedAt, receiptId: body.receiptId } satisfies ArchiveResult;
  }

  async function exportDownload() {
    const response = await fetch(`/api/events/${event.id}/archive/download`, { method: "POST" });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error ?? "Could not create the downloadable archive.");
    }
    const blob = await response.blob();
    const disposition = response.headers.get("content-disposition") ?? "";
    const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? "bake-plan-archive.zip";
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    return { destination: "download", exportedAt: new Date().toISOString(), receiptId: response.headers.get("x-archive-receipt-id") ?? undefined } satisfies ArchiveResult;
  }

  async function createArchive() {
    const requested = (Object.entries(selected) as Array<[Destination, boolean]>).filter(([, enabled]) => enabled).map(([destination]) => destination);
    if (event.status !== "draft" && !requested.length) return setMessage("Choose at least one archive destination before deleting a finalized event.");
    if ((selected.doc || selected.sheet) && connection !== "connected") return setMessage("Connect Google Drive before creating the selected Google files.");
    setWorking(true);
    setMessage("");
    const completed = [...results];
    try {
      for (const destination of requested) {
        if (completed.some((result) => result.destination === destination)) continue;
        const result = destination === "download" ? await exportDownload() : await exportGoogle(destination);
        completed.push(result);
        setResults([...completed]);
      }
      setStage("confirm");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The archive could not be completed. Your event is still saved.");
    } finally {
      setWorking(false);
    }
  }

  async function permanentlyDelete() {
    setWorking(true);
    setMessage("");
    const result = await deleteEventPermanently({ eventId: event.id, eventName: typedName, acknowledged });
    if (!result.ok) {
      setWorking(false);
      return setMessage(result.error);
    }
    dialogRef.current?.close();
    router.push(`/events?archived=${encodeURIComponent(event.name)}`);
    router.refresh();
  }

  const googleRequested = selected.doc || selected.sheet;
  const canDelete = acknowledged && typedName === event.name && !working;
  return <dialog ref={dialogRef} className="archive-dialog" onCancel={(input) => { input.preventDefault(); close(); }}>
    <div className="dialog-shell">
      <header className="dialog-header"><div><p className="eyebrow">{stage === "archive" ? "Create a durable copy" : "Permanent deletion"}</p><h2>{stage === "archive" ? "Archive & delete event" : `Delete ${event.name}?`}</h2></div><button className="dialog-close" onClick={close} aria-label="Close archive dialog"><X /></button></header>
      {stage === "archive" ? <>
        <p className="dialog-intro">Choose where to preserve <strong>{event.name}</strong>. Selected destinations must finish successfully before deletion.</p>
        <div className="archive-options">
          <ArchiveChoice icon={<FileDoc weight="duotone" />} title="Google Doc" detail="Premium production packet" checked={selected.doc} complete={results.some((item) => item.destination === "doc")} onChange={(checked) => setSelected((current) => ({ ...current, doc: checked }))} />
          <ArchiveChoice icon={<Table weight="duotone" />} title="Google Sheet" detail="Structured planning tabs" checked={selected.sheet} complete={results.some((item) => item.destination === "sheet")} onChange={(checked) => setSelected((current) => ({ ...current, sheet: checked }))} />
          <ArchiveChoice icon={<FileArchive weight="duotone" />} title="Download ZIP" detail="HTML, CSV, and complete JSON snapshot" checked={selected.download} complete={results.some((item) => item.destination === "download")} onChange={(checked) => setSelected((current) => ({ ...current, download: checked }))} />
        </div>
        {googleRequested && connection === "loading" && <p className="inline-message"><SpinnerGap className="spin" />Checking Google Drive…</p>}
        {googleRequested && connection === "disconnected" && <a className="button google-button button-link" href={`/api/google/connect?returnTo=${encodeURIComponent(returnTo)}`}><GoogleDriveLogo weight="bold" />Connect Google Drive<ArrowSquareOut /></a>}
        {results.length > 0 && <div className="archive-results">{results.map((result) => <span key={result.destination}><CheckCircle weight="fill" />{result.destination === "download" ? "ZIP downloaded" : `Google ${result.destination === "doc" ? "Doc" : "Sheet"} created`}{result.url && <a href={result.url} target="_blank" rel="noreferrer">Open <ArrowSquareOut /></a>}</span>)}</div>}
        {message && <p className="inline-message error" role="alert"><WarningCircle />{message}</p>}
        <footer className="dialog-actions"><button className="button secondary" onClick={close}>Cancel</button><button className="button primary icon-button" onClick={createArchive} disabled={working || (googleRequested && connection === "loading")}>{working ? <SpinnerGap className="spin" /> : <Archive />} {event.status === "draft" && !Object.values(selected).some(Boolean) ? "Continue without archive" : "Create archive"}</button></footer>
      </> : <>
        <div className="danger-callout"><WarningCircle weight="fill" /><span><strong>This cannot be undone.</strong><small>The event and its planner data will be permanently removed. Saved recipes and external archive files will remain.</small></span></div>
        {results.length > 0 && <div className="archive-results">{results.map((result) => <span key={result.destination}><Check weight="bold" />{result.destination === "download" ? "ZIP archive saved" : `Google ${result.destination === "doc" ? "Doc" : "Sheet"} saved`}{result.url && <a href={result.url} target="_blank" rel="noreferrer">Open <ArrowSquareOut /></a>}</span>)}</div>}
        <label className="acknowledge-row"><input type="checkbox" checked={acknowledged} onChange={(input) => setAcknowledged(input.target.checked)} /><span>I understand this event cannot be restored in the planner.</span></label>
        <label className="confirm-name">Type <strong>{event.name}</strong> to confirm<input value={typedName} onChange={(input) => setTypedName(input.target.value)} autoComplete="off" /></label>
        {message && <p className="inline-message error" role="alert"><WarningCircle />{message}</p>}
        <footer className="dialog-actions"><button className="button secondary" onClick={() => setStage("archive")}>Back</button><button className="button danger-button icon-button" onClick={permanentlyDelete} disabled={!canDelete}>{working ? <SpinnerGap className="spin" /> : <Archive />}Delete event permanently</button></footer>
      </>}
    </div>
  </dialog>;
}

function ArchiveChoice({ icon, title, detail, checked, complete, onChange }: { icon: React.ReactNode; title: string; detail: string; checked: boolean; complete: boolean; onChange: (checked: boolean) => void }) {
  return <label className={complete ? "archive-choice complete" : "archive-choice"}>
    <input type="checkbox" checked={checked} disabled={complete} onChange={(input) => onChange(input.target.checked)} />
    <span className="archive-choice-icon">{complete ? <CheckCircle weight="fill" /> : icon}</span>
    <span><strong>{title}</strong><small>{complete ? "Archive created" : detail}</small></span>
  </label>;
}
