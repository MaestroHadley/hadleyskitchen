# Mobile Date Control and Recipe Views QA

## Visual truth and implementation captures

- Bake Day source: `/Users/nicholashadley/Downloads/Hearthworks.png` (1206 x 2622), supplied iPhone Safari/PWA capture.
- Bake Day implementation: `tests/responsive/planner-responsive.pw.ts-snapshots/event-details-390-chromium-darwin.png` (366 x 620), captured from the 390 x 844 regression viewport.
- Recipe views source: `/var/folders/1f/x79y6bsn00l62vjs2cjsk1w00000gn/T/codex-clipboard-0f564304-3b49-4235-b316-d2e7bd2aa291.png` (104 x 97), supplied mobile crop.
- Recipe views implementation: `tests/responsive/planner-responsive.pw.ts-snapshots/recipe-library-views-390-chromium-darwin.png` (366 x 67), captured from the 390 x 844 regression viewport.
- State: populated Bake Day Details form and Active recipe view.

## Side-by-side findings

The source Bake Day capture shows the native date-time control's bottom border disappearing while the surrounding inputs retain complete outlines. In the implementation capture, the wrapper draws a continuous one-pixel border on all four sides, the date text and calendar controls remain vertically centered, and the field ends at the same right edge as the other form controls. The iPhone WebKit regression also confirms the page cannot be dragged horizontally.

The source recipe crop visually merges `Active` and its count into `Active10`. In the implementation capture, tabs contain navigation labels only. The active result total is now a separate, subdued line (`9 active recipes` in the test state), while the Favorites and Archived icons have consistent spacing from their labels.

## Required fidelity surfaces

- Fonts and typography: existing type tokens and weights are preserved; the result count uses the existing muted small-text hierarchy.
- Spacing and layout rhythm: the date control aligns with adjacent fields; recipe icons and labels have a six-pixel gap; the mobile count sits seven pixels beneath the tab row.
- Colors and visual tokens: existing theme colors, paper, line, ink, muted, and focus tokens remain intact.
- Image and asset quality: the Hearthworks logo and Phosphor icons remain unchanged; no replacement assets were introduced.
- Copy and content: tab labels remain `Active`, `Favorites`, and `Archived`; the total gains semantic context through `active`, `favorite`, or `archived` recipe wording.

## Accessibility and responsive behavior

- Navigation labels are no longer polluted by a changing count.
- The result summary uses `aria-live="polite"` so filter/view changes can be announced without interrupting the user.
- Date focus remains visible on the stable wrapper outline.
- Responsive containment passes at 320, 390, 430, 768, 1024, and 1440 pixels, plus the 559/560/561 and 899/900/901 breakpoint boundaries.

## Comparison history

1. Before: iOS date input clipping hid the bottom border; the Active tab fused its label and result count.
2. First pass: moved the date border to the containing control and separated the recipe count from navigation.
3. Review pass: added spacing between the Favorites/Archived icons and their labels.
4. Final evidence: paired source/implementation comparisons show the reported defects removed; Chromium snapshots and iPhone WebKit behavior tests pass.

## Findings

No actionable P0, P1, P2, or P3 findings remain for these two reported mobile issues.

final result: passed
