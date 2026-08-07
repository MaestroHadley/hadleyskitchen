# Hearthworks Product and Implementation Plan

**Status:** Product and implementation plan
**Last refined:** August 7, 2026
**Current application:** `apps/bake-planner` at `app.hadleyskitchen.com`
**Product name:** Hearthworks
**Byline:** The operating system for independent bakers

## 1. Product vision

Grow the existing Hadley's Kitchen Bake Planner into Hearthworks, an all-in-one operating system for independent bakers.

> Know what to sell, what to bake, what to buy, and whether the market was profitable.

The product joins two workflows that are usually separated:

1. Customer-facing commerce: a branded bakery page, preorders, payments, pickup, and market POS.
2. Bakery operations: recipes, costing, batch calculations, shopping, production schedules, results, and next-market recommendations.

The central advantage is not merely having a storefront or POS. Every paid order and walk-up sale should immediately affect production quantities, remaining inventory, ingredient requirements, fulfillment, event results, and profitability.

## 2. Product principles

### Bakery work comes first

- Use gram-based recipes and observed yields.
- Respect whole-batch production, actual equipment, oven capacity, and real prep sequences.
- Keep the UI mobile-first, visual, and calm rather than spreadsheet-like.
- Make large events with 50 or more products searchable and manageable.

### Calculations remain dependable

- Production, costing, inventory, tax categories, sales, and profit use deterministic code.
- AI can propose, parse, match, summarize, or explain; it never becomes the source of truth for money or production quantities.
- Every AI-created draft is editable and reviewed before saving.

### The free/manual path remains real

- Recipe entry, recipe import, event planning, results, expense entry, and reporting must work without AI.
- AI features are optional, disclosed, consent-based, and disabled cleanly when free quotas or provider terms become unsuitable.
- Avoid infrastructure that requires a billing account until a paid feature has validated demand and can fund itself.

### Bakers own their businesses

- Each bakery owns its customer relationships, recipes, media, payment account, reader, and payouts.
- The bakery remains merchant of record for its sales.
- Hearthworks never stores raw card data and does not become a payment processor.
- Provider connections are removable and data exports remain available.

### Privacy is intentional

- R2 stores public product media only; it does not store receipts or private bookkeeping documents.
- Receipt images and reporting artifacts live in the bakery's own Google Drive.
- Proprietary recipes always have a private, non-AI workflow.
- Hearthworks stores only the Google file identifiers and metadata required to associate a receipt with an expense.
- Every tenant-owned table is protected by explicit authorization and row-level security.

## 3. Who the product is for

The initial customer is an owner-operated cottage or microbakery selling through some combination of:

- Farmers markets and pop-ups
- Weekly preorder releases or "Bakery Drops" (working name)
- Scheduled pickup windows
- Limited local delivery
- Custom or manual orders

The initial product is not intended for restaurants, multi-station cafes, national shipping, delivery-driver marketplaces, or enterprise bakery manufacturing.

## 4. Existing foundation to preserve

The current Bake Planner already provides the operational core:

- Supabase authentication and private user workspaces
- Reusable gram-based recipes and ingredients
- Recipe versions and event snapshots
- Guided manual recipe import
- Optional Gemini-assisted text, URL, image, and PDF import
- Whole-batch and exact scaling
- Event product selection and target quantities
- Flour, starter, shopping, package, and oven calculations
- Editable production schedules
- Event finalization, QA, reports, archives, CSV, Google Docs, and Google Sheets exports
- Searchable recipe and event libraries
- A mobile-first visual language and in-memory sample mode

This foundation should be extended incrementally. It should not be replaced by a new application or a second operational database.

## 5. Complete product loop

```text
Recipe and ingredient costs
          |
          v
Publish products for a market or preorder drop
          |
          v
Paid preorders + planned walk-up inventory
          |
          v
Batch plan, shopping list, and production schedule
          |
          v
Fulfillment + in-person POS sales
          |
          v
Actual sales, fees, expenses, leftovers, and waste
          |
          v
Profitability and next-market recommendations
```

## 6. Product areas and functionality

### 6.1 Recipes

- Reusable formulas in grams
- Instructions, production notes, categories, yields, oven capacity, and cycle time
- Version history and immutable event snapshots
- Manual, URL, text, image, and PDF import
- Ingredient matching against the bakery's ingredient catalog
- Cost per batch and cost per sellable unit
- Product photo association without embedding binary files in Postgres

### 6.2 Ingredients and purchasing

- Canonical ingredient catalog per bakery
- Supplier, package size, package price, and purchase date
- Price history rather than overwriting prior costs
- Optional density/conversion notes for imported recipes
- On-hand quantity as a later feature, not a requirement for initial costing
- Shopping lists based on event demand, existing stock when enabled, and configurable buffers

