-- Phase 1: Recipe yield fields for deterministic scaling.

begin;

alter table if exists public.recipes
  add column if not exists yield_qty numeric;

alter table if exists public.recipes
  add column if not exists yield_unit text;

update public.recipes
set yield_qty = coalesce(yield_qty, 1)
where yield_qty is null;

update public.recipes
set yield_unit = coalesce(nullif(trim(yield_unit), ''), 'batch')
where yield_unit is null or trim(yield_unit) = '';

alter table if exists public.recipes
  alter column yield_qty set default 1;
alter table if exists public.recipes
  alter column yield_unit set default 'batch';

alter table if exists public.recipes
  alter column yield_qty set not null;
alter table if exists public.recipes
  alter column yield_unit set not null;

alter table if exists public.recipes
  drop constraint if exists recipes_yield_qty_positive_check;
alter table if exists public.recipes
  add constraint recipes_yield_qty_positive_check check (yield_qty > 0);

commit;
