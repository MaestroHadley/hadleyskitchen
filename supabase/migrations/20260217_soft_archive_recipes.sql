-- Phase 3: soft archive recipes for auditability.

begin;

alter table if exists public.recipes
  add column if not exists archived_at timestamptz;

create index if not exists recipes_owner_archived_idx
  on public.recipes (owner_id, archived_at);

commit;
