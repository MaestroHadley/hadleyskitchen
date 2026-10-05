import assert from "node:assert/strict";
import test from "node:test";
import { bakeryEvents, upcomingEvents, eventDate, eventTime } from "./events.ts";

// Fixed fixtures keep behavior tests independent of the changing event calendar.
const event = Object.freeze({
  title: "Test market",
  startsAt: "2026-09-13T14:00:00-07:00",
  endsAt: "2026-09-13T19:00:00-07:00",
  location: "Test location",
});
test("market fixture stays listed before and during the event, then expires at 7 pm Pacific", () => {
  for (const instant of ["2026-09-11T12:00:00-07:00", event.startsAt, "2026-09-13T18:59:59-07:00"]) {
    assert.deepEqual(upcomingEvents([event], Date.parse(instant)), [event]);
  }
  for (const instant of [event.endsAt, "2026-09-14T00:00:00-07:00"]) {
    assert.deepEqual(upcomingEvents([event], Date.parse(instant)), []);
  }
});
test("sorts future events without mutating the authored order and excludes ended events", () => {
  const later = { ...event, startsAt: "2026-09-20T14:00:00-07:00", endsAt: "2026-09-20T19:00:00-07:00" };
  const input = [later, event];
  assert.deepEqual(upcomingEvents(input, Date.parse("2026-09-11T00:00:00Z")), [event, later]);
  assert.deepEqual(input, [later, event]);
  assert.deepEqual(upcomingEvents(input, Date.parse(event.endsAt)), [later]);
  assert.deepEqual(upcomingEvents([], Date.parse("2026-09-11T00:00:00Z")), []);
});
test("formats Eugene dates and times independently of the viewer timezone, including winter", () => {
  assert.equal(eventDate(event.startsAt), "Sunday, September 13, 2026");
  assert.equal(eventTime(event.startsAt), "2 PM");
  assert.equal(eventTime(event.endsAt), "7 PM");
  assert.equal(eventDate("2026-09-14T01:00:00Z"), "Sunday, September 13, 2026");
  assert.equal(eventTime("2026-12-13T22:30:00Z"), "2:30 PM");
});

test("authored events have valid dates, unique identities, and HTTPS preorder links", () => {
  const identities = new Set();
  for (const entry of bakeryEvents) {
    assert.ok(entry.title.trim());
    assert.ok(entry.location.trim());
    assert.ok(Number.isFinite(Date.parse(entry.startsAt)));
    assert.ok(Date.parse(entry.endsAt) > Date.parse(entry.startsAt));
    const identity = `${entry.startsAt}-${entry.title}`;
    assert.ok(!identities.has(identity), `Duplicate event: ${identity}`);
    identities.add(identity);
    if (entry.preorderUrl) assert.equal(new URL(entry.preorderUrl).protocol, "https:");
  }
});

test("winter event expires at its exact Pacific end time", () => {
  const winter = { ...event, startsAt: "2026-12-13T14:00:00-08:00", endsAt: "2026-12-13T19:00:00-08:00" };
  assert.deepEqual(upcomingEvents([winter], Date.parse("2026-12-14T02:59:59.999Z")), [winter]);
  assert.deepEqual(upcomingEvents([winter], Date.parse("2026-12-14T03:00:00Z")), []);
});

test("October PDF events retain their confirmed dates and Pacific times without external card links", () => {
  const october = bakeryEvents.filter((entry) => entry.startsAt.startsWith("2026-10-"));
  assert.deepEqual(october.map(({ title, startsAt, endsAt }) => ({ title, startsAt, endsAt })), [
    { title: "Pick-Up ONLY 10/10", startsAt: "2026-10-10T10:00:00-07:00", endsAt: "2026-10-10T12:00:00-07:00" },
    { title: "Full Pop-Up 10/17", startsAt: "2026-10-17T10:00:00-07:00", endsAt: "2026-10-17T14:00:00-07:00" },
    { title: "Pick-Up ONLY 10/31", startsAt: "2026-10-31T10:00:00-07:00", endsAt: "2026-10-31T12:00:00-07:00" },
  ]);
  assert.deepEqual(upcomingEvents(bakeryEvents, Date.parse("2026-10-05T12:00:00Z")), october);
  for (const [index, entry] of october.entries()) {
    assert.equal(entry.preorderUrl, undefined);
    assert.match(eventDate(entry.startsAt), /^Saturday, October/);
    assert.equal(eventTime(entry.startsAt), "10 AM");
    assert.equal(eventTime(entry.endsAt), index === 1 ? "2 PM" : "12 PM");
    assert.ok(upcomingEvents(bakeryEvents, Date.parse(entry.endsAt) - 1).includes(entry));
    assert.deepEqual(upcomingEvents(bakeryEvents, Date.parse(entry.endsAt)), october.slice(index + 1));
  }
});
