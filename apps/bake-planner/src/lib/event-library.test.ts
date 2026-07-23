import { describe, expect, it } from "vitest";
import { filterEventCollection, type EventSummary } from "./event-library";

const now = new Date("2026-07-23T12:00:00-07:00");

function makeEvent(index: number, changes: Partial<EventSummary> = {}): EventSummary {
  return {
    id: `event-${index}`,
    name: `Market Event ${String(index).padStart(3, "0")}`,
    eventAt: new Date(now.getTime() + (index - 100) * 86_400_000).toISOString(),
    status: index % 3 === 0 ? "finalized" : "draft",
    updatedAt: new Date(now.getTime() - index * 60_000).toISOString(),
    totalProducts: index * 4,
    ...changes,
  };
}

describe("event library views", () => {
  const events = Array.from({ length: 250 }, (_, index) => makeEvent(index));

  it("scales smart views across 250 events and excludes legacy archives", () => {
    const withLegacy = [...events, makeEvent(999, { status: "archived" })];
    expect(filterEventCollection(withLegacy, { view: "upcoming", now })).toHaveLength(150);
    expect(filterEventCollection(withLegacy, { view: "past", now })).toHaveLength(100);
    expect(filterEventCollection(withLegacy, { view: "drafts", now })).toHaveLength(166);
    expect(filterEventCollection(withLegacy, { view: "completed", now })).toHaveLength(84);
  });

  it("supports case-insensitive search and each requested sort", () => {
    const matches = filterEventCollection(events, { view: "drafts", query: "event 101", now });
    expect(matches.map((event) => event.id)).toEqual(["event-101"]);

    const alphabetical = filterEventCollection(events.slice(0, 3).reverse(), { view: "drafts", sort: "name", now });
    expect(alphabetical.map((event) => event.name)).toEqual(["Market Event 001", "Market Event 002"]);

    const updated = filterEventCollection(events.slice(100, 104), { view: "upcoming", sort: "updated", now });
    expect(updated.map((event) => event.id)).toEqual(["event-100", "event-101", "event-102", "event-103"]);
  });

  it("handles missing dates and the exact event-time boundary", () => {
    const boundary = makeEvent(500, { eventAt: now.toISOString() });
    const missing = makeEvent(501, { eventAt: null, status: "draft" });
    expect(filterEventCollection([boundary, missing], { view: "upcoming", now }).map((event) => event.id)).toEqual(["event-500"]);
    expect(filterEventCollection([boundary, missing], { view: "past", now })).toEqual([]);
    expect(filterEventCollection([boundary, missing], { view: "drafts", now })).toHaveLength(2);
  });
});
