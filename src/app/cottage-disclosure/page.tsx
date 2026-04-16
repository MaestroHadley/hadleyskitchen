import type { Metadata } from "next";
import Image from "next/image";
import { siteContent } from "@/content/site";

export const metadata: Metadata = {
  title: "Cottage Disclosure",
};

export default function CottageDisclosurePage() {
  return (
    <div className="page">
      <section className="page-hero">
        <div className="container page-hero__layout">
          <div>
            <p className="eyebrow eyebrow--dark">Disclosure</p>
            <h1>{siteContent.disclosure.title}</h1>
          </div>

          <div className="page-hero__panel">
            <p>
              This page keeps the required cottage bakery notice accessible from the site
              footer and available for all product and inquiry pages.
            </p>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container disclosure-layout">
          <div className="disclosure-mark">
            <Image
              src="/images/hk-logo.png"
              alt="Hadley's Kitchen logo."
              width={1200}
              height={1200}
            />
          </div>

          <div className="disclosure-card">
            <h2>{siteContent.disclosure.title}:</h2>
            <p>{siteContent.disclosure.body}</p>
            <p>{siteContent.disclosure.storage}</p>
            <p>{siteContent.disclosure.pets}</p>
            <p>{siteContent.site.email}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
