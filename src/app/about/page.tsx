import type { Metadata } from "next";
import Image from "next/image";
import { siteContent } from "@/content/site";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <div className="page">
      <section className="page-hero">
        <div className="container page-hero__layout">
          <div>
            <p className="eyebrow eyebrow--dark">About</p>
            <h1>{siteContent.about.lead}</h1>
          </div>

          <div className="page-hero__panel">
            <p>
              Hadley&apos;s Kitchen is a bakery story shaped by bread, family, and the belief
              that homemade food can still feel elegant, intentional, and deeply welcoming.
            </p>
          </div>
        </div>
      </section>

      <section className="page-section">
        <div className="container page-section__grid">
          <div className="page-section__panel">
            {siteContent.about.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="about-image-grid">
            <Image
              src="/images/nick-and-tony.jpg"
              alt="Nicholas and Tony Hadley at a Hadley's Kitchen event."
              width={2316}
              height={3088}
            />
            <Image
              src="/images/mira-and-erza.jpg"
              alt="Mira Jane and Erza, part of the Hadley's Kitchen family."
              width={3024}
              height={4032}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
