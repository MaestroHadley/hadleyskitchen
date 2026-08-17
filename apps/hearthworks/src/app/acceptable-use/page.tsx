import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Acceptable Use Policy",
  description:
    "Rules for lawful and safe use of Hearthworks, including content, access, and operational conduct requirements.",
};

export default function AcceptableUsePage() {
  return (
    <main className="legal-page">
      <div className="container legal-page__inner">
        <p className="eyebrow">Hearthworks legal</p>
        <h1>Acceptable Use Policy</h1>
        <p className="legal-page__meta">
          <small>Effective date: August 16, 2026</small>
        </p>

        <section>
          <h2>You may not use Hearthworks to</h2>
          <ul>
            <li>Break laws, regulations, or contractual rights.</li>
            <li>Sell, label, or market food under unsafe, deceptive, or unlawful practices.</li>
            <li>Publish or rely on allergen, medical, nutritional, inspection, or regulatory claims without authority.</li>
            <li>Upload or distribute unlawful, infringing, threatening, or privacy-invasive material.</li>
            <li>Process sensitive personal data through fields not designed for that purpose.</li>
            <li>Use automated scraping or data extraction outside approved methods.</li>
            <li>Probe or bypass security controls, authentication, or anti-abuse systems.</li>
            <li>Facilitate fraud, identity abuse, tax evasion, or criminal activity.</li>
            <li>Treat outputs as if they are medical, emergency, or life-safety controls.</li>
          </ul>
        </section>

        <section>
          <h2>You may not harm the service or other users</h2>
          <ul>
            <li>Attempt unauthorized access to another bakery workspace.</li>
            <li>Upload malware, disrupt systems, or overload the service.</li>
            <li>Remove or tamper with notices, ownership marks, or security warnings.</li>
            <li>Reverse engineer core product features for competing service creation.</li>
          </ul>
        </section>

        <section>
          <h2>Content controls</h2>
          <p>
            You represent that you have rights to every recipe, photo, and text you submit. Keep private recipes,
            receipts, and personal info out of public fields unless you control disclosure.
          </p>
        </section>

        <section>
          <h2>Enforcement</h2>
          <p>
            We may remove content, restrict access, or suspend accounts when necessary to protect users,
            providers, or the service and to comply with law.
          </p>
          <p>
            Contact details for suspected abuse will be published under operator settings once final contact channels are
            in place.
          </p>
        </section>

        <div className="legal-page__cta">
          <Link href="/terms">View Terms</Link>
        </div>
      </div>
    </main>
  );
}