### 6.3 Markets and Bakery Drops

- Market/drop name, venue, date, ordering cutoff, pickup windows, and fulfillment instructions
- Product availability and hard quantity limits
- Separate preorder commitment and planned walk-up quantity
- Draft, published, ordering closed, production, completed, and archived states
- Event duplication for recurring markets
- Tags such as venue, weather, holiday, indoor/outdoor, and sales channel

The customer-facing name **Bakery Drop** is provisional. Before launch, choose and review an original product term for a published preorder period rather than copying Simply Bread's "Bake Day" wording.

### 6.4 Storefront and preorders

- Bakery-branded public page
- Current and upcoming Bakery Drops or markets
- Product title, image, description, base price, and remaining availability
- Reusable allergen labels maintained once per bakery and applied consistently to products
- Product variations such as count, size, flavor, package, or format
- Clear absolute variant prices: blank or `0` means use the base price; any positive value is the variant's final price
- No `+/-` price-modifier math in the baker interface
- Cart, checkout, confirmation, and pickup details
- Automatic closing at a product limit or ordering deadline
- Guest checkout first with customer email required and text number optional; optional customer accounts later
- Manual orders entered by the baker and included in the same production totals

Example: a three-count cookie product has a base price of `$5`. Its dozen variation is entered and displayed as `$18`, not `+$13`. Order items snapshot the chosen variation name and final price so later catalog changes do not rewrite sales history.

### 6.5 Equipment onboarding and capacity

- Guided onboarding asks what mixers and ovens the bakery actually uses
- A curated equipment-model catalog supplies known capacity profiles for common equipment
- Initial catalog candidates include Stella/Estella mixer sizes, home KitchenAid mixers, KitchenAid Professional models, a generic home oven, the Simply Bread Oven, and the Chandley Pico Plus bread oven
- Catalog values include their source, verification date, and aliases; uncertain manufacturer limits are not guessed
- Bakers can choose a known model, enter a custom model, or override any suggested capacity
- Mixer onboarding centers on usable dough-weight capacity rather than quarts alone
- Oven onboarding can simply ask how many loaves or trays fit in one load and how long one load takes
- Recipe-specific capacity overrides remain available because a loaf, cookie tray, and pan of rolls use equipment differently
- Capacity changes are versioned so past event plans retain the assumptions used at the time

An LLM may normalize free-text answers such as "the big KitchenAid Pro" into likely catalog matches and propose capacity fields with confidence and source notes. The baker must confirm those values. Deterministic scheduling logic uses only confirmed capacities, product/recipe overrides, and cycle times.

### 6.6 Production planning

- Paid preorders automatically become committed quantities
- Baker adds walk-up targets and safety stock
- Batch calculation uses the snapshotted recipe version
- Ingredient, flour, starter, shopping, and oven requirements update from the combined target
- Production schedule remains editable and grounded in real kitchen workflow
- Finalization produces a stable production packet while preserving traceability to orders

### 6.7 Hearthworks-native POS

- Market-specific product grid inside Hearthworks
- Fast cart, quantity changes, discounts, tips, tax, cash, and card tender
- User-owned smart terminal receives the payment request
- Provider returns verified status to Hearthworks
- Successful sales reduce event inventory and update fulfillment/results
- Declines, cancellations, timeouts, retries, refunds, and duplicate webhook delivery are handled safely
- Cash and manual payments work even when a card provider is not connected
- Offline card processing is deferred until supported safely by the chosen provider and client platform

### 6.8 Market results and profitability

- Quantity planned, committed, brought, sold, discounted, given away, left over, and wasted
- Gross sales, refunds, discounts, tips, tax collected, and payment fees
- Event fees and other direct expenses
- Ingredient cost based on the price history applicable to the event
- Net after all recorded costs, with excluded costs stated clearly
- Sell-through by product
- Profit per item, batch, event, and eventually oven/labor hour
- Comparison across venues and comparable past events

### 6.9 Expenses and reports

- Guided expense entry with vendor, date, amount, category, tax treatment label, event association, notes, and receipt photo
- Receipt upload is available only after the bakery connects Google Drive
- Receipt files are created directly in a Hearthworks-managed folder in the bakery's Google Drive; Hearthworks does not persist a copy in R2, Supabase, or another Hearthworks-owned object store
- Supabase stores the expense record plus the Google file ID, Drive URL, MIME type, upload status, and ownership metadata—not the receipt bytes
- Monthly and event reports generated from Supabase records
- Native Google Sheets exports for bookkeeping and analysis
- Google Drive exports for recipes, recipe collections, production packets, event reports, archives, and generated documents
- Exported files remain in the bakery's own Drive and can be organized into Hearthworks-created folders
- Google Sheets remain exports/reporting surfaces, not a second editable operational database
- Re-export creates a new snapshot or explicitly refreshes a Hearthworks-owned export; it does not silently import arbitrary spreadsheet edits

