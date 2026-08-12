# Design QA

## Visual source of truth

- User-provided Browser annotation screenshots for the production dashboard and account pages in this task.
- Production recipe-library reference captured at 1440 px: `/private/tmp/hearthworks-recipes-production-reference.png`.
- Production account reference captured at 1440 px: `/private/tmp/hearthworks-account-production-reference.png`.

## Implementation captures

- Local recipe selection at 1440 px: `/private/tmp/hearthworks-recipes-selection-desktop.png`.
- Local account layout at 1440 px: `/private/tmp/hearthworks-account-local.png`.
- Responsive visual baselines:
  - `tests/responsive/planner-responsive.pw.ts-snapshots/recipe-library-views-390-chromium-darwin.png`
  - `tests/responsive/planner-responsive.pw.ts-snapshots/recipe-library-views-768-chromium-darwin.png`

## Comparison result

- Passed. The Hearthworks hierarchy, typography, borders, radii, and theme behavior remain consistent with the production source.
- Recipe visuals now use a centered, generic document glyph instead of a bread/book-specific symbol.
- Account and Google Drive icons are 48 px visual anchors. Connected Google account identity, email, mismatch copy, and actions use the full card width instead of the former narrow column.
- The bulk-selection bar reads as a contextual action layer without displacing the existing Active, Favorites, and Archived navigation.
- The refreshed transparent, dark, and light Hearthworks assets render from normalized public paths.
- The full sidebar account region is one account link and retains visible hover and keyboard-focus behavior.

## Interaction and responsive verification

- Select mode, individual selection, select-all across the filtered result set, session persistence, enabled export state, and connected-account identity were exercised in browser tests.
- 81 browser checks passed across 320, 390, 430, 768, 1024, and 1440 px, including the 390 × 844 target, breakpoint boundaries, WebKit containment, and all three themes.
- In-app browser inspection found no horizontal overflow at 1440 px and confirmed centered 40 px recipe-icon containers with 23 px glyphs and 48 px account feature icons.

## Remaining live-only verification

- `supabase/migrations/20260812204333_recipe_drive_exports.sql` is applied and its table, column, RLS policy, and grants are verified in the linked project.
- With explicit approval, export and re-export a real recipe to verify Google ownership, folder creation, Docs formatting, and update-in-place behavior. Local implementation deliberately did not create files in the user's Google Drive.

final result: passed

## August 12 shopping-unit and export-receipt iteration

### Source visual truth

- Shopping-list density and hierarchy: `/var/folders/1f/x79y6bsn00l62vjs2cjsk1w00000gn/T/codex-clipboard-8f739624-ac48-4247-8fd5-d5a3e18ec7d7.png` (757 × 473 px).
- Cramped Google export receipt: `/var/folders/1f/x79y6bsn00l62vjs2cjsk1w00000gn/T/codex-clipboard-de4b5961-edbb-4391-ac72-6d305928daf3.png` (390 × 121 px).

### Implementation evidence

- Pounds-and-ounces shopping list at the 390 × 844 CSS viewport: `/private/tmp/hearthworks-shopping-list-lb-oz-mobile.png` (390 × 844 px, device scale factor 1).
- Desktop shopping-list rows: `/private/tmp/hearthworks-shopping-list-lb-oz-desktop.png` (1440 × 900 px, device scale factor 1).
- State: `lb + oz` selected; exact and buffered amounts converted; package guidance retained only for configured non-flour ingredients.
- Interaction: both unit buttons switch state, expose `aria-pressed`, and measure 44 px high on mobile.
- Shopping checkboxes now expose Saved / Saving / Couldn’t save feedback and restore the event's saved ingredient names after reload.
- Browser console: no errors. Document width and scroll width were both 390 px at the mobile target.

### Full-view and focused comparison

