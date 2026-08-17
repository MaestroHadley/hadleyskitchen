import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ProductPreview } from "@/components/product-preview";

const workflow = [
  {
    number: "01",
    title: "Decide what to sell",
    copy: "Build a stand, pickup, market, or preorder menu from the recipes and products you already know.",
  },
  {
    number: "02",
    title: "Turn demand into a bake plan",
    copy: "Combine committed orders with walk-up targets, then calculate whole batches and realistic yields.",
  },
  {
    number: "03",
    title: "Know what to buy and when to bake",
    copy: "See ingredients, packaging, oven loads, and an editable production rhythm in one place.",
  },
  {
    number: "04",
    title: "Close the loop after selling",
    copy: "Record what sold, what remained, direct costs, and what to change on the next selling day.",
  },
];

const features = [
  {
    status: "Available now",
    title: "Recipes that speak in grams",
    copy: "Keep reusable formulas, observed yields, instructions, and production notes together—then scale without losing the original recipe.",
  },
  {
    status: "Available now",
    title: "A plan built around whole batches",
    copy: "Turn product targets into batch counts, flour and starter needs, packaging, oven rounds, and a schedule you can actually follow.",
  },
  {
    status: "Available now",
    title: "Useful exports, not another database",
    copy: "Create production packets and Google exports while Hearthworks remains the dependable source of truth for the bake.",
  },
  {
    status: "Building next",
    title: "Costs and selling-day results that connect",
    copy: "Bring ingredient prices, event expenses, sell-through, leftovers, and recorded profit into the same operational loop.",
  },
  {
    status: "On the roadmap",
    title: "Preorders that update production",
    copy: "Let each paid order become a committed quantity instead of a second list you have to reconcile by hand.",
  },
  {
    status: "On the roadmap",
    title: "Bakery-owned payments and POS",
    copy: "Sell from a stand, pickup, pop-up, or market while your connected processor, customer relationships, and payouts remain yours.",
  },
];

const bakerTypes = [
  "Porch & farm stands",
  "Farmers markets",
  "Weekly preorder releases",
  "Neighborhood pickup",
  "Pop-ups and events",
  "Limited local delivery",
  "Custom and manual orders",
];

