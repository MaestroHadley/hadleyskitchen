export const siteContent = {
  site: {
    name: "Hadley's Kitchen",
    description:
      "A Eugene cottage bakery built around sourdough bread, generous bakes, food access, and community-rooted hospitality.",
    orderUrl: "https://app.simply-bread.co/hadleyskitchen/",
    email: "HadleysKitchen@protonmail.com",
  },
  navItems: [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/order", label: "Order and Schedule" },
    { href: "/contact", label: "Contact" },
  ],
  hero: {
    eyebrow: "Cottage Bakery",
    headline: "Warmth for the soul, and a home for the heart.",
    description:
      "Hadley's Kitchen is a welcoming cottage bakery rooted in sourdough, organic flour, generous portions, and the belief that good bread should feel nourishing, joyful, and within reach.",
    primaryCta: "Place an Order",
    secondaryCta: "Read Our Story",
    badge: "Freshly baked",
  },
  about: {
    lead: "A bakery story shaped by teaching, bread, and community care.",
    paragraphs: [
      "Hadley's Kitchen is led by Nicholas Hadley, with Tony Hadley as husband, professional taste-tester, and ideas man; Erza as Human Resources Officer; and Mira Jane as Compliance Officer. Together, they make the kitchen feel like a family project with a bigger purpose.",
      "The roots go back to 2016, when Hadley's Kitchen began as an Instagram account for family recipes, cooking techniques, and the meals Nicholas made for the people he loved. At the same time, he was teaching Spanish Immersion in a middle school classroom, so food became both a creative outlet and another way to care for a community.",
      "After a winding path through teaching, tech, the kitchen pull of Fave Chef 2020, and years of cooking for home, Nicholas found sourdough in 2025. What started as a way to bake healthier, more affordable food became something larger when a Free Little Pantry arrived in front of the house and began emptying every day.",
    ],
    storyNotes: [
      {
        title: "Born online in 2016",
        description:
          "Hadley's Kitchen started as a place to share family recipes and kitchen experiments before it became a cottage bakery.",
      },
      {
        title: "Built around access",
        description:
          "The Free Little Pantry remains part of the kitchen's heartbeat, with bread, weekly bakes, and perfectly good mis-bakes going back into the neighborhood.",
      },
      {
        title: "Generous on purpose",
        description:
          "Large loaves, organic flour, and approachable staples reflect a belief that bread belongs at the center of community life.",
      },
      {
        title: "Welcoming by design",
        description:
          "As a gay-owned cottage bakery, Hadley's Kitchen is built to be a place where people feel welcomed as they are.",
      },
    ],
    origin: {
      title: "How was Hadley's Kitchen born?",
      paragraphs: [
        "A sourdough starter from friend Ashlea Simons of Be.Loved.Bread helped Nicholas move from lifelong cook to baker. Soon after, a Free Little Pantry from Burrito Brigade turned that personal baking practice into daily neighborhood care.",
        "The first public sale happened in late November 2025 under a borrowed pop-up tent in pouring rain. Nicholas opened with sweets, sold out in two hours, and heard the question that changed the next chapter: where was the bread?",
        "Today, Hadley's Kitchen is built around abundance, access, and care. The plain rustic loaf sits at the center, while pastries, cookies, cinnamon rolls, scones, and loaded loaves help make the work sustainable.",
      ],
      linkText: "Read Nicholas's full Substack story.",
      linkUrl: "https://hadleyskitchen.substack.com/p/how-was-hadleys-kitchen-born",
    },
  },
  offerings: [
    {
      title: "Sourdough Bread",
      description:
        "Naturally leavened, organic-flour loaves made generously, with the plain rustic sourdough kept at the heart of the kitchen.",
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
