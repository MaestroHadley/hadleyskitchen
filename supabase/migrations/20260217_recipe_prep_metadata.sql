-- Phase 4: add operational prep metadata to recipes.

begin;

alter table if exists public.recipes
  add column if not exists fermentation_minutes int;

alter table if exists public.recipes
  add column if not exists proof_minutes int;

alter table if exists public.recipes
  add column if not exists bake_temp_f int;

alter table if exists public.recipes
  add column if not exists bake_minutes int;

alter table if exists public.recipes
  drop constraint if exists recipes_fermentation_minutes_check;
alter table if exists public.recipes
  add constraint recipes_fermentation_minutes_check check (fermentation_minutes is null or fermentation_minutes >= 0);

alter table if exists public.recipes
  drop constraint if exists recipes_proof_minutes_check;
alter table if exists public.recipes
  add constraint recipes_proof_minutes_check check (proof_minutes is null or proof_minutes >= 0);

alter table if exists public.recipes
  drop constraint if exists recipes_bake_temp_f_check;
alter table if exists public.recipes
  add constraint recipes_bake_temp_f_check check (bake_temp_f is null or bake_temp_f > 0);

alter table if exists public.recipes
  drop constraint if exists recipes_bake_minutes_check;
alter table if exists public.recipes
  add constraint recipes_bake_minutes_check check (bake_minutes is null or bake_minutes >= 0);

commit;
