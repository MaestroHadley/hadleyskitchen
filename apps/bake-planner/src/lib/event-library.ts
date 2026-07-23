import type { PlannerEvent } from "./planner";

export type EventView = "upcoming" | "drafts" | "completed" | "past";
export type EventSort = "date" | "updated" | "name";

export type EventSummary = {
  id: string;
  name: string;
  eventAt: string | null;
  status: PlannerEvent["status"];
  updatedAt: string;
  totalProducts: number;
};

export type EventCollectionFilters = {
  query?: string;
  view?: EventView;
  sort?: EventSort;
  now?: Date;
};

export function filterEventCollection(events: EventSummary[], filters: EventCollectionFilters = {}) {
  const now = filters.now ?? new Date();
  const view = filters.view ?? "upcoming";
  const query = filters.query?.trim().toLocaleLowerCase();
  let rows = events.filter((event) => event.status !== "archived");

  if (query) rows = rows.filter((event) => event.name.toLocaleLowerCase().includes(query));
  if (view === "upcoming") rows = rows.filter((event) => event.eventAt && new Date(event.eventAt) >= now);
  if (view === "drafts") rows = rows.filter((event) => event.status === "draft");
  if (view === "completed") rows = rows.filter((event) => event.status === "finalized");
  if (view === "past") rows = rows.filter((event) => event.eventAt && new Date(event.eventAt) < now);

  rows.sort(filters.sort === "name"
    ? (a, b) => a.name.localeCompare(b.name)
    : filters.sort === "updated"
      ? (a, b) => b.updatedAt.localeCompare(a.updatedAt)
      : view === "past"
        ? (a, b) => (b.eventAt ?? "").localeCompare(a.eventAt ?? "")
        : (a, b) => (a.eventAt ?? "9999").localeCompare(b.eventAt ?? "9999"));
  return rows;
}
