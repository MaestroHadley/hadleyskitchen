import type { Metadata } from "next";
import Link from "next/link";
import { siteContent } from "@/content/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Draft legal terms for use of the Hadley's Kitchen website and connected planning resources.",
};

export default function TermsPage() {
  return (
    <div className="page">
      <section className="page-hero">
        <div className="container page-hero__layout">
          <div>
            <p className="eyebrow eyebrow--dark">Legal</p>
            <h1>Terms of Service (Draft)</h1>
            <p className="hero__description">
              Effective date: August 16, 2026 · Draft for counsel review before publication.
            </p>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container">
          <p>
            Hadley LLC, an Oregon limited liability company, does business as Hadley&apos;s Kitchen and provides the
            website and related planning support services. You are responsible for the food, labels, records, taxes, and safety
            practices of your bakery operations.
          </p>
          <h2>1. What this covers</h2>
          <p>
            This Terms page applies to use of this marketing site, planning materials, and any connected signup/contact
            flow.
          </p>
          <h2>2. Your responsibilities</h2>
          <ul>
            <li>Use information for lawful bakery operations only.</li>
            <li>Verify recipes, labels, and health-related claims before using them with customers.</li>
            <li>Retain your own records for financial, food-safety, and regulatory compliance.</li>
          </ul>
          <h2>3. Limits and risk</h2>
          <p>
            Output and examples are planning-oriented. They are not a substitute for legal, food-safety, tax, or accounting
            advice. To the fullest extent allowed by law, service liability is limited for the draft version of these terms.
          </p>
          <h2>4. Contact</h2>
          <p>
            Questions: <a href={`mailto:${siteContent.site.email}`}>{siteContent.site.email}</a>
          </p>
          <p>
            <Link href="/privacy">View our Privacy Policy</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
