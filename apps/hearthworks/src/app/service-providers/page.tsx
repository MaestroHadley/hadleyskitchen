import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Service Providers",
  description:
    "Current vendors and infrastructure providers that process information to operate the Hearthworks service.",
};

const providers = [
  {
    name: "Supabase",
    purpose: "Authentication, sessions, database, and workspace access controls",
    info: "Account identifiers, workspace data, recipes, plans, expenses, media metadata, and security logs.",
    privacy: "https://supabase.com/privacy",
  },
  {
    name: "Vercel",
    purpose: "Application and marketing-site hosting; marketing analytics",
    info: "Request metadata, routes, diagnostics, and aggregate analytics.",
    privacy: "https://vercel.com/legal/privacy-notice",
  },
  {
    name: "Google",
    purpose: "Optional sign-in and optional Drive/Docs/Sheets features",
    info:
      "Basic Google identity details and connection scopes for selected export actions; user-owned files remain user-controlled.",
    privacy: "https://policies.google.com/privacy",
  },
  {
    name: "Cloudflare",
    purpose: "Public-ready product image delivery and object storage",
    info: "Public image keys, technical media metadata, request-level delivery data.",
    privacy: "https://www.cloudflare.com/privacypolicy/",
  },
];

export default function ServiceProvidersPage() {
  return (
    <main className="legal-page">
      <div className="container legal-page__inner">
        <p className="eyebrow">Hearthworks legal</p>
        <h1>Service Providers</h1>
        <p className="legal-page__meta">
          <small>Last verified: August 16, 2026</small>
        </p>
        <p className="legal-page__note">
          Review this list against production configuration and contracts before final publication.
        </p>

        <table>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Purpose</th>
              <th>Information in use</th>
              <th>Privacy reference</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider) => (
              <tr key={provider.name}>
                <td>{provider.name}</td>
                <td>{provider.purpose}</td>
                <td>{provider.info}</td>
                <td>
                  <a href={provider.privacy} target="_blank" rel="noreferrer">
                    View policy
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <section>
          <h2>Scope note</h2>
          <p>
            Current workflow excludes embedded payment, mass messaging, dedicated AI provider APIs, and separate CRM
            systems. If those features are activated, this list and the privacy notices will be expanded.
          </p>
        </section>

        <div className="legal-page__cta">
          <Link href="/privacy">View Privacy Policy</Link>
        </div>
      </div>
    </main>
  );
}

