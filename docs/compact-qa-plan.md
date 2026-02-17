# Hadley's Kitchen Compact QA Plan

## Scope
- App URL: `https://app.hadleyskitchen.com/` (redirects to `/app`)
- Local URL: `http://localhost:3000/` (redirects to `/app`)
- Goal: verify end-to-end baking workflow is functional after current migrations.

## Preconditions
1. All migrations in `supabase/migrations/` have been run.
2. At least one user account exists and can log in.
3. Optional: run `supabase/seeds/compact_qa_seed.sql` for deterministic test data.

## Smoke Checklist (10-15 minutes)
1. Auth and route protection
   - Log out and open `/app`.
   - Expect redirect to `/login`.
   - Log in, expect redirect to `/app`.
2. Ingredients
   - Open `/app/ingredients`.
   - Confirm Shared Defaults list is non-empty.
   - Add one custom ingredient and confirm it appears under Your Ingredients.
3. Recipes create/edit
   - Open `/app/recipes`.
   - Create a recipe with title, category, yield, instructions, prep metadata.
   - Add at least 2 ingredient lines with mixed units (for example `cup` and `g`).
4. Recipe tags
   - Apply allergen/dietary tags and save.
   - Confirm tags are visible on the selected recipe and filter chips work.
5. Recipe versioning
   - Save a manual snapshot with a note.
   - Add/remove an ingredient line.
   - Confirm additional versions appear.
   - Restore an older version and verify lines/metadata roll back.
6. Reports and conversions
   - Open `/app/reports`.
   - If a missing conversion appears, add mapping and confirm it disappears after refresh.
7. Weekly plan + totals
   - Open `/app/weekly-plan`.
   - Create a plan and add one or more recipes with qty.
   - Confirm aggregate ingredient totals render.
   - Confirm missing conversion counts appear when expected.
8. CSV export
   - From Weekly Plan totals, click Export CSV.
   - Open file and verify rows contain ingredient name, qty, canonical unit.
9. Soft archive behavior
   - Archive/restore one recipe.
   - Archive/restore one weekly plan.
   - Confirm archived items move out of active lists and can be restored.
10. RLS sanity (recommended with second account)
   - Sign in as user A and create records.
   - Sign in as user B.
   - Confirm user B cannot see user A private records.
   - Confirm shared default ingredients are visible to both.

## Expected Outcome
- All steps pass without SQL errors or UI crashes.
- Data is isolated per user except shared defaults/conversions intended to be global.

## Fast Failure Triage
- Missing columns/function errors: rerun latest migration and reload app.
- RLS errors: verify session is authenticated and owner policies are present.
- Empty totals with existing plan items: inspect recipe lines and conversion mappings.
