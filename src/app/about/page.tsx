import type { Metadata } from "next";
import Image from "next/image";
import { siteContent } from "@/content/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how Hadley's Kitchen grew from family recipes and teaching into a Eugene cottage bakery built around sourdough, food access, and community care.",
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
              From enthusiast to teacher, to tech, to baker: Hadley&apos;s Kitchen grew
              from family recipes into a cottage bakery centered on nourishment,
              access, and welcome.
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

      <section className="page-section">
        <div className="container story-note-grid">
          {siteContent.about.storyNotes.map((note) => (
            <article className="story-note" key={note.title}>
              <h2>{note.title}</h2>
              <p>{note.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-section page-section--tight">
        <div className="container">
          <div className="page-section__panel page-section__stack">
            <h2>{siteContent.about.origin.title}</h2>
            {siteContent.about.origin.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <div className="button-row">
              <a
                className="button button--primary"
                href={siteContent.about.origin.linkUrl}
                target="_blank"
                rel="noreferrer"
              >
                {siteContent.about.origin.linkText}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