export default function HomePage() {
  return (
    <div id="top" className="site-shell">
      <header className="site-header">
        <div className="container site-header__inner">
          <Logo />
          <nav className="site-nav" aria-label="Primary navigation">
            <a href="/#workflow">How it works</a>
            <a href="/#features">What it does</a>
            <a className="nav-quiet" href="/#for-bakers">
              For bakers
            </a>
            <Link className="button button--small button--dark" href="https://app.hadleyskitchen.com">
              Open the planner
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero__glow" aria-hidden="true" />
          <div className="container hero__layout">
            <div className="hero__copy">
              <p className="eyebrow"><span /> Built for independent bakeries</p>
              <h1>Run the bakery.<br /><em>Keep the craft.</em></h1>
              <p className="hero__lead">
                Hearthworks brings recipes, production, purchasing, and selling-day results into one calm workflow—so you can spend less time reconciling spreadsheets and more time making what sells.
              </p>
              <div className="hero__actions">
                <Link className="button button--primary" href="https://app.hadleyskitchen.com">
                  Explore the current planner <span aria-hidden="true">↗</span>
                </Link>
                <a className="button button--text" href="#workflow">
                  See the full vision <span aria-hidden="true">↓</span>
                </a>
              </div>
              <p className="hero__note">
                <span aria-hidden="true">●</span> The private planning foundation is live. The connected operating system is being built in deliberate phases.
              </p>
            </div>

            <div className="hero__visual">
              <ProductPreview />
              <div className="hero__mini-card hero__mini-card--cost">
                <span>Shopping total</span><strong>22.4 kg</strong><small>across 9 batches</small>
              </div>
            </div>
          </div>
        </section>

        <section className="trust-band" aria-label="Hearthworks product principles">
          <div className="container trust-band__inner">
            <p>Bakery work comes first.</p>
            <ul>
              <li>Baker-friendly conversions</li>
              <li>Whole-batch aware</li>
              <li>Mobile-first</li>
              <li>Manual path included</li>
            </ul>
          </div>
        </section>

        <section id="workflow" className="section workflow">
          <div className="container">
            <div className="section-heading section-heading--split">
              <div>
                <p className="eyebrow">One connected bakery day</p>
                <h2>One plan, from prep to results.</h2>
              </div>
              <p>
                Most tools stop at a storefront, a spreadsheet, or a recipe box. Hearthworks is designed around the full loop—because every order changes the bake, and every selling day teaches you what to do next.
              </p>
            </div>

            <div className="workflow__grid">
              {workflow.map((item) => (
                <article className="workflow-card" key={item.number}>
                  <span className="workflow-card__number">{item.number}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="manifesto">
          <div className="container manifesto__layout">
            <div className="manifesto__mark">
              <Image src="/hearthworks-logo.svg" width={94} height={94} alt="Hearthworks logo" />
            </div>
            <div>
              <p className="eyebrow eyebrow--light">The difference</p>
              <h2>Your bakery is not a generic small business.</h2>
              <p>
                Dough has a yield. Mixers and ovens have limits. A dozen rolls may need a full extra batch. Leftovers can still be useful—or become waste. Hearthworks respects the physical work behind the numbers instead of flattening it into rows and cells.
              </p>
            </div>
            <blockquote>
              <span>Know what to sell.</span>
              <span>Know what to bake.</span>
              <span>Know what to buy.</span>
              <strong>Know whether the market or stand was profitable.</strong>
            </blockquote>
          </div>
        </section>

        <section id="features" className="section features">
          <div className="container">
            <div className="section-heading">
              <p className="eyebrow">Useful now, growing carefully</p>
              <h2>A practical foundation—not a pile of disconnected features.</h2>
              <p>
                Hearthworks starts with dependable production planning and grows toward commerce only where the workflows can truly connect.
              </p>
            </div>

            <div className="feature-grid">
              {features.map((feature, index) => (
                <article className="feature-card" key={feature.title}>
                  <div className="feature-card__top">
                    <span className={`status-tag status-tag--${feature.status.toLowerCase().replaceAll(" ", "-")}`}>
                      {feature.status}
                    </span>
                    <span className="feature-card__index">0{index + 1}</span>
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="for-bakers" className="section baker-fit">
          <div className="container baker-fit__layout">
            <div>
              <p className="eyebrow">Built for the scale where craft still matters</p>
              <h2>For the baker wearing every hat.</h2>
              <p>
                Whether you bake from a home kitchen, a shared commissary, or a tiny production space, Hearthworks is designed for owner-operated bakeries and small teams—not restaurant chains or enterprise factories.
              </p>
              <ul className="baker-fit__list">
                {bakerTypes.map((type) => <li key={type}>{type}</li>)}
              </ul>
            </div>

            <aside className="principles-card">
              <p className="principles-card__kicker">Quietly opinionated</p>
              <h3>The baker stays in control.</h3>
              <ul>
                <li><span>01</span><div><strong>Your recipes stay yours.</strong><small>Private workflows do not depend on AI.</small></div></li>
                <li><span>02</span><div><strong>Your numbers stay dependable.</strong><small>Production and financial math is deterministic.</small></div></li>
                <li><span>03</span><div><strong>Your payments stay yours.</strong><small>Connected sellers remain the merchant and receive their own payouts.</small></div></li>
                <li><span>04</span><div><strong>Your tools remain optional.</strong><small>Manual entry and exports stay first-class.</small></div></li>
              </ul>
            </aside>
          </div>
        </section>

        <section className="closing-cta">
          <div className="container closing-cta__inner">
            <div className="closing-cta__copy">
              <p className="eyebrow eyebrow--light">A calmer way to grow</p>
              <h2>Build the bakery.<br />Not the spreadsheet.</h2>
              <p>
                See the current planning foundation and follow Hearthworks as the rest of the operating loop comes together.
              </p>
            </div>
            <div className="closing-cta__actions">
              <Link className="button button--cream" href="https://app.hadleyskitchen.com">
                Open Hearthworks <span aria-hidden="true">↗</span>
              </Link>
              <a href="#top">Back to top ↑</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container site-footer__inner">
          <Logo inverse />
          <div>
            <span>© {new Date().getFullYear()} Hearthworks</span>
            <Link href="https://app.hadleyskitchen.com">Current planner ↗</Link>
          </div>
          <div className="site-footer__legal">
            <strong>Legal documentation</strong>
            <div className="site-footer__legal-links">
              <Link href="/terms">Terms</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/acceptable-use">Acceptable Use</Link>
              <Link href="/cookies-and-analytics">Cookies</Link>
              <Link href="/accessibility">Accessibility</Link>
              <Link href="/service-providers">Service providers</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
