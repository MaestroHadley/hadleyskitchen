import type { Metadata } from "next";
import { connection } from "next/server";
import { UpcomingEvents } from "@/components/upcoming-events";
import { siteContent } from "@/content/site";

export const metadata: Metadata = {
  title: "Events & Ordering",
  description:
    "Find upcoming Hadley's Kitchen markets and pop-ups in Eugene, and order sourdough bread, pastries, and other baked goods online.",
};

export default async function OrderPage() {
  await connection();
  // Request-time server snapshot; shared with the client to keep hydration consistent.
  // eslint-disable-next-line react-hooks/purity
  const initialNow = Date.now();
  return (
    <div className="page">
      <section className="page-hero">
        <div className="container order-page__hero">
          <div>
            <p className="eyebrow eyebrow--dark">Visit &amp; Order</p>
            <h1>Events &amp; Ordering</h1>
            <p className="hero__description section-copy--dark">Find us at an upcoming market or pop-up, or browse our online ordering below.</p>
            <nav className="button-row order-page__jumpLinks" aria-label="On this page">
              <a className="button button--primary" href="#events">Upcoming Events</a>
              <a className="button button--secondary" href="#ordering">Order Online</a>
            </nav>
          </div>

          <div className="order-page__actions">
            <a
              className="button button--secondary"
              href={siteContent.site.orderUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open ordering in a new tab
            </a>
            <a
              className="button button--secondary order-page__customButton"
              href={siteContent.site.updatesUrl}
              target="_blank"
              rel="noreferrer"
            >
              Get Updates
            </a>
          </div>
        </div>
      </section>

      <UpcomingEvents initialNow={initialNow} />

      <section className="page-section" id="ordering" aria-labelledby="ordering-heading">
        <div className="container">
          <div className="order-page__embedHeader">
            <h2 id="ordering-heading" className="section-title section-title--dark">Order Online</h2>
            <p className="section-copy section-copy--dark">{siteContent.order.intro}</p>
          </div>

          <iframe
            className="order-page__iframe"
            title="Hadley's Kitchen ordering page"
            src={siteContent.site.orderUrl}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            sandbox="allow-forms allow-same-origin allow-scripts"
          />
        </div>
      </section>
    </div>
  );
}