### 6.10 Customers and communications

- Preorders capture the customer's name and required email address
- A text-capable phone number is optional
- Transactional order confirmations, changes, and pickup reminders use the contact details required to fulfill that order
- Promotional email and SMS consent are recorded separately by channel
- Consent records include source, wording/version, timestamp, and revocation or unsubscribe status
- Bakers can announce a new Bakery Drop and send ordering-cutoff reminders to customers who opted into the relevant channel
- Messaging-provider selection is deferred; the product model must not depend on one email or SMS service
- Customer records and subscriber lists belong only to the bakery that collected them and remain exportable
- Deduplicate repeat customers carefully without merging unrelated people who share a phone number or email alias

### 6.11 Recommendations

Initial recommendations are deterministic and explainable:

- Weighted sell-through from comparable events
- Recent demand and preorder commitments
- Product margin
- Whole-batch constraints
- Oven and production capacity
- Venue and seasonal tags
- Conservative, balanced, or sell-out-aggressive planning preference

The baker sees the evidence, can override any recommendation, and owns the final quantity.

### 6.12 Optional AI assistance

- Gemini for photographs, PDFs, screenshots, handwriting, and harder multimodal recipe input
- Qwen through Cloudflare Workers AI for structured text parsing, ingredient normalization, matching, tagging, and summaries
- Deterministic Schema.org recipe extraction before consuming AI quota
- Optional explanation of forecasts without letting the model calculate financial truth
- Provider routing behind one internal interface so a provider can be disabled or replaced
- Per-user and global quotas, explicit disclosure, and manual fallback

## 7. Architecture

### 7.1 Application

- Continue with the Next.js App Router application in `apps/bake-planner`.
- Keep the public Hadley's Kitchen marketing site separate.
- Continue deploying the application through Vercel unless a later cost or runtime requirement justifies a deliberate move.
- Preserve demo/sample mode for onboarding and local development.

### 7.2 Supabase responsibilities

Supabase is the source of truth for structured operational data:

- Authentication and sessions
- Bakery workspaces and membership
- Recipes, ingredient catalog, costs, events, products, variants, equipment, and schedules
- Customers, orders, order lines, payments, refunds, and fulfillment
- Market results, expenses, exports, contact consent, and public product-media metadata
- Provider connection metadata and encrypted refresh credentials where required

All tables in an exposed schema require RLS. Public storefront reads should use a deliberately limited public view or server endpoint. Anonymous customers should not receive direct write access to internal tables. Payment webhooks and checkout creation should run server-side with idempotency and tenant checks.

The existing `user_id` ownership model is sufficient for the current private planner. Before staff accounts, storefronts, or payments, introduce stable bakery workspaces:

- `bakeries`
- `bakery_members`
- `bakery_id` on tenant-owned records
- roles such as owner and staff stored in trusted database records, not user-editable metadata

### 7.3 Cloudflare R2 responsibilities

R2 is the object store for public product and storefront media only. It must not contain expense receipts, private bookkeeping evidence, or report exports. Postgres stores each public object's key, ownership, MIME type, size, checksum, status, and relationship to the product.

Public product media uses:

- Product/storefront photos and generated thumbnails
- Stable production URLs through a Cloudflare custom domain
- Long-lived cache headers on versioned object keys
- Short-lived, operation-specific presigned upload URLs
- No production storefront traffic through the rate-limited `r2.dev` URL

Recommended object-key shape:

```text
public/{bakery_id}/products/{product_id}/{asset_id}-{variant}.{ext}
```

Implementation requirements:

- Generate object keys on the server; never accept a raw client path.
- Restrict upload MIME type and size and validate again after upload.
- Use random asset IDs and avoid customer names or other personal data in keys.
- Save media metadata only after upload confirmation.
- Delete or quarantine abandoned uploads.
- Use client-side compression and thumbnail creation initially to avoid unnecessary processing cost.
- Add asynchronous image processing only when usage justifies Workers/Queues or another service.

### 7.4 Google Drive, Docs, and Sheets

Google authentication for app login remains separate from permission to create exports. Request Drive/Docs/Sheets access only when the baker connects Google exports.

Use the narrow `drive.file` model so Hearthworks manages files it creates rather than requesting broad Drive access.

Google Drive is the user-owned destination for generated artifacts, including:

- Individual recipe documents and recipe-book exports
- Event production packets
- Monthly and event financial reports
- Native Google Sheets workbooks
- Google Docs reports
- CSV, PDF, or ZIP snapshots when those formats are requested
- Archive files created before permanent deletion