- The report preserves the source panel's serif heading, uppercase eyebrow, checkbox rhythm, ingredient emphasis, muted exact amount, right-aligned shopping amount, borders, and warm paper surface.
- The new segmented unit control occupies the requested upper-right position on desktop and becomes a full-width 44 px control below the heading on mobile, avoiding collisions with the title.
- Pounds-and-ounces values remain scannable and right-aligned; flour rows omit store-specific package counts, while configured non-flour guidance can move to its own continuation line on mobile.
- The export receipt now uses separate grid rows for its icon, title/timestamp stack, and Drive link. The title and timestamp have explicit block layout, 4 px internal spacing, and 1.35 line height instead of touching.

### Required fidelity surfaces

- Fonts and typography: existing display and UI fonts, weights, line heights, and hierarchy are unchanged; imperial values use the same numeric emphasis as grams.
- Spacing and layout rhythm: source row density is preserved; the toggle adds a deliberate 12 px mobile gap and export receipt copy has distinct vertical spacing.
- Colors and tokens: existing paper, cream, ink, muted, copper, sage, and success tokens are reused.
- Image quality and assets: no new image assets were required; the existing supplied Hearthworks logo remains unchanged.
- Copy and content: unit labels are concise, exact and buffered meanings remain intact, and exports identify both gram and lb + oz values.

### Comparison history and findings

- Initial source finding (P1): the export receipt merged the creation label and timestamp into one unreadable line. Fixed with a two-column receipt grid and an explicit copy stack.
- Initial source finding (P1): shopping amounts were only practical in grams for US grocery purchasing. Fixed with the report toggle and dual-unit Doc/Sheet export columns.
- Post-fix evidence: in-app browser interaction confirmed the switch from `33 g` to `1.2 oz` and from `2,376 g` to `5 lb 3.8 oz`; the 390 px viewport has no horizontal overflow.
- Persistence follow-up: the focused browser check confirms a shopping item can be checked and returns to Saved; the production migration adds a non-null, bounded `shopping_checked_items` array to the existing owner-protected event row.
- No actionable P0, P1, or P2 visual differences remain. A real Google export success receipt and generated Doc/Sheet remain live-only verification because creating them changes the user's Drive.

final result: passed

## August 12 plan-control readability iteration

### Source visual truth

- User-provided mobile crop: `/var/folders/1f/x79y6bsn00l62vjs2cjsk1w00000gn/T/codex-clipboard-c409776f-830a-49aa-895d-ba104df97674.png` (401 × 442 px).

### Implementation evidence

- Browser-rendered plan flow: `/private/tmp/hearthworks-plan-controls-390x844.png` (390 × 844 px, CSS viewport 390 × 844, device scale factor 1).
- State: Step 2 Products, first selected recipe, whole-batch policy selected.
- Interaction: the batching select switched to Exact scaling and back to Batches; the final selected option read `Batches`.
- Browser console: no warnings or errors. Document overflow was 0 px.

### Full-view and focused comparison

- The full mobile capture preserves the existing Hearthworks card, step rail, recipe row, fixed action bar, and bottom navigation.
- The focused control region keeps the source two-column Target / Batching arrangement and rounded controls while increasing the uppercase labels from 11 px to 13 px and both control values to 16 px.
- `Whole batches` is shortened to `Batches`, removing unnecessary width and improving scanning without changing the stored whole-batch policy.

### Required fidelity surfaces

- Fonts and typography: the existing UI family and heavy optical weights are retained; labels are 13 px and values are 16 px.
- Spacing and layout rhythm: the label-to-control gap increases to 6 px; the two-column mobile grid remains contained at 390 px.
- Colors and tokens: existing ink, muted, line, paper, and focus tokens are unchanged.
- Image quality and assets: this control region contains no image assets; the supplied Hearthworks logo remains unchanged elsewhere in the capture.
- Copy and content: `Whole batches` becomes `Batches`; Target and Batching labels remain explicit.

### Comparison history and findings

- Initial source finding (P1): labels and selected values were too small for quick mobile planning. Fixed with explicit 13 px labels and 16 px input/select text.
- Initial source finding (P2): `Whole batches` was unnecessarily verbose. Fixed with `Batches` while preserving the `whole` value.
- Post-fix evidence: computed browser styles measured 13 px / 16 px / 16 px for label, input, and select, with no horizontal overflow and no console errors.
- No actionable P0, P1, or P2 visual differences remain.

final result: passed
