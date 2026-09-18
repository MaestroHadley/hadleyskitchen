export type BakeryEvent = {
  title: string;
  startsAt: string;
  endsAt: string;
  location: string;
  preorderUrl?: string;
};

export const eventTimeZone = "America/Los_Angeles";

// Use ISO timestamps with the Eugene UTC offset (-07:00 PDT or -08:00 PST).
export const bakeryEvents: readonly BakeryEvent[] = [
  {
    title: "HK Pop-Up 9/26",
    startsAt: "2026-09-26T10:00:00-07:00",
    endsAt: "2026-09-26T14:00:00-07:00",
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