R2 and Drive have different responsibilities. R2 holds public product media. Drive holds every receipt plus user-requested exports and portable business records. Supabase stores receipt/export metadata, the originating record/date range, Google file ID, URL, format, version, and timestamp.

Hearthworks may create an optional folder structure such as:

```text
Hearthworks/
  Receipts/
    YYYY/
      MM/
  Recipes/
  Production Packets/
  Reports/
  Archives/
```

Hearthworks must only manage folders and files it created or that the user explicitly selected through Google. Disconnecting Drive stops future exports but does not delete the bakery's existing Drive files.

Proposed native workbook:

- **Summary:** gross sales, costs, fees, net, and key event/month metrics
- **Sales:** one row per order line or summarized product sale
- **Expenses:** date, vendor, category, amount, event, notes, and receipt link
- **Products:** planned, sold, leftover, sell-through, revenue, cost, and margin
- **Ingredients:** quantities used and historical cost basis
- **Event comparison:** optional rollup across exported events

Media behavior:

- Public product images may use stable R2 custom-domain URLs and can be linked or displayed in a sheet.
- Receipt links point to the bakery's Google Drive files and inherit Google ownership and sharing controls.
- Hearthworks does not proxy or retain receipt binaries after a successful Drive upload.
- If Drive is disconnected, existing files remain in the user's Drive; Hearthworks shows the stored link but cannot upload new receipts or refresh exports until reconnected.
- Bakers who use only planning features may authenticate with email/password and never connect Google. Connecting Google becomes required only when they choose receipt tracking or Google export/reporting features.

### 7.5 Payments and terminals

Keep the internal commerce model provider-neutral:

- `payment_provider`
- `provider_account_id`
- `provider_location_id`
- `provider_reader_id`
- `external_order_id`
- `external_payment_id`
- `external_refund_id`
- `payment_status`

The preferred product experience is a Hearthworks-native POS paired with a reader owned by the bakery:

```text
Hearthworks builds cart -> Hearthworks creates provider checkout -> smart terminal collects card
-> provider webhook verifies result -> Hearthworks completes order and reduces inventory
```

Provider decision gate:

- **Stripe Connect + Terminal:** strongest initial candidate for a unified branded preorder and POS flow. Each connected bakery remains the merchant and buys its own supported reader.
- **Square Terminal API:** viable alternative with accessible hardware and seller familiarity. It can receive checkout requests from the Hearthworks web app.
- **Small Bluetooth readers:** generally require a native iOS/Android client for direct embedded use. Defer until the web POS proves demand.

Do not build payment-provider code until a short integration spike confirms onboarding, direct payouts, refunds, reader ordering, web checkout, terminal checkout, webhook behavior, fee ownership, test-mode support, and account-country availability.

### 7.6 Reliability boundaries

- Webhooks are authoritative for asynchronous payment state.
- Every checkout, order import, refund, and webhook uses idempotency keys.
- Inventory reservations have expirations and are released after abandoned checkout.
- Never decrease stock twice for duplicate provider events.
- Preserve an append-only payment event trail for reconciliation.
- Separate order state, payment state, fulfillment state, and event production state.
- Reports derive from recorded facts rather than mutating source transactions.

## 8. Core data model additions

Exact SQL belongs in reviewed migrations. This is the conceptual model and implementation order.

### Tenant and access

- `bakeries`
- `bakery_members`
- `bakery_settings`

### Catalog and media

- `ingredients`
- `ingredient_price_history`
- `products`
- `product_variants`
- `allergen_labels`
- `product_allergens`
- `product_recipe_links`
- `media_assets`

Recipes are production formulas. Products are sellable presentations of recipes and have a title, description, image, base price, tax behavior, allergen labels, and quantity rules.

`product_variants` store a customer-facing label, optional production/yield multiplier, sort order, and an **absolute final price**, not a price delta. At the UI boundary, blank or `0` means inherit the product's base price; the database should normalize that to an explicit inheritance state such as `price_override_cents = null`. A positive override is the complete variant price. Each order item snapshots the resolved final price.

### Equipment and capability

- `equipment_catalog_models`
- `equipment_catalog_aliases`
- `equipment_capability_profiles`
- `bakery_equipment`
- `bakery_equipment_capabilities`

The global catalog is curated and read-only to ordinary bakery users. It records manufacturer/model, equipment type, nominal size, verified working restrictions, source URL, verified date, and version. `bakery_equipment` links a bakery to a catalog model or a custom entry and stores confirmed overrides. Capability rows express mixer dough mass, oven loaves/trays per load, and cycle timing without pretending one number applies to every recipe shape.

### Commerce

- `sales_channels`
- `customers`
- `customer_contacts`
- `communication_consents`
- `communication_suppressions`
- `orders`
- `order_items`
- `inventory_reservations`
- `payments`
- `payment_events`
- `refunds`
- `fulfillment_windows`

