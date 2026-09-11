import type { Metadata } from "next";
import Link from "next/link";
import { siteContent } from "@/content/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Draft privacy information for website visitors and planning users.",
};

export default function PrivacyPage() {
  return (
    <div className="page">
      <section className="page-hero">
        <div className="container page-hero__layout">
          <div>
            <p className="eyebrow eyebrow--dark">Legal</p>
            <h1>Privacy Policy (Draft)</h1>
            <p className="hero__description">
              Effective date: August 16, 2026 · Draft for counsel review before publication.
            </p>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container">
          <h2>What we collect</h2>
          <ul>
            <li>Contact email and communication preferences you provide.</li>
            <li>Site usage details like pages visited and basic diagnostics.</li>
            <li>Order or planning inquiry details you submit.</li>
          </ul>
          <h2>How we use it</h2>
          <ul>
            <li>To answer questions and process order or contact requests.</li>
            <li>To operate the site securely and fix issues.</li>
            <li>To support legal compliance and abuse prevention.</li>
          </ul>
          <h2>Who we share with</h2>
          <p>
            We share limited information only with essential service providers needed to host and secure this site. No
            additional commercial data sales are expected in this draft phase.
          </p>
          <h2>Contact and updates</h2>
          <p>
            For privacy requests, please contact <a href={`mailto:${siteContent.site.email}`}>{siteContent.site.email}</a>.
          </p>
          <p>
            <Link href="/terms">Read our Terms of Service</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
