alter table public.recipes add column if not exists is_favorite boolean not null default false;

create table if not exists public.recipe_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  version integer not null check (version > 0),
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique(recipe_id, version)
);

alter table public.recipe_versions enable row level security;
drop policy if exists recipe_versions_owner on public.recipe_versions;
create policy recipe_versions_owner on public.recipe_versions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists recipes_user_updated_idx on public.recipes(user_id, updated_at desc);
create index if not exists recipes_user_category_idx on public.recipes(user_id, category);
create index if not exists recipes_user_active_idx on public.recipes(user_id, archived_at) where archived_at is null;
create index if not exists recipe_versions_recipe_idx on public.recipe_versions(recipe_id, version desc);

create or replace function public.save_recipe(
  p_recipe_id uuid,
  p_name text,
  p_category text,
  p_yield_per_batch numeric,
  p_yield_label text,
  p_oven_capacity numeric,
  p_cycle_minutes integer,
  p_notes text,
  p_ingredients jsonb
) returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  ingredient jsonb;
  next_version integer;
begin
  select version + 1 into next_version from public.recipes
    where id = p_recipe_id and user_id = auth.uid() for update;
  if not found then raise exception 'Recipe not found'; end if;

  update public.recipes set
    name = p_name,
    category = p_category,
    yield_per_batch = p_yield_per_batch,
    yield_label = p_yield_label,
    oven_capacity = p_oven_capacity,
    cycle_minutes = p_cycle_minutes,
    notes = p_notes,
    version = next_version,
    updated_at = now()
  where id = p_recipe_id and user_id = auth.uid();

  delete from public.recipe_ingredients where recipe_id = p_recipe_id and user_id = auth.uid();
  for ingredient in select * from jsonb_array_elements(coalesce(p_ingredients, '[]'::jsonb)) loop
    insert into public.recipe_ingredients(user_id, recipe_id, name, grams, role, package_grams, sort_order)
    values(
      auth.uid(), p_recipe_id, left(ingredient->>'name', 120),
      (ingredient->>'grams')::numeric, (ingredient->>'role')::public.ingredient_role,
      nullif(ingredient->>'packageGrams', '')::numeric,
      coalesce((ingredient->>'sortOrder')::integer, 0)
    );
  end loop;

  insert into public.recipe_versions(user_id, recipe_id, version, snapshot)
  values(auth.uid(), p_recipe_id, next_version, jsonb_build_object(
    'id', p_recipe_id, 'name', p_name, 'category', p_category,
    'yieldPerBatch', p_yield_per_batch, 'yieldLabel', p_yield_label,
    'ovenCapacity', p_oven_capacity, 'cycleMinutes', p_cycle_minutes,
    'notes', p_notes, 'version', next_version, 'ingredients', p_ingredients
  ));
  return next_version;
end;
$$;

create or replace function public.save_event_plan(
  p_event_id uuid,
  p_name text,
  p_event_at timestamptz,
  p_shopping_buffer numeric,
  p_starter_hydration numeric,
  p_items jsonb,
  p_schedule jsonb
) returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  item jsonb;
  block jsonb;
  recipe_row public.recipes%rowtype;
  ingredient_rows jsonb;
  existing_item_id uuid;
  retained_item_ids uuid[] := array[]::uuid[];
begin
  if not exists (select 1 from public.events where id = p_event_id and user_id = auth.uid()) then
    raise exception 'Event not found';
  end if;

  update public.events set
    name = p_name,
    event_at = p_event_at,
    shopping_buffer = p_shopping_buffer,
    starter_hydration = p_starter_hydration,
    status = 'draft',
    updated_at = now()
  where id = p_event_id and user_id = auth.uid();

  delete from public.schedule_blocks where event_id = p_event_id and user_id = auth.uid();

  for item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    select * into recipe_row from public.recipes
      where id = (item->>'recipeId')::uuid and user_id = auth.uid() and archived_at is null;
    if not found then raise exception 'Recipe not found'; end if;

    select coalesce(jsonb_agg(jsonb_build_object(
      'id', id, 'name', name, 'grams', grams, 'role', role,
      'packageGrams', package_grams, 'sortOrder', sort_order
    ) order by sort_order), '[]'::jsonb)
    into ingredient_rows
    from public.recipe_ingredients
    where recipe_id = recipe_row.id and user_id = auth.uid();

    select id into existing_item_id from public.event_items
      where event_id = p_event_id and recipe_id = recipe_row.id and user_id = auth.uid()
      order by sort_order limit 1;

    if existing_item_id is null then
      insert into public.event_items(user_id, event_id, recipe_id, recipe_snapshot, target, batch_policy, sort_order)
      values(
        auth.uid(), p_event_id, recipe_row.id,
        jsonb_build_object(
          'id', recipe_row.id, 'name', recipe_row.name, 'category', recipe_row.category,
          'yieldPerBatch', recipe_row.yield_per_batch, 'yieldLabel', recipe_row.yield_label,
          'ovenCapacity', recipe_row.oven_capacity, 'cycleMinutes', recipe_row.cycle_minutes,
          'notes', recipe_row.notes, 'version', recipe_row.version, 'ingredients', ingredient_rows
        ),
        greatest(0, (item->>'target')::numeric),
        case when item->>'policy' = 'exact' then 'exact' else 'whole' end,
        coalesce((item->>'sortOrder')::integer, 0)
      ) returning id into existing_item_id;
    else
      update public.event_items set
        recipe_snapshot = jsonb_build_object(
          'id', recipe_row.id, 'name', recipe_row.name, 'category', recipe_row.category,
          'yieldPerBatch', recipe_row.yield_per_batch, 'yieldLabel', recipe_row.yield_label,
          'ovenCapacity', recipe_row.oven_capacity, 'cycleMinutes', recipe_row.cycle_minutes,
          'notes', recipe_row.notes, 'version', recipe_row.version, 'ingredients', ingredient_rows
        ),
        target = greatest(0, (item->>'target')::numeric),
        batch_policy = case when item->>'policy' = 'exact' then 'exact' else 'whole' end,
        sort_order = coalesce((item->>'sortOrder')::integer, 0)
      where id = existing_item_id and user_id = auth.uid();
    end if;
    retained_item_ids := array_append(retained_item_ids, existing_item_id);
    existing_item_id := null;
  end loop;

  delete from public.event_items
    where event_id = p_event_id and user_id = auth.uid() and not (id = any(retained_item_ids));

  for block in select * from jsonb_array_elements(coalesce(p_schedule, '[]'::jsonb)) loop
    insert into public.schedule_blocks(user_id, event_id, day_label, title, notes, sort_order)
    values(
      auth.uid(), p_event_id, left(coalesce(block->>'dayLabel', ''), 80),
      left(coalesce(block->>'title', ''), 160), left(coalesce(block->>'notes', ''), 1000),
      coalesce((block->>'sortOrder')::integer, 0)
    );
  end loop;
end;
$$;

create or replace function public.finalize_event(p_event_id uuid) returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (select 1 from public.events where id = p_event_id and user_id = auth.uid()) then
    raise exception 'Event not found';
  end if;
  if not exists (select 1 from public.event_items where event_id = p_event_id and user_id = auth.uid() and target > 0) then
    raise exception 'Add at least one product before finishing the plan';
  end if;
  update public.events set status = 'finalized', updated_at = now()
    where id = p_event_id and user_id = auth.uid();
end;
$$;

create or replace function public.reopen_event(p_event_id uuid) returns void
language sql
security invoker
set search_path = public
as $$
  update public.events set status = 'draft', updated_at = now()
  where id = p_event_id and user_id = auth.uid();
$$;