### Events and results

- Extend `events` with event type, publication state, ordering cutoff, venue, and channel metadata
- Extend `event_items` with preorder commitment, walk-up target, brought quantity, price snapshot, and product snapshot
- `event_expenses`
- `expense_receipts`
- `event_results` or derived result views
- `event_tags`

### Integrations and exports

- Extend provider connections beyond the existing Google connection
- `payment_connections`
- `payment_readers`
- `google_exports`
- `export_runs`

`google_exports` should support recipes, recipe collections, event production packets, financial reports, and archives in addition to the existing event Doc/Sheet records. Each export should retain its Google file ID and source snapshot/version so the app can open the Drive file and explain what data produced it.

Tokens and secrets must never be exposed to browser clients or written into archives, logs, Sheets, or R2 metadata.

Receipt files are not represented by `media_assets`. `expense_receipts` stores the bakery ID, expense ID, Google file ID, Drive URL, MIME type, upload state, and timestamps, but never the file bytes. Deleting an expense from Hearthworks must not automatically delete a user-owned Drive receipt without a separate, explicit confirmation.

## 9. Phased development plan

Each phase must deliver a complete, usable improvement. Later phases should not be required for earlier functionality to remain dependable.

### Phase 0 — Stabilize and document the current foundation

**Goal:** Establish a trustworthy baseline before expanding the schema.

Functionality:

- Preserve current recipes, importer, event planning, reports, archives, and Google exports
- Confirm the deployed Supabase callback creates a durable authenticated session
- Confirm migrations, RLS, and production configuration match the repository
- Document current data ownership and remove obsolete schema concepts from future designs
- Protect the existing uncommitted recipe-import work while planning proceeds
*We also need to determine/verify if Google Connectors are working - my note 8/6/26)*
Implementation:

- Run tests, lint, build, and typecheck from `apps/bake-planner`
- Verify Google login separately from Drive authorization
- Inventory current tables, RPCs, environment variables, and deployment settings
- Establish a migration and rollback checklist

Exit criteria:

- Login reaches an authenticated dashboard in production
- Existing planner workflows pass mobile and desktop smoke tests
- Current work is committed on an intentional branch before schema expansion

#### Phase 0 closeout status — August 6, 2026

Completed locally:

- Confirmed the authenticated production dashboard, recipe library, completed-event report, and connected Google Drive state
- Confirmed the manual recipe-import route and review flow locally at desktop and 390 × 844 mobile widths
- Fixed long editable recipe names so they wrap and auto-grow instead of being visually clipped
- Made hydrated recipe and event dates deterministic in the Hadley's Kitchen bakery timezone to prevent server/browser text mismatches
- Confirmed the three importer migrations are present in production and that importer tables/functions use enabled RLS, owner checks, and the intended invoker/definer boundaries
- Passed unit tests, lint, typecheck, production build, and local browser console checks

Completed on August 7, 2026:

- Adopted the Hearthworks product name, the byline “The operating system for independent bakers,” the supplied logo assets, and the plum, sage, and porcelain brand palette
- Rebuilt Studio around the Hearthworks palette while preserving Garden and Confetti as selectable experiences with theme-specific product bars
- Added automated WCAG AA contrast coverage for critical text, control, feature, status, and danger color pairs across all three themes
- Added and verified the production `profiles.theme_id` column, allowed values, default, and owner-scoped access so saved appearance choices persist
- Hardened the appearance save action so it reports success only after Supabase returns the selected saved theme
- Updated product-facing metadata, navigation branding, legal-page links, archive and Google export display copy, and importer identification while retaining the existing archive schema identifier for backward compatibility
- Replaced ambiguous repeated recipe-row marks with accessible bread icons and confirmed the rebrand at 1440 × 900 and 390 × 844 with no horizontal overflow
- Kept this work inside Phase 0: it stabilizes the current application and brand baseline and does not begin the Phase 1 ownership, equipment, costing, or results schema expansion

Still required before Phase 1 begins:

- Merge and deploy the Hearthworks follow-up from the intentional Phase 0 branch, then smoke-test saved appearance across Studio, Garden, and Confetti in production
- Complete the repository reorganization using `docs/platform/repository-migration.md`, including independent preview and production verification for both Vercel projects
- Reconcile the local migration filenames/history, including the production appearance migration version, before adding another migration
- Deploy the importer and verify `/recipes/import` in the authenticated production workspace
- Run one deliberate Google Sheet export and verify file ownership, tabs, update behavior, and Drive links
- Compare production migrations, RLS policies, and required Vercel environment variables with the repository

### Phase 1 — Bakery workspaces, equipment, ingredients, costing, and market results

**Goal:** Close the operational loop without payments.

Functionality:

