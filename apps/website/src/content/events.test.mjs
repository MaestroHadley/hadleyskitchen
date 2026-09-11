import assert from "node:assert/strict";
import test from "node:test";
import { bakeryEvents, upcomingEvents, eventDate, eventTime } from "./events.ts";

const event = bakeryEvents[0];
test("confirmed market stays listed before and during the event, then expires at 7 pm Pacific", () => {
  for (const instant of ["2026-09-11T12:00:00-07:00", event.startsAt, "2026-09-13T18:59:59-07:00"]) {
    assert.deepEqual(upcomingEvents(bakeryEvents, Date.parse(instant)), [event]);
  }
  for (const instant of [event.endsAt, "2026-09-14T00:00:00-07:00"]) {
    assert.deepEqual(upcomingEvents(bakeryEvents, Date.parse(instant)), []);
  }
});
test("sorts future events without mutating the authored order and excludes ended events", () => {
  const later = { ...event, startsAt: "2026-09-20T14:00:00-07:00", endsAt: "2026-09-20T19:00:00-07:00" };
  const input = [later, event];
  assert.deepEqual(upcomingEvents(input, Date.parse("2026-09-11T00:00:00Z")), [event, later]);
  assert.deepEqual(input, [later, event]);
  assert.deepEqual(upcomingEvents(input, Date.parse(event.endsAt)), [later]);
  assert.deepEqual(upcomingEvents([], Date.now()), []);
});
test("formats Eugene dates and times independently of the viewer timezone, including winter", () => {
  assert.equal(eventDate(event.startsAt), "Sunday, September 13, 2026");
  assert.equal(eventTime(event.startsAt), "2 PM");
  assert.equal(eventTime(event.endsAt), "7 PM");
  assert.equal(eventDate("2026-09-14T01:00:00Z"), "Sunday, September 13, 2026");
  assert.equal(eventTime("2026-12-13T22:30:00Z"), "2:30 PM");
});
