import type { Metadata } from "next";
import { siteContent } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
};

export default function ContactPage() {
  return (
    <div className="page">
      <section className="page-hero">
        <div className="container page-hero__layout">
          <div>
            <p className="eyebrow eyebrow--dark">Contact</p>
            <h1>Reach out for orders, availability, and bakery questions.</h1>
          </div>

          <div className="page-hero__panel">
            <p>{siteContent.contact.intro}</p>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container contact-layout">
          <div className="contact-card">
            <h2>Contact details</h2>
            <div className="contact-list">
              {siteContent.contact.details.map((detail) => (
                <div className="contact-list__item" key={detail.label}>
                  <span className="contact-list__label">{detail.label}</span>
                  <p className="contact-list__value">{detail.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="contact-card">
            <h2>Ready to order?</h2>
            <p>
              Use the order link to start your inquiry, or email directly if you have a
              question before placing a request.
            </p>
            <div className="button-row">
              <a className="button button--secondary" href={siteContent.site.orderUrl}>
                Order inquiry
              </a>
              <a
                className="button button--ghost"
                href={`mailto:${siteContent.site.email}`}
              >
                Email Hadley&apos;s Kitchen
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
