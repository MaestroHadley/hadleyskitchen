-- Phase 6: recipe versioning and restore workflow.

begin;

create table if not exists public.recipe_versions (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  version_number int not null,
  title text not null,
  category text not null,
  yield_qty numeric not null,
  yield_unit text not null,
  description text,
  instructions text,
  fermentation_minutes int,
  proof_minutes int,
  bake_temp_f int,
  bake_minutes int,
  allergen_tags text[] not null default '{}',
  dietary_tags text[] not null default '{}',
  ingredient_lines jsonb not null default '[]',
  note text,
  owner_id uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  unique (recipe_id, version_number)
);

create index if not exists recipe_versions_recipe_idx on public.recipe_versions (recipe_id);
create index if not exists recipe_versions_owner_idx on public.recipe_versions (owner_id);

alter table if exists public.recipes
  add column if not exists current_version_id uuid;

alter table if exists public.recipes
  drop constraint if exists recipes_current_version_fk;
alter table if exists public.recipes
  add constraint recipes_current_version_fk
  foreign key (current_version_id) references public.recipe_versions(id) on delete set null;

alter table public.recipe_versions enable row level security;

drop policy if exists "recipe_versions_owner_select" on public.recipe_versions;
drop policy if exists "recipe_versions_owner_insert" on public.recipe_versions;
drop policy if exists "recipe_versions_owner_update" on public.recipe_versions;
drop policy if exists "recipe_versions_owner_delete" on public.recipe_versions;

create policy "recipe_versions_owner_select"
  on public.recipe_versions for select
  using (owner_id = auth.uid());

create policy "recipe_versions_owner_insert"
  on public.recipe_versions for insert
  with check (owner_id = auth.uid());

create policy "recipe_versions_owner_update"
  on public.recipe_versions for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "recipe_versions_owner_delete"
  on public.recipe_versions for delete
  using (owner_id = auth.uid());

create or replace function public.create_recipe_version(
  p_recipe_id uuid,
  p_note text default null,
  p_owner_id uuid default auth.uid()
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_recipe public.recipes%rowtype;
  v_new_version int;
  v_lines jsonb;
  v_version_id uuid;
begin
  select *
  into v_recipe
  from public.recipes r
  where r.id = p_recipe_id
    and r.owner_id = p_owner_id;

  if v_recipe.id is null then
    raise exception 'Recipe not found or not owned by caller';
  end if;

  select coalesce(max(rv.version_number), 0) + 1
  into v_new_version
  from public.recipe_versions rv
  where rv.recipe_id = p_recipe_id
    and rv.owner_id = p_owner_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'recipe_line_id', rl.id,
        'ingredient_id', rl.ingredient_id,
        'ingredient_name', i.name,
        'qty', rl.qty,
        'unit', rl.unit,
        'canonical_unit', i.unit_type
      )
      order by rl.id
    ),
    '[]'::jsonb
  )
  into v_lines
  from public.recipe_lines rl
  join public.ingredients i on i.id = rl.ingredient_id
  where rl.recipe_id = p_recipe_id
    and rl.owner_id = p_owner_id;

  insert into public.recipe_versions (
    recipe_id,
    version_number,
    title,
    category,
    yield_qty,
    yield_unit,
    description,
    instructions,
    fermentation_minutes,
    proof_minutes,
    bake_temp_f,
    bake_minutes,
    allergen_tags,
    dietary_tags,
    ingredient_lines,
    note,
    owner_id
  )
  values (
    p_recipe_id,
    v_new_version,
    v_recipe.title,
    v_recipe.category,
    v_recipe.yield_qty,
    v_recipe.yield_unit,
    v_recipe.description,
    v_recipe.instructions,
    v_recipe.fermentation_minutes,
    v_recipe.proof_minutes,
    v_recipe.bake_temp_f,
    v_recipe.bake_minutes,
    coalesce(v_recipe.allergen_tags, '{}'),
    coalesce(v_recipe.dietary_tags, '{}'),
    coalesce(v_lines, '[]'::jsonb),
    p_note,
    p_owner_id
  )
  returning id into v_version_id;

  update public.recipes
  set current_version_id = v_version_id
  where id = p_recipe_id
    and owner_id = p_owner_id;

  return v_version_id;
end;
$$;

create or replace function public.restore_recipe_version(
  p_version_id uuid,
  p_owner_id uuid default auth.uid()
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_version public.recipe_versions%rowtype;
  v_recipe_id uuid;
begin
  select *
  into v_version
  from public.recipe_versions rv
  where rv.id = p_version_id
    and rv.owner_id = p_owner_id;

  if v_version.id is null then
    raise exception 'Version not found or not owned by caller';
  end if;

  v_recipe_id := v_version.recipe_id;

  update public.recipes
  set
    title = v_version.title,
    category = v_version.category,
    yield_qty = v_version.yield_qty,
    yield_unit = v_version.yield_unit,
    description = v_version.description,
    instructions = v_version.instructions,
    fermentation_minutes = v_version.fermentation_minutes,
    proof_minutes = v_version.proof_minutes,
    bake_temp_f = v_version.bake_temp_f,
    bake_minutes = v_version.bake_minutes,
    allergen_tags = coalesce(v_version.allergen_tags, '{}'),
    dietary_tags = coalesce(v_version.dietary_tags, '{}'),
    current_version_id = v_version.id
  where id = v_recipe_id
    and owner_id = p_owner_id;

  delete from public.recipe_lines
  where recipe_id = v_recipe_id
    and owner_id = p_owner_id;

  insert into public.recipe_lines (
    recipe_id,
    ingredient_id,
    qty,
    unit,
    owner_id
  )
  select
    v_recipe_id,
    (line->>'ingredient_id')::uuid,
    coalesce((line->>'qty')::numeric, 0),
    coalesce(nullif(line->>'unit', ''), 'g'),
    p_owner_id
  from jsonb_array_elements(coalesce(v_version.ingredient_lines, '[]'::jsonb)) line;

  return v_recipe_id;
end;
$$;

commit;
