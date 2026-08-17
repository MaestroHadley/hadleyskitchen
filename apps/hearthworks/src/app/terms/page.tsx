import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Hearthworks legal terms covering service use, responsibilities, disclaimers, and liability limits.",
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <div className="container legal-page__inner">
        <p className="eyebrow">Hearthworks legal</p>
        <h1>Terms of Service</h1>
        <p className="legal-page__meta">
          <small>Effective date: August 16, 2026</small>
          <br />
          <small>Draft from internal legal package; final entity details are pending counsel review.</small>
        </p>

        <p className="legal-page__note">
          These Terms use square-bracketed operator details where placeholders are still expected to be replaced
          before publication.
        </p>

        <section>
          <h2>1) Agreement and scope</h2>
          <p>
            These Terms are a binding agreement between you and the Hearthworks operator when you use
            <strong> hearthworks.co</strong> and related planning features. If you are using the Service
            for an organization, “you” includes both you and that organization.
          </p>
          <p>You must be at least 18 and using the Service for bakery business or professional bakery operations.</p>
        </section>

        <section>
          <h2>2) What Hearthworks provides</h2>
          <p>
            Hearthworks helps with bakery recipes, production planning, purchases, costs, results, and
            selected public catalogue presentation. It does not inspect ingredients, perform inspections, or
            replace legal, food-safety, tax, or accounting advice.
          </p>
        </section>

        <section>
          <h2>3) Your responsibilities</h2>
          <ul>
            <li>You are responsible for every food, label, safety, staffing, supplier, and regulatory decision.</li>
            <li>Verify recipes, conversions, yields, allergen statements, and production assumptions before baking.</li>
            <li>Verify taxes, permits, records, and financial reporting before filing or charging customers.</li>
            <li>Keep your workspace access limited to people authorized to act for your bakery.</li>
          </ul>
        </section>

        <section>
          <h2>4) Food safety and allergen disclosure</h2>
          <p>
            Outputs in Hearthworks are planning-oriented, not clinical or regulatory determinations. Changes in
            suppliers, substitutions, sanitation, and cross-contact risk are not automatically reflected.
          </p>
          <p>
            You must confirm supplier labels and handling controls before making any allergen or safety claim to
            customers or regulators.
          </p>
        </section>

        <section>
          <h2>5) User content and workspace content</h2>
          <p>
            You keep ownership of User Content. You give Hearthworks a limited license to host and process it to run
            the Service and satisfy legal/security obligations. This license is not a transfer of your business IP.
          </p>
          <p>
            Do not upload material you do not own, license, or have authority to use.
          </p>
        </section>

        <section>
          <h2>6) Third-party services</h2>
          <p>
            The Service may use providers for authentication, hosting, storage, analytics, or optional Drive integration.
            Use of these services is also governed by their terms and privacy policies.
          </p>
        </section>

        <section>
          <h2>7) Fees, changes, and roadmap</h2>
          <p>
            Current features are the deployed planner, exports, and planning workflows. Features marked roadmap or
            beta are subject to separate availability and can be changed, paused, or withdrawn.
          </p>
          <p>We do not charge for current planning features by default. New paid modules require new billing notices and consent.</p>
        </section>

        <section>
          <h2>8) Disclaimers and liability cap</h2>
          <p>
            To the fullest extent permitted by law, the Service is provided “as is,” with no implied promises of
            error-free operation or fitness for critical business law or safety outcomes.
          </p>
          <ul>
            <li>
              Indirect damages, consequential losses, and most business-income losses are excluded where law
              permits.
            </li>
            <li>
              To the extent enforceable, total aggregate liability is capped at the greater of (a) fees paid in the
              prior 12 months or (b) US $100.
            </li>
            <li>Some legal rights cannot be waived in many jurisdictions.</li>
          </ul>
        </section>

        <section>
          <h2>9) Indemnity and enforcement</h2>
          <p>
            You agree to defend and hold Hearthworks harmless from claims caused by your content, misuse,
            unlawful activity, food/sales claims, or unlawful distribution from your workspace.
          </p>
        </section>

        <section>
          <h2>10) Governing law and updates</h2>
          <p>
            This draft is prepared with an Oregon law and venue orientation. We will update this section alongside
            counsel review when the final operator details are finalized.
          </p>
        </section>

        <div className="legal-page__cta">
          <Link href="/">Return to Hearthworks</Link>
        </div>
      </div>
    </main>
  );
}

