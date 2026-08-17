import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accessibility Statement",
  description:
    "Hearthworks commitment to accessibility, current conformance status, and support process for barriers.",
};

export default function AccessibilityPage() {
  return (
    <main className="legal-page">
      <div className="container legal-page__inner">
        <p className="eyebrow">Hearthworks legal</p>
        <h1>Accessibility Statement</h1>
        <p className="legal-page__meta">
          <small>Last updated: August 16, 2026</small>
        </p>

        <p className="legal-page__note">
          This is our accessibility representation based on current implementation and planned accessibility work.
        </p>

        <section>
          <h2>Commitment</h2>
          <p>
            Hearthworks is working toward WCAG 2.2 AA outcomes for the marketing site and planner where reasonably
            applicable. We continue improving keyboard support, focus states, contrast, mobile touch sizing, and
            clear labeling.
          </p>
        </section>

        <section>
          <h2>Current status</h2>
          <p>
            We have not completed a formal third-party accessibility audit. Not every feature or flow should be treated
            as fully conforming yet.
          </p>
        </section>

        <section>
          <h2>Report barriers</h2>
          <p>
            If part of the site or app is not usable with your device, please report what page you were trying to
            use and what assistance is needed. We will respond and track accessibility fixes as a priority for access
            and core workflows.
          </p>
        </section>

        <div className="legal-page__cta">
          <Link href="/terms">View Terms</Link>
        </div>
      </div>
    </main>
  );
}

