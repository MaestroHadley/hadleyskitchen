import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { siteContent } from "@/content/site";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Hadley's Kitchen is a Eugene cottage bakery offering sourdough bread, generous bakes, and community-rooted hospitality built around nourishment and access.",
};

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero__layout container">
          <div className="hero__imageWrap">
            <div className="hero__badge">{siteContent.hero.badge}</div>
            <Image
              className="hero__image"
              src="/images/nick-home-image.png"
              alt="Nicholas Hadley in the kitchen with fresh baked bread."
              width={1290}
              height={2796}
              priority
            />
          </div>

          <div className="hero__copy">
            <p className="eyebrow">{siteContent.hero.eyebrow}</p>
            <h1>{siteContent.hero.headline}</h1>
            <p className="hero__description">{siteContent.hero.description}</p>

            <div className="proof-strip" aria-label="Bakery highlights">
              <span>Organic flour</span>
              <span>Naturally leavened</span>
              <span>Eugene, OR</span>
            </div>

            <div className="button-row">
              <a className="button button--primary" href={siteContent.site.orderUrl}>
                {siteContent.hero.primaryCta}
              </a>
              <Link className="button button--ghost" href="/about">
                {siteContent.hero.secondaryCta}
              </Link>
            </div>

            <div className="hero__mark">
              <Image
                src="/images/hk-logo.png"
                alt="Hadley's Kitchen logo."
                width={1200}
                height={1200}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section section--cream">
        <div className="container split-section">
          <div>
            <p className="eyebrow eyebrow--dark">Why people come back</p>
            <h2 className="section-title section-title--dark">
              Small-batch baking with a generous, community-first spirit.
            </h2>
          </div>

          <p className="section-copy section-copy--dark">
            Hadley&apos;s Kitchen brings together sourdough,
            approachable hospitality, and a cottage bakery spirit that feels personal.
            The goal is simple: make food that feels generous, grounded, and worth sharing.
          </p>
        </div>
      </section>

      <section className="section section--dark">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Featured Offerings</p>
            <h2 className="section-title">A small-batch cottage bakery built to feed the community.</h2>
          </div>

          <div className="card-grid">
            {siteContent.offerings.map((offering) => (
              <article className="info-card" key={offering.title}>
                <h3>{offering.title}</h3>
                <p>{offering.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