- Bakery workspace and owner membership
- Equipment onboarding with known-model lookup and custom capacity entry
- Curated, source-backed mixer and oven capability catalog
- Canonical ingredient catalog
- Package prices and price history
- Recipe cost per batch and sellable unit
- Product selling prices
- Manual market results and event expenses
- Gross sales, recorded costs, fees, net, margin, waste, and sell-through

Implementation:

- Introduce `bakery_id` ownership before adding public or staff-facing data
- Migrate existing user records into one bakery per owner
- Seed equipment-model records only from verified manufacturer documentation or clearly labeled user-entered defaults
- Let an LLM suggest catalog matches, but require user confirmation before calculations use a capacity
- Preserve recipe-level equipment overrides and snapshot planning assumptions on finalized events
- Add ingredient matching and confirmed catalog links without destroying original recipe text
- Snapshot relevant costs and prices for completed events
- Add deterministic profitability calculations and tests

Exit criteria:

- A baker can answer whether a completed market was profitable using all recorded costs
- A baker can select known equipment or describe custom capacity in plain language and receive a reviewable bake-time estimate
- Changing current equipment settings does not rewrite a historical event's timing assumptions
- Historical event results do not change when a current ingredient price changes
- Existing recipes and event plans remain intact

### Phase 2 — R2 product media, Drive receipts, and native reporting

**Goal:** Add durable product photos, user-owned receipt evidence, and native Google reporting.

Functionality:

- Upload, crop/compress, replace, reorder, and delete product photos
- Connect Google when the baker first chooses receipt tracking or exports
- Upload receipt photos directly into the bakery's Google Drive
- Attach Drive receipt-file references to expenses without retaining Hearthworks-owned copies
- Show product photos in Hearthworks and the future storefront
- Export event and monthly reports to native Google Sheets
- Export recipes, production packets, reports, and archives into the bakery's Google Drive
- Include durable product-photo links and Google Drive receipt links

Implementation:

- Confirm the active R2 public-product bucket and connect a production custom domain
- Explicitly prohibit receipt and report objects in R2
- Add public-product `media_assets` metadata and ownership policies in Supabase
- Add signed direct-upload creation and upload-confirmation endpoints
- Add Drive receipt-folder creation, upload, retry, and orphan-cleanup behavior using `drive.file`
- Delete transient upload buffers immediately after Google confirms file creation
- Expand Google Sheet generation into stable tab schemas
- Generalize the existing Google export service across recipes, production packets, reports, and archives
- Create or reuse Hearthworks-owned Drive folders without requesting access to unrelated user files
- Store export version and source date range for reproducibility

Exit criteria:

- Public product images load from the R2 custom domain
- Receipt bytes exist only in the user's Google Drive after upload completes
- A user from another bakery cannot access an expense's Drive file reference through Hearthworks
- A generated Sheet contains correct formulas/totals and working media links
- Recipe and production-packet exports remain accessible in the bakery's Drive after Google is disconnected from Hearthworks
- Expired upload/download URLs do not break the durable report link

### Phase 3 — Product catalog, Bakery Drops, and reservation storefront

**Goal:** Validate the customer ordering experience before handling money.

Functionality:

- Sellable products linked to production recipes
- Product image, title, description, reusable allergen labels, and base price
- Variations with absolute final prices or explicit base-price inheritance
- Branded public bakery page
- Published Bakery Drops and market menus
- Product quantity limits and ordering cutoffs
- Cart and temporary inventory reservations
- Pickup windows and confirmation
- Manual/unpaid reservation mode for pilot testing

Implementation:

- Add a deliberately limited public catalog endpoint
- Resolve and snapshot the exact variant price on every order item; never store a `+/-` modifier as the customer-facing price model
- Implement reservation expiration and concurrency-safe stock allocation
- Convert confirmed reservations into committed production quantities
- Keep storefront branding configurable but constrained to a polished design system
- Include allergens, cottage-food disclosures, and bakery-specific pickup instructions

Exit criteria:

- Two customers cannot reserve the final item simultaneously
- A `$5` base product with an `$18` dozen variation displays and charges exactly those two understandable prices
- Closing or selling out removes availability without manual reconciliation
- Confirmed reservations appear automatically in the production plan

### Phase 4 — Online payments and paid preorders

**Goal:** Turn the reservation storefront into reliable paid ordering.

Functionality:

- Bakery-owned payment account onboarding
- Online checkout
- Paid, failed, expired, canceled, and refunded order states
- Customer receipts and baker order view
- Required customer email and optional text-capable phone number captured with the preorder
- Separate promotional email/SMS opt-in controls rather than bundled consent
- Payment and platform fees recorded separately
- Paid orders feed committed production quantities

Implementation:

