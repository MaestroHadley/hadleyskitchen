# HK Microbakery App Theme System

This file is the persistent visual and implementation brief for future design and coding work on the HK microbakery operating system. New screens should follow this contract unless a later product decision explicitly replaces it.

## Product and brand direction

The app serves independent microbakery owners. The likely primary audience is women ages 24–45, but the interface must remain inclusive and avoid stereotypically feminine styling.

The intended balance is:

- Warm, personable, and lightly whimsical
- Trustworthy enough for payments, costs, production, and reporting
- Clear for first-time business owners
- Efficient for experienced bakers working under time pressure
- Neutral enough that each bakery feels like its own business

Do not make every subscriber feel as though they are operating inside Hadley’s Kitchen. The active bakery/workspace identity should be more prominent than the software maker identity.

Use one of these brand structures:

1. **Bakehouse OS** — `by Hadley’s Kitchen`
2. **Proofline** — `Crafted by Hadley’s Kitchen`
3. **Batchwell** — `From the makers of Hadley’s Kitchen`

These are working names, not final trademark decisions. Until a final name is selected, code should not tightly couple routes, table names, or domain logic to any one working brand.

## Theme model

Themes are controlled brand kits. They may change:

- Color tokens
- Heading font
- Corner softness
- Illustration or pattern accents
- Logo treatment
- Surface warmth

Themes must not change:

- Navigation placement or names
- Information hierarchy
- Control placement
- Form behavior
- Validation behavior
- Content meaning
- Accessibility requirements
- Mobile interaction patterns

The same workflow must remain recognizable when a bakery changes themes.

Recommended initial themes:

### Studio

Neutral and business-forward, with restrained HK warmth.

- Warm white background
- Soft charcoal navigation
- Oat and taupe surfaces
- Muted copper or terracotta primary accent
- Editorial serif for major headings only
- Humanist sans-serif for all operational UI
- Minimal decoration

### Garden

Warm, organic, and calm without becoming rustic or overly decorative.

- Ivory background
- Ink text
- Sage primary color
- Wheat-gold accent
- Soft 12px corners
- Sparse botanical line illustrations in unused space
- Warm serif headings with sans-serif UI text

### Confetti

Friendly and lightly playful while preserving operational clarity.

- Warm cream background
- Ink text
- Dusty blue primary action color
- Clay and marigold secondary accents
- Soft 14px corners
- Sparse abstract dots or marks around empty space
- One optional hand-drawn bakery illustration per major empty or welcome state
- Never place decoration behind dense data or form controls

## Shared design principles

### Plain language

Prefer labels such as:

- `Home`
- `Recipes`
- `Bake plans`
- `Markets`
- `Orders`
- `Customers`
- `Reports`
- `Keep planning`
- `Open production board`
- `View production packet`
- `Finish the plan`

Avoid internal terminology when ordinary bakery language is available. Explain calculations near the value instead of relying on tooltips.

### Calm hierarchy

Every screen should provide:

1. One clear page title
2. One sentence explaining the current state
3. One primary action
4. No more than one or two supporting actions above the fold
5. The next useful decision or task

Do not turn every capability into a dashboard card. Prefer grouped lists, simple dividers, readable summaries, and generous whitespace.

### Whimsy with boundaries

Whimsy belongs in:

- Brand marks
- Empty states
- Onboarding
- Theme previews
- Small illustrations
- Success moments
- Gentle, reassuring microcopy

Whimsy does not belong in:

- Payment confirmation
- Error messages
- Allergen warnings
- Cost and profit totals
- Destructive confirmations
- Production quantities
- Legal or privacy settings

### Bakery ownership

The bakery identity should be visible in the workspace selector or top bar, for example `Juniper Bread Co.`. The product brand and HK endorsement should be visually secondary.

## Core screen pattern

A production-focused home screen should generally contain:

```text
Product brand                 Bakery workspace         Account
Navigation

Page title                    Primary action
Event or plan context         Secondary action
Reassuring current-state sentence

Compact production summary

Up next / Today's bake flow
Needs attention or capacity note
```

Example content:

- Title: `Your Thursday bake plan`
- Context: `Saturday Market · Aug 8`
- State: `You’re in good shape. Three tasks need your attention.`
- Primary action: `Keep planning`
- Supporting action: `View production packet`
- Summary: `164 items · 38 batches · 50.6 kg flour · 10.3 kg starter · 12.9 oven hours`

## Markup conventions

Use semantic HTML before adding ARIA.

