-- Add ownership columns and RLS policies for baking planner tables.
-- Run in Supabase SQL editor or as a migration.

-- 1) Add owner_id with auth.uid() default to all user-owned tables.
alter table if exists public.ingredients
  add column if not exists owner_id uuid;
alter table if exists public.ingredients
  alter column owner_id set default auth.uid();

alter table if exists public.recipes
  add column if not exists owner_id uuid;
alter table if exists public.recipes
  alter column owner_id set default auth.uid();

alter table if exists public.recipe_lines
  add column if not exists owner_id uuid;
alter table if exists public.recipe_lines
  alter column owner_id set default auth.uid();

alter table if exists public.weekly_plans
  add column if not exists owner_id uuid;
alter table if exists public.weekly_plans
  alter column owner_id set default auth.uid();

alter table if exists public.plan_items
  add column if not exists owner_id uuid;
alter table if exists public.plan_items
  alter column owner_id set default auth.uid();

-- 2) Backfill where possible (safe no-op when auth.uid() is null).
update public.ingredients set owner_id = auth.uid() where owner_id is null;
update public.recipes set owner_id = auth.uid() where owner_id is null;
update public.recipe_lines set owner_id = auth.uid() where owner_id is null;
update public.weekly_plans set owner_id = auth.uid() where owner_id is null;
update public.plan_items set owner_id = auth.uid() where owner_id is null;

-- 3) Enable RLS.
alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_lines enable row level security;
alter table public.weekly_plans enable row level security;
alter table public.plan_items enable row level security;

-- 4) Drop old policies if they exist (idempotent).
drop policy if exists "ingredients_owner_select" on public.ingredients;
drop policy if exists "ingredients_owner_insert" on public.ingredients;
drop policy if exists "ingredients_owner_update" on public.ingredients;
drop policy if exists "ingredients_owner_delete" on public.ingredients;

drop policy if exists "recipes_owner_select" on public.recipes;
drop policy if exists "recipes_owner_insert" on public.recipes;
drop policy if exists "recipes_owner_update" on public.recipes;
drop policy if exists "recipes_owner_delete" on public.recipes;

drop policy if exists "recipe_lines_owner_select" on public.recipe_lines;
drop policy if exists "recipe_lines_owner_insert" on public.recipe_lines;
drop policy if exists "recipe_lines_owner_update" on public.recipe_lines;
drop policy if exists "recipe_lines_owner_delete" on public.recipe_lines;

drop policy if exists "weekly_plans_owner_select" on public.weekly_plans;
drop policy if exists "weekly_plans_owner_insert" on public.weekly_plans;
drop policy if exists "weekly_plans_owner_update" on public.weekly_plans;
drop policy if exists "weekly_plans_owner_delete" on public.weekly_plans;

drop policy if exists "plan_items_owner_select" on public.plan_items;
drop policy if exists "plan_items_owner_insert" on public.plan_items;
drop policy if exists "plan_items_owner_update" on public.plan_items;
drop policy if exists "plan_items_owner_delete" on public.plan_items;

-- 5) Create owner-based CRUD policies.
create policy "ingredients_owner_select"
  on public.ingredients for select
  using (owner_id = auth.uid());
create policy "ingredients_owner_insert"
  on public.ingredients for insert
  with check (owner_id = auth.uid());
create policy "ingredients_owner_update"
  on public.ingredients for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
create policy "ingredients_owner_delete"
  on public.ingredients for delete
  using (owner_id = auth.uid());

create policy "recipes_owner_select"
  on public.recipes for select
  using (owner_id = auth.uid());
create policy "recipes_owner_insert"
  on public.recipes for insert
  with check (owner_id = auth.uid());
create policy "recipes_owner_update"
  on public.recipes for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
create policy "recipes_owner_delete"
  on public.recipes for delete
  using (owner_id = auth.uid());

create policy "recipe_lines_owner_select"
  on public.recipe_lines for select
  using (owner_id = auth.uid());
create policy "recipe_lines_owner_insert"
  on public.recipe_lines for insert
  with check (owner_id = auth.uid());
create policy "recipe_lines_owner_update"
  on public.recipe_lines for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
create policy "recipe_lines_owner_delete"
  on public.recipe_lines for delete
  using (owner_id = auth.uid());

create policy "weekly_plans_owner_select"
  on public.weekly_plans for select
  using (owner_id = auth.uid());
create policy "weekly_plans_owner_insert"
  on public.weekly_plans for insert
  with check (owner_id = auth.uid());
create policy "weekly_plans_owner_update"
  on public.weekly_plans for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
create policy "weekly_plans_owner_delete"
  on public.weekly_plans for delete
  using (owner_id = auth.uid());

create policy "plan_items_owner_select"
  on public.plan_items for select
  using (owner_id = auth.uid());
create policy "plan_items_owner_insert"
  on public.plan_items for insert
  with check (owner_id = auth.uid());
create policy "plan_items_owner_update"
  on public.plan_items for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
create policy "plan_items_owner_delete"
  on public.plan_items for delete
  using (owner_id = auth.uid());