- Complete the Stripe-versus-Square provider spike and record the decision
- Implement one provider adapter behind the internal payment interface
- Use connected seller accounts and direct bakery payouts
- Verify webhook signatures and persist provider events idempotently
- Reconcile abandoned reservations and payment failures
- Build refund behavior before public launch

Exit criteria:

- A real low-value transaction can complete from storefront to bakery payout
- Duplicate or delayed webhooks cannot duplicate orders or inventory changes
- Refunds update financial reports without erasing the original transaction

### Phase 5 — Hearthworks-native market POS with user-owned smart terminals

**Goal:** Keep the baker inside Hearthworks while selling in person.

Functionality:

- Market product grid and fast cart
- Tips, discounts, tax, cash, and card tender
- Pair/unpair a bakery-owned smart terminal
- Send checkout details from Hearthworks to the terminal
- Receive authoritative success/failure status
- Reduce walk-up inventory and unify sales with preorders
- Digital receipt and refund lookup

Implementation:

- Use the selected provider's web/server-driven Terminal API
- Add reader and location management per bakery
- Design resilient checkout recovery for disconnects and uncertain results
- Add an append-only register/reconciliation view
- Test duplicate taps, abandoned card prompts, timeouts, declines, partial refunds, and lost connectivity

Exit criteria:

- A baker completes consecutive market sales without leaving Hearthworks
- Preorders and walk-up sales share one inventory and fulfillment view
- Every provider payment reconciles to exactly one Hearthworks payment record

### Phase 6 — Customers, sale announcements, and repeat sales

**Goal:** Reduce customer administration and improve retention.

Functionality:

- Opt-in customer directory
- Required preorder email and optional text number
- Order confirmations and pickup reminders
- Bakery Drop announcements and ordering-cutoff reminders
- Customer preferences and order history
- Coupons, loyalty, reviews, and subscriptions only after core messaging works

Implementation:

- Start with email; add SMS only when pricing and consent requirements are sustainable
- Separate transactional contact use from promotional consent
- Store consent source, wording/version, timestamp, channel, and revocation
- Add unsubscribe and suppression handling before campaigns
- Choose a final original customer-facing name for Bakery Drops before public launch
- Keep customer data scoped to the bakery that collected it

Exit criteria:

- Transactional messages are reliable and auditable
- Customers without a phone number can complete every preorder and receive required communication by email
- Marketing messages are consented and easily stopped
- Communication cost cannot silently exceed an explicit budget

### Phase 7 — Recommendations and optional AI expansion

**Goal:** Turn accumulated history into better production decisions.

Functionality:

- Comparable-event quantity recommendations
- Forecast explanation and scenario comparison
- Event-note tagging
- Ingredient matching and recipe cleanup
- Receipt field extraction as a reviewed draft
- Semantic recipe and product search when useful

Implementation:

- Ship deterministic recommendations before generative explanations
- Establish bakery-specific evaluation fixtures using de-identified or synthetic data
- Compare Qwen/Workers AI and Gemini on accuracy, latency, privacy, and free allowance
- Route tasks by capability and fail safely to manual entry
- Never send payment credentials, private tokens, or unnecessary customer information to models

Exit criteria:

- Recommendations show their evidence and remain editable
- AI outages do not block core workflows
- Provider disclosures and consent match the actual deployed model and data path

### Phase 8 — Native mobile and inexpensive Bluetooth readers

**Goal:** Offer the lowest-cost reader experience after POS demand is proven.

Functionality:

- Native iOS/Android or carefully evaluated cross-platform Hearthworks client
- Direct support for compatible small Bluetooth readers or Tap to Pay
- Offline-capable cash workflow and provider-supported offline card behavior
- Camera-first receipt and recipe capture

Implementation:

- Treat this as a separate client over the same backend and domain model
- Send receipt captures directly to the connected Google Drive workflow; never fall back to R2
- Do not fork business calculations into mobile-only implementations
- Complete provider certification, signing, app-store, and device compatibility work

Exit criteria:

- Native transactions reconcile identically to web-terminal transactions
- The web application remains fully usable for bakers who do not install a native app

## 10. Cross-phase quality gates

Every phase must include:

- Unit tests for deterministic calculations and state transitions
- Integration tests for database ownership and RLS
- Idempotency tests for external events
- Mobile validation at 390 x 844 with no horizontal overflow
- Desktop keyboard and accessibility checks
- Clear loading, empty, error, retry, and offline/uncertain states
- Migration review, rollback notes, and production smoke tests
- No secrets, customer data, or proprietary recipe content in logs or fixtures
- Updated privacy/terms disclosures when data use changes
- A manual fallback for AI-assisted features

For the existing Bake Planner, verification continues from `apps/bake-planner`:

```sh
npm test
npm run lint
npm run build
npm run typecheck
```

## 11. Decisions made

