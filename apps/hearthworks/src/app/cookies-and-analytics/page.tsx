import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie and Analytics Notice",
  description:
    "Notice describing essential cookies, session storage, and marketing analytics used by the Hearthworks site and app.",
};

export default function CookiePage() {
  return (
    <main className="legal-page">
      <div className="container legal-page__inner">
        <p className="eyebrow">Hearthworks legal</p>
        <h1>Cookie and Analytics Notice</h1>
        <p className="legal-page__meta">
          <small>Effective date: August 16, 2026</small>
        </p>

        <section>
          <h2>Authenticated application</h2>
          <p>The planning application uses essential first-party storage for:</p>
          <ul>
            <li>Session continuity and sign-in state.</li>
            <li>Authentication and OAuth request integrity.</li>
            <li>Returning the user to the correct page after authorization.</li>
            <li>Security-relevant app state.</li>
          </ul>
        </section>

        <section>
          <h2>Marketing site analytics</h2>
          <p>
            The public site uses Vercel Web Analytics. It is used for aggregate, product-level insights and is
            documented as a no-cookie analytics model with daily-reset hashed visitor data.
          </p>
          <p>
            We do not currently deploy behavioural advertising cookies, third-party targeting pixels, or broad
            cross-site tracking in this release.
          </p>
        </section>

        <section>
          <h2>Consent and controls</h2>
          <p>
            Blocking cookies may break login, sign-in, or auth callbacks. Because nonessential advertising
            technologies are not active, there is no separate ad-consent banner in this version.
          </p>
          <p>Provider-level controls and browser settings still apply.</p>
        </section>

        <div className="legal-page__cta">
          <Link href="/privacy">View Privacy Policy</Link>
        </div>
      </div>
    </main>
  );
}

