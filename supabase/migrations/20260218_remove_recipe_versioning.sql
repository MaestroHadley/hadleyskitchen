-- Remove recipe versioning objects now that the UI uses direct save only.

begin;

-- Drop versioning RPC helpers first (safe if already removed).
drop function if exists public.restore_recipe_version(uuid, uuid);
drop function if exists public.create_recipe_version(uuid, text, uuid);

-- Remove recipes -> recipe_versions link.
alter table if exists public.recipes
  drop constraint if exists recipes_current_version_fk;
alter table if exists public.recipes
  drop column if exists current_version_id;

-- Drop historical versions table.
drop table if exists public.recipe_versions;

commit;
