import type { Metadata } from "next";
import { siteContent } from "@/content/site";

export const metadata: Metadata = {
  title: "Order",
  description:
    "Order sourdough bread, pastries, and other baked goods from Hadley's Kitchen online, or reach out for custom bakery requests.",
};

export default function OrderPage() {
  return (
    <div className="page">
      <section className="page-hero">
        <div className="container order-page__hero">
          <div>
            <p className="eyebrow eyebrow--dark">Order</p>
            <h1>Order Online</h1>
            <p className="hero__description section-copy--dark">{siteContent.order.intro}</p>
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
              href={`mailto:${siteContent.site.email}?subject=Custom%20Order%20Inquiry`}
            >
              Custom orders
            </a>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container">
          <div className="order-page__embedHeader">
            <p className="eyebrow eyebrow--dark">Order Here</p>
          </div>

          <iframe
            className="order-page__iframe"
            title="Hadley's Kitchen ordering page"
            src={siteContent.site.orderUrl}
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </section>
    </div>
  );
}
