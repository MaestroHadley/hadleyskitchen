# Supabase Migration History

The timestamped migration filenames match the versions recorded by the production Supabase project as of August 7, 2026:

- `20260723174155_event_library_archive_delete.sql`
- `20260723185837_recipe_importer.sql`
- `20260723185959_harden_recipe_import_quota.sql`
- `20260723190034_recipe_import_usage_user_index.sql`
- `20260807161604_add_bakery_theme.sql`
- `20260807180701_add_google_connection_identity.sql`
- `20260807183729_add_recipe_category_defaults.sql`

The original `001`, `002`, and `003` files are retained as the reproducible baseline schema. Their tables, functions, and policies exist in production, but those early changes were applied before the current remote migration-history records were established.

`20260723174000_event_archive_receipts_user_index.sql` is an optional idempotent performance index that is present locally but is not recorded as applied in production. Do not renumber or assume it is live; apply it deliberately with the other advisor remediation work.

`20260812192651_recipe_drive_exports.sql` adds the owner-scoped managed Google Doc records and the per-account Hearthworks Recipes folder ID. It is present locally but is not recorded as applied in production; apply it before enabling recipe exports in the deployed application.