- Continue from the existing Bake Planner rather than starting over.
- Build an integrated commerce-to-production loop.
- Store public product photos in the active Cloudflare R2 service.
- Never store receipt photos in R2 or another Hearthworks-owned object store.
- Require a connected Google account for receipt tracking and Google exports, while allowing email/password users to use non-Google planning features.
- Store receipt files only in the bakery's Google Drive and retain only the Drive reference and expense metadata in Hearthworks.
- Use native Google Sheets as the preferred expense and financial report export.
- Use Google Drive as the bakery-owned home for exported recipes, production packets, reports, Sheets, Docs, and archives.
- Keep Google exports one-way and reproducible rather than treating Sheets as the live database.
- Build a curated, source-backed equipment catalog with bakery-confirmed overrides and plain-language custom onboarding.
- Use LLMs only to normalize/propose equipment matches; use confirmed deterministic capacities for planning.
- Capture required preorder email and optional text number, with promotional consent recorded separately by channel.
- Use an original customer-facing name for preorder releases; `Bakery Drop` is the working term.
- Model product variants with clear absolute final prices, never confusing `+/-` price math.
- Build the Hearthworks POS interface; do not require bakers to use a separate provider POS app for the final experience.
- Let each bakery own its payment account, reader, and payouts.
- Start POS with user-owned smart terminals; defer direct small-reader support until a native client is justified.
- Keep the commerce schema provider-neutral while evaluating Stripe and Square.
- Keep calculations deterministic and AI optional.

## 12. Open decisions and validation spikes

These decisions should be resolved at their phase boundary rather than guessed now:

1. **R2 public-media layout:** confirm the active public product-media bucket and ensure receipts/reports cannot be uploaded there.
2. **Public media domain:** select the production hostname, such as `media.hadleyskitchen.com`, and define cache behavior.
3. **Payment provider:** compare Stripe Connect + Terminal and Square OAuth + Terminal API using the same onboarding, online checkout, refund, and in-person checkout script.
4. **Drive export ownership:** decide which exports create dated files and which refresh a known Hearthworks-created recipe, report, or workbook file.
5. **Receipt Drive workflow:** confirm the folder layout, direct-upload/retry behavior, and whether Sheets use a Drive hyperlink or user-chosen embedded image behavior.
6. **Equipment seed catalog:** verify manufacturer sources and safe working capacities for the initial Stella/Estella, KitchenAid, Simply Bread, Chandley, and generic-home profiles.
7. **Release naming:** validate an original alternative to Simply Bread's "Bake Day" before storefront work; `Bakery Drop` is provisional.
8. **Tax behavior:** define configurable tax categories and reports without presenting bookkeeping calculations as tax advice.
9. **Messaging:** validate email and SMS cost, deliverability, consent, and cottage-bakery demand before selecting a provider.
10. **Native client:** revisit only after smart-terminal POS usage demonstrates that cheaper readers materially affect adoption.

## 13. Immediate implementation backlog

The next working sequence is:

1. Protect and finish the current recipe-import branch/worktree changes.
2. Verify live authentication and current migrations.
3. Draft the bakery-workspace, equipment-catalog, and ingredient-costing schema for Phase 1.
4. Define the equipment-onboarding questions, confirmation states, and deterministic capacity contract.
5. Define the Market Results mobile flow and deterministic profitability contract.
6. Inventory the active R2 configuration without exposing credentials.
7. Define the public-product media upload contract and `media_assets` schema.
8. Specify the Google Drive receipt folder/upload lifecycle, export formats, Sheet tabs, formulas, and receipt-link behavior.
9. Specify customers, contacts, consent, reusable allergens, and absolute-price product variants.
10. Build Phase 1 before beginning storefront or payment work.

## 14. Reference documentation

- Cloudflare R2 public buckets and custom domains: <https://developers.cloudflare.com/r2/buckets/public-buckets/>
- Cloudflare R2 presigned URLs: <https://developers.cloudflare.com/r2/api/s3/presigned-urls/>
- Supabase row-level security: <https://supabase.com/docs/guides/database/postgres/row-level-security>
- Supabase changelog: <https://supabase.com/changelog>
- Google Sheets spreadsheet creation: <https://developers.google.com/workspace/sheets/api/guides/create>
- Google Drive `drive.file` authorization: <https://developers.google.com/workspace/drive/api/guides/api-specific-auth>
- Google Drive file uploads: <https://developers.google.com/workspace/drive/api/guides/manage-uploads>
- Stripe Connect SaaS platforms: <https://docs.stripe.com/connect/saas-platforms-and-marketplaces>
- Stripe Terminal: <https://docs.stripe.com/terminal/overview>
- Square Terminal API: <https://developer.squareup.com/docs/terminal-api/quickstart>
- Square Mobile Payments SDK: <https://developer.squareup.com/docs/mobile-payments-sdk>
