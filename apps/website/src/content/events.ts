export type BakeryEvent = {
  title: string;
  startsAt: string;
  endsAt: string;
  location?: string;
  kind?: "deadline";
  description?: string;
  preorderUrl?: string;
};

export const eventTimeZone = "America/Los_Angeles";

// Use ISO timestamps with the Eugene UTC offset (-07:00 PDT or -08:00 PST).
export const bakeryEvents: readonly BakeryEvent[] = [
  {
    title: "Thanksgiving Pre-Orders Close",
    description: "Pre-orders open Sunday, November 22. Please order before 6:30 PM Pacific on Monday, November 23. Pickup is Wednesday, November 25.",
    startsAt: "2026-11-23T18:30:00-08:00",
    endsAt: "2026-11-23T18:30:00-08:00",
    kind: "deadline",
  },
  {
    title: "Bread Pre-Orders Only",
    startsAt: "2026-12-05T10:00:00-08:00",
    endsAt: "2026-12-05T12:00:00-08:00",
    location: "527 N Garden Way, Eugene",
  },
  {
    title: "Hadley Holiday Market",
    description: "Multiple vendors and goodies! More details to come.",
    startsAt: "2026-12-12T10:00:00-08:00",
    endsAt: "2026-12-12T16:00:00-08:00",
    location: "527 N Garden Way, Eugene",
  },
  {
    title: "HK Pop-Up 9/26",
    startsAt: "2026-09-26T10:00:00-07:00",
    endsAt: "2026-09-26T14:00:00-07:00",
    location: "527 N Garden Way, Eugene, 97401",
  },
  // Simply Bread storefront PDF captured October 4, 2026, pages 1–3.
  // Retain the established pickup address; the storefront lists Eugene, OR 97401.
  {
    title: "Pick-Up ONLY 10/10",
    startsAt: "2026-10-10T10:00:00-07:00",
    endsAt: "2026-10-10T12:00:00-07:00",
    location: "527 N Garden Way, Eugene, 97401",
  },
  {
    title: "Full Pop-Up 10/17",
    startsAt: "2026-10-17T10:00:00-07:00",
    endsAt: "2026-10-17T14:00:00-07:00",
    location: "527 N Garden Way, Eugene, 97401",
  },
];

// Past events retained for reference, separate from the active event list.
export const archivedBakeryEvents: readonly BakeryEvent[] = [
  {
    title: "Anniversary Celebration",
    description: "Join us for our anniversary celebration and a surprise announcement!",
    startsAt: "2026-11-14T10:00:00-08:00",
    endsAt: "2026-11-14T15:00:00-08:00",
    location: "527 N Garden Way, Eugene, 97401",
  },
];

export function upcomingEvents(events: readonly BakeryEvent[], now: number) {
  return events
    .filter((event) => Date.parse(event.endsAt) > now)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: eventTimeZone,
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});
const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: eventTimeZone,
  hour: "numeric",
  minute: "2-digit",
});

export function eventDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export function eventTime(value: string) {
  return timeFormatter.format(new Date(value)).replace(":00", "");
}
