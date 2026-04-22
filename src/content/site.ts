export const siteContent = {
  site: {
    name: "Hadley's Kitchen",
    description:
      "A cottage bakery centered on sourdough bread, baked goods, and community-rooted hospitality.",
    orderUrl: "https://app.simply-bread.co/hadleyskitchen/",
    email: "HadleysKitchen@protonmail.com",
  },
  navItems: [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/order", label: "Order" },
    { href: "/contact", label: "Contact" },
  ],
  hero: {
    eyebrow: "Cottage Bakery",
    headline: "Warmth for the soul, and a home for the heart.",
    description:
      "Hadley's Kitchen is a welcoming bakery focused on sourdough bread, baked goods, and the kind of food that brings people back to the table.",
    primaryCta: "Place an Order",
    secondaryCta: "Read Our Story",
    badge: "Freshly baked",
  },
  about: {
    lead: "What is Hadley's Kitchen?",
    paragraphs: [
      "Hadley's Kitchen is comprised of baker, Nicholas Hadley, husband and professional taste-tester/ideas man, Tony Hadley, Human Resources Officer (dog) Erza, and Compliance Officer (cat), Mira Jane. Together they bring Hadley's Kitchen to life.",
      "Nicholas has been in the kitchen since he was a young boy, and has always enjoyed cooking and pushing himself to new limits. Having taught and worked in Europe, he gained a keen sense on what food should be and how it should be available. One of the core tenants of Hadley's Kitchen is community. Food should be affordable, delicious, and sustainable. Here at Hadley's Kitchen that is what we strive for every day, in every loaf, and every baked good.",
    ],
  },
  offerings: [
    {
      title: "Sourdough Bread",
      description:
        "Naturally leavened loaves with a tender crumb, balanced tang, and crust built for the center of the table.",
    },
    {
      title: "Pastries",
      description:
        "Seasonal sweets and bakery staples made to feel comforting, shareable, and worth coming back for that contain the same sourdough starter.",
    },
    {
      title: "Premium Bagels",
      description:
        "Extra large and flavorful bagels that have become a community favorite.",
    },
  ],
  order: {
    intro:
      "Browse current availability and place your order directly below. For custom requests, larger quantities, or special questions, reach out by email and we can plan something together.",
  },
  contact: {
    intro:
      "For orders, availability, and general questions, reach out directly by email. Additional social links or pickup details can be added as they are finalized.",
    details: [
      { label: "Email", value: "HadleysKitchen@protonmail.com" },
      { label: "Primary path", value: "Order link or direct email inquiry" },
      { label: "Fulfillment", value: "Cottage bakery with local coordination" },
    ],
  },
  disclosure: {
    title: "Cottage Disclosure",
    body:
      "This product is homemade, it is not prepared in an inspected food establishment,",
    storage:
      "and must be stored and displayed separately if merchandised by a retailer.",
    pets: "Pets were present in the residential dwelling: Cat, Dog.",
  },
} as const;
