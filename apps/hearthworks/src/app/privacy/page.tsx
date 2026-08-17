import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Hearthworks collects, uses, discloses, and protects bakery planning data and account information.",
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <div className="container legal-page__inner">
        <p className="eyebrow">Hearthworks legal</p>
        <h1>Privacy Policy</h1>
        <p className="legal-page__meta">
          <small>
            Hadley LLC, an Oregon limited liability company, does business as Hadley&apos;s Kitchen and
            provides the Hearthworks software service.
          </small>
        </p>
        <p className="legal-page__meta">
          <small>Effective date: August 16, 2026</small>
          <br />
          <small>Draft details should be reviewed with counsel before publication.</small>
        </p>

        <p className="legal-page__note">
          Replace bracketed placeholders before publication. The policy is written around current feature scope only.
        </p>

        <section>
          <h2>1) Scope</h2>
          <p>
            This policy explains how Hearthworks handles information from your use of the marketing site and
            planning application. It does not replace provider-level terms for Google, Supabase, Vercel, or Cloudflare.
          </p>
          <p>
            Please contact the operator via the published website channels for account and privacy requests.
          </p>
        </section>

        <section>
          <h2>2) Information we collect</h2>
          <h3>Account and workspace</h3>
          <ul>
            <li>Email and identity details for sign in</li>
            <li>Workspace profile, role, preferences, and recipe planning data</li>
            <li>Sales, production, expense, and results inputs you provide</li>
          </ul>

          <h3>Media and files</h3>
          <ul>
            <li>Public-ready image metadata and references used for catalogue presentation</li>
            <li>Transfer metadata for optional Google Drive exports</li>
            <li>Receipt data is sent through controlled transfer routes and remains in your Drive where you own it</li>
          </ul>

          <h3>Technical information</h3>
          <ul>
            <li>Request logs, route and device metadata for operation and security</li>
            <li>Vercel Web Analytics aggregate usage data for the marketing site</li>
          </ul>
        </section>

        <section>
          <h2>3) How we use information</h2>
          <ul>
            <li>Authenticate and secure accounts</li>
            <li>Run calculations, planning, reports, and exports</li>
            <li>Improve reliability and troubleshoot abuse or errors</li>
            <li>Handle support, legal, and accessibility requests</li>
            <li>Enforce Terms and operational security</li>
          </ul>
        </section>

        <section>
          <h2>4) Sharing and disclosures</h2>
          <ul>
            <li>To providers needed for hosting, auth, storage, and optional Google Drive features</li>
            <li>To authorized people in your workspace according to your account permissions</li>
            <li>For lawful legal, safety, or security demands</li>
            <li>In de-identified or aggregated reporting where personal identification is removed</li>
          </ul>
        </section>

        <section>
          <h2>5) Cookies and analytics</h2>
          <p>
            The marketing site uses Vercel Web Analytics with a no-cookie public analytics model. The authenticated
            app uses essential cookies/storage for sign-in and CSRF/session safety.
          </p>
          <p>
            There is no advertising profile tracking or behavioral ad profile in this version. If that changes, this
            policy and controls will be updated before the feature ships.
          </p>
        </section>

        <section>
          <h2>6) Retention and requests</h2>
          <p>
            Data is retained as needed for product operation, security, legal compliance, and support continuity.
            Exact period values are being finalized and will be inserted before publishing.
          </p>
          <p>
            You can request access, correction, or deletion through the published operator contact method once it is
            configured.
          </p>
        </section>

        <section>
          <h2>7) Contact</h2>
          <p>
            Questions about privacy, deletion, portability, or disclosures: <Link href="/service-providers">Service
            provider details</Link> and your published operator contact.
          </p>
        </section>

        <div className="legal-page__cta">
          <Link href="/">Return to Hearthworks</Link>
        </div>
      </div>
    </main>
  );
}
