import type { Metadata } from "next";
import { connection } from "next/server";
import Image from "next/image";
import Link from "next/link";
import { UpcomingEvents } from "@/components/upcoming-events";
import { siteContent } from "@/content/site";

export const metadata: Metadata = {
  title: "Home",
  description: "Naturally leavened sourdough, pastries, and generous bakes from Hadley's Kitchen, a community-minded cottage bakery in Eugene, Oregon.",
};

const bakes = [
  { title: "Sourdough Bread", image: "sourdough", alt: "A golden sourdough loaf on a wooden board outside Hadley's Kitchen.", caption: "Naturally leavened. Made generously.", width: 1600, height: 2133 },
  { title: "Pastries", image: "cinnamon-rolls", alt: "An iced cinnamon roll from Hadley's Kitchen, ready to share.", caption: "Sweet treats, made with care.", width: 1000, height: 1333 },
  { title: "Premium Bagels", image: "everything-bagels", alt: "A freshly baked batch of everything bagels topped with seeds.", caption: "Extra generous. Full of flavor.", width: 1000, height: 1778 },
];

export default async function HomePage() {
  await connection();
  // Share a request-time snapshot with the client for consistent event hydration.
  // eslint-disable-next-line react-hooks/purity
  const initialNow = Date.now();

  return (
    <div className="kitchen-home">
      <section className="kitchen-hero" aria-labelledby="home-heading">
        <div className="container kitchen-hero__layout">
          <div className="kitchen-hero__copy">
            <p className="kitchen-eyebrow">A cottage bakery in Eugene, Oregon</p>
            <h1 id="home-heading">From our kitchen,<br />with love.</h1>
            <p className="kitchen-hero__tagline">{siteContent.hero.headline}</p>
            <p className="kitchen-hero__intro">Naturally leavened sourdough.<br />Generous bakes. Always made with care.</p>
            <Link className="button button--primary" href="/order">Events &amp; Ordering</Link>
          </div>
          <div className="kitchen-hero__photos">
            <figure className="kitchen-photo kitchen-photo--bread">
              <Image src="/images/kitchen-table/sourdough.webp" alt="A fresh Hadley's Kitchen sourdough loaf, cooling on a wooden board." width={1600} height={2133} sizes="(max-width: 700px) 78vw, 46vw" loading="eager" fetchPriority="high" />
              <figcaption>Made to share.</figcaption>
            </figure>
            <figure className="kitchen-photo kitchen-photo--sweet">
              <Image src="/images/kitchen-table/cinnamon-rolls.webp" alt="A generously iced cinnamon roll from our kitchen." width={1000} height={1333} sizes="(max-width: 700px) 36vw, 21vw" />
            </figure>
          </div>
        </div>
      </section>

      <UpcomingEvents initialNow={initialNow} preview />

      <section className="kitchen-bakes container" id="our-bakes" aria-labelledby="bakes-heading">
        <div className="kitchen-section-heading">
          <h2 id="bakes-heading">Baked to be shared.</h2>
          <p className="kitchen-eyebrow">Small batches. A little extra love.</p>
        </div>
        <div className="kitchen-bakes__grid">
          {bakes.map((bake) => (
            <Link className="bake" href="/order#ordering" key={bake.image}>
              <div className="bake__image"><Image src={`/images/kitchen-table/${bake.image}.webp`} alt={bake.alt} width={bake.width} height={bake.height} sizes="(max-width: 600px) 92vw, 31vw" /></div>
              <h3>{bake.title}</h3>
              <p>{bake.caption}</p>
            </Link>
          ))}
        </div>
        <p className="kitchen-bakes__availability">Every bake has its day. <Link href="/order#ordering">See what&apos;s available to order.</Link></p>
      </section>

      <section className="kitchen-story" aria-labelledby="story-heading">
        <div className="container kitchen-story__layout">
          <div className="kitchen-story__copy">
            <p className="kitchen-eyebrow">The heart of Hadley&apos;s Kitchen</p>
            <h2 id="story-heading">A little kitchen.<br />A lot of heart.</h2>
            <p>Generous bakes and community care in Eugene, Oregon. From our sourdough starter to the Free Little Pantry, there&apos;s a story behind every loaf.</p>
            <Link className="kitchen-text-link" href="/about">Meet Nicholas</Link>
          </div>
          <div className="kitchen-story__photo">
            <Image src="/images/kitchen-table/nicholas.webp" alt="Nicholas Hadley at home in the kitchen." width={750} height={1626} sizes="(max-width: 700px) 90vw, 32vw" />
          </div>
        </div>
      </section>
    </div>
  );
}