```tsx
<div className="app-shell" data-theme={theme}>
  <header className="product-bar">
    <a className="product-brand" href="/dashboard" aria-label="Product home">
      <span className="product-name">Batchwell</span>
      <span className="maker-mark">From the makers of Hadley’s Kitchen</span>
    </a>

    <button className="workspace-switcher" type="button">
      <span className="workspace-name">Juniper Bread Co.</span>
      <span aria-hidden="true">⌄</span>
    </button>

    <button className="account-menu" type="button" aria-label="Open account menu">
      <span aria-hidden="true">JS</span>
    </button>
  </header>

  <aside className="app-navigation">
    <nav aria-label="Primary navigation">
      {/* Use real icons from the project icon library. */}
    </nav>
  </aside>

  <main id="main-content" className="workspace-content">
    <header className="page-heading">
      <div>
        <p className="eyebrow">Saturday Market · Aug 8</p>
        <h1>Your Thursday bake plan</h1>
        <p>You’re in good shape. Three tasks need your attention.</p>
      </div>

      <div className="page-actions">
        <a className="button button-primary" href="/events/example/plan">
          Keep planning
        </a>
        <a className="button button-secondary" href="/events/example/report">
          View production packet
        </a>
      </div>
    </header>

    <section aria-labelledby="production-summary-title">
      <h2 id="production-summary-title" className="sr-only">Production summary</h2>
      <dl className="production-summary">
        <div><dt>Items</dt><dd>164</dd></div>
        <div><dt>Batches</dt><dd>38</dd></div>
        <div><dt>Flour</dt><dd>50.6 kg</dd></div>
        <div><dt>Starter</dt><dd>10.3 kg</dd></div>
        <div><dt>Oven time</dt><dd>12.9 hr</dd></div>
      </dl>
    </section>

    <section aria-labelledby="up-next-title">
      <h2 id="up-next-title">Up next</h2>
      <ol className="task-list">
        <li>{/* Full-row link or button with a visible text label. */}</li>
      </ol>
    </section>
  </main>
</div>
```

Do not use text glyphs, emoji, or handcrafted SVG markup as production icons. Use the project’s established icon library and keep icon meaning consistent.

## Theme token contract

Store theme differences in CSS custom properties. Components should consume semantic tokens rather than theme-specific color names.

```css
:root,
[data-theme="studio"] {
  --color-canvas: #f7f3eb;
  --color-surface: #fffdf9;
  --color-surface-subtle: #eee7dc;
  --color-text: #26231f;
  --color-text-muted: #6e675f;
  --color-border: #d8d0c4;
  --color-primary: #a85432;
  --color-primary-hover: #8e4429;
  --color-primary-text: #ffffff;
  --color-success: #557052;
  --color-warning: #9a671f;
  --color-danger: #a13f3f;
  --radius-control: 10px;
  --radius-surface: 12px;
  --font-heading: var(--font-editorial-serif);
  --font-body: var(--font-humanist-sans);
}

[data-theme="garden"] {
  --color-canvas: #faf8f1;
  --color-surface: #fffefb;
  --color-surface-subtle: #eef0e5;
  --color-text: #25261f;
  --color-text-muted: #66685d;
  --color-border: #d8dacb;
  --color-primary: #657b4c;
  --color-primary-hover: #53663e;
  --color-primary-text: #ffffff;
  --color-success: #557052;
  --color-warning: #9a6b20;
  --color-danger: #9f4545;
  --radius-control: 10px;
  --radius-surface: 12px;
  --font-heading: var(--font-warm-serif);
  --font-body: var(--font-humanist-sans);
}

[data-theme="confetti"] {
  --color-canvas: #fbf8f1;
  --color-surface: #fffdf8;
  --color-surface-subtle: #edf3f7;
  --color-text: #24272b;
  --color-text-muted: #626a72;
  --color-border: #d8dde1;
  --color-primary: #356fa5;
  --color-primary-hover: #2c5e8c;
  --color-primary-text: #ffffff;
  --color-success: #4f7350;
  --color-warning: #a46d18;
  --color-danger: #a34040;
  --radius-control: 12px;
  --radius-surface: 14px;
  --font-heading: var(--font-warm-serif);
  --font-body: var(--font-humanist-sans);
}
```

The exact color values may be tuned after contrast testing. Do not reference raw palette values directly inside components.

## Suggested TypeScript model

