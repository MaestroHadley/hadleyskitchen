"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { bakeryEvents, eventDate, eventTime, scheduleDate, upcomingEvents } from "@/content/events";
import { siteContent } from "@/content/site";

export function UpcomingEvents({ initialNow, preview = false }: {
  initialNow: number;
  preview?: boolean;
}) {
  const [now, setNow] = useState(initialNow);

  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = window.setInterval(refresh, 60_000);
    // Catch up immediately when a backgrounded page becomes visible again.
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("pageshow", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("pageshow", refresh);
    };
  }, []);

  const events = upcomingEvents(bakeryEvents, now);
  const visibleEvents = preview ? events.slice(0, 1) : events;

  return (
    <section
      id={preview ? undefined : "events"}
      className={preview ? "events-preview" : "page-section events-section"}
      aria-labelledby={preview ? "events-preview-heading" : "events-heading"}
    >
      <div className="container events-panel">
        <div className="events-panel__content">
          <h2 id={preview ? "events-preview-heading" : "events-heading"} className="events-heading">
            {preview ? (visibleEvents[0]?.preorderSchedule ? "Upcoming preorders" : "Come say hello") : "Upcoming Events"}
          </h2>
          {visibleEvents.length ? visibleEvents.map((event) => (
            <article className="event-details" key={`${event.startsAt}-${event.title}`}>
              <h3>{event.title}</h3>
              {event.preorderSchedule ? (
                <div>
                  <p><strong>Opens:</strong>{" "}<time dateTime={event.preorderSchedule.opensOn}>{scheduleDate(event.preorderSchedule.opensOn)}</time></p>
                  <p><strong>Order before:</strong>{" "}<time dateTime={event.endsAt}>{scheduleDate(event.endsAt)} at {eventTime(event.endsAt)} Pacific</time></p>
                  <p><strong>Pickup:</strong>{" "}<time dateTime={event.preorderSchedule.pickupOn}>{scheduleDate(event.preorderSchedule.pickupOn)}</time></p>
                </div>
              ) : (
                <p>
                  <time dateTime={event.startsAt}>{eventDate(event.startsAt)}</time>{" "}
                  <span className="event-details__time">
                    {eventTime(event.startsAt)}–{eventTime(event.endsAt)} · Pacific time
                  </span>
                </p>
              )}
              {event.location ? <p>{event.location}</p> : null}
              {event.description ? <p>{event.description}</p> : null}
              {!preview && event.preorderUrl ? (
                <a className="button button--secondary" href={event.preorderUrl}>
                  Preorder for this event
                </a>
              ) : null}
            </article>
          )) : <p className="events-empty">Something special is coming in November. Stay tuned for dates!</p>}
        </div>
        <div className="events-panel__actions">
          {preview ? (
            <Link className="button button--primary" href="/order#events">
              Event details
            </Link>
          ) : null}
          {!visibleEvents.length ? (
            <a className="button button--secondary" href={siteContent.site.updatesUrl}>
              Get Updates
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}