```ts
export const THEME_IDS = ["studio", "garden", "confetti"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export type BakeryTheme = {
  id: ThemeId;
  name: string;
  description: string;
  decorativeAccents: "none" | "botanical" | "confetti";
};

export const bakeryThemes: Record<ThemeId, BakeryTheme> = {
  studio: {
    id: "studio",
    name: "Studio",
    description: "Warm, focused, and business-forward.",
    decorativeAccents: "none",
  },
  garden: {
    id: "garden",
    name: "Garden",
    description: "Organic, calm, and softly expressive.",
    decorativeAccents: "botanical",
  },
  confetti: {
    id: "confetti",
    name: "Confetti",
    description: "Bright, friendly, and lightly playful.",
    decorativeAccents: "confetti",
  },
};
```

Persist the selected theme on the bakery/workspace, not only on the individual user. A bakery owner should see the same branded workspace on every device. If personal accessibility preferences are added later, store those separately and allow them to override motion or contrast without changing the bakery’s public brand.

Apply the theme near the application root:

```tsx
<html lang="en" data-theme={bakery.themeId ?? "studio"}>
```

If server rendering makes that unavailable at the root, apply it to the authenticated application shell. Avoid a client-only theme flash.

## Component rules

- Use semantic theme tokens in all components.
- Keep body text generally at 15–16px.
- Use a minimum 44 by 44px interactive target on touch layouts.
- Pair icons with visible text for primary navigation and important actions.
- Use one primary button per decision area.
- Use full-row links or buttons for task lists.
- Use badges only for meaningful state, not decoration.
- Use tables for genuinely comparative data; provide responsive row alternatives when a table cannot fit mobile.
- Avoid cards inside cards.
- Prefer spacing and dividers before adding borders or shadows.
- Decorative assets must use `aria-hidden="true"` and must never carry required meaning.
- Theme previews should show the same miniature sample content so users compare appearance rather than layout.

## Responsive behavior

Desktop and mobile must use the same content hierarchy.

At smaller widths:

- Convert the side navigation to a compact bottom navigation or accessible menu using the existing app pattern.
- Stack page actions beneath the title and make the primary action full width.
- Wrap the production summary into two columns or a readable vertical definition list.
- Stack timeline and attention/capacity sections vertically.
- Keep task rows readable without horizontal scrolling.
- Remove nonessential decorative accents before reducing text or target sizes.
- Never require hover to reveal labels or actions.

Test at minimum:

- 390 by 844 mobile
- 768px tablet width
- 1440 by 1024 desktop
- 200% browser zoom

## Accessibility and usability requirements

- Meet WCAG AA contrast for text and interactive states.
- Do not use color alone to communicate status.
- Provide visible keyboard focus states using semantic theme tokens.
- Respect `prefers-reduced-motion`.
- Preserve readable content when text size increases.
- Use real labels for all form fields.
- Explain validation errors next to the affected field and summarize them when a long form fails.
- Keep destructive actions visually and spatially distinct from routine actions.
- Use direct, calm error language; do not use whimsical copy for failures involving money, allergens, customer information, receipts, or production totals.
- Run usability checks with both novice cottage bakers and experienced production bakers.

## Theme settings UX

Theme selection belongs in bakery/workspace settings under a section such as `Appearance`.

The picker should include:

- Theme name
- One-sentence description
- Consistent miniature preview
- Selected state with text and icon, not color alone
- `Preview` before saving when practical
- `Save appearance` as the explicit action

Changing a theme must not modify data, reports, exports, product photos, public storefront settings, or customer communications unless a separate storefront-theme feature is intentionally added.

## Implementation sequence

1. Extract existing hard-coded colors, radii, shadows, and font assignments into semantic tokens.
2. Build the Studio theme first while keeping the existing functionality unchanged.
3. Confirm desktop, mobile, keyboard, and contrast behavior.
4. Add bakery-level theme persistence.
5. Add Garden and Confetti as token overrides.
6. Add optional decorative assets only after all core screens work without them.
7. Test recipes, bake plans, reports, account settings, checkout, and POS screens in every theme.

## Guardrails for future chats

When designing or implementing future screens:

- Read this file before making visual decisions.
- Preserve the neutral multi-bakery brand architecture.
- Keep HK visible as the maker or endorsement rather than the active bakery.
- Do not equate the target audience with stereotypical colors or decoration.
- Balance friendly personality with operational credibility.
- Reuse the established information architecture across every theme.
- Keep the manual, non-AI workflow fully usable.
- Treat mobile behavior and accessibility as acceptance criteria, not later polish.
