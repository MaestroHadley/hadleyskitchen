alter table public.recipes
  add column if not exists instructions text not null default '';

create table if not exists public.recipe_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null unique references public.recipes(id) on delete cascade,
  source_type text not null check (source_type in ('manual', 'text', 'url', 'image', 'pdf')),
  source_label text not null default '',
  source_url text,
  processing_method text not null check (processing_method in ('manual', 'json_ld', 'ai')),
  ai_model text,
  consent_version text,
  source_snapshot jsonb not null default '{}'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.recipe_imports enable row level security;
drop policy if exists recipe_imports_owner on public.recipe_imports;
create policy recipe_imports_owner on public.recipe_imports
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.recipe_imports to authenticated;
revoke all on public.recipe_imports from anon;

create index if not exists recipe_imports_user_created_idx
  on public.recipe_imports(user_id, created_at desc);

create table if not exists public.recipe_import_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  used_on date not null default ((timezone('utc', now()))::date),
  created_at timestamptz not null default now()
);

alter table public.recipe_import_usage enable row level security;
revoke all on public.recipe_import_usage from anon, authenticated;
revoke all on sequence public.recipe_import_usage_id_seq from anon, authenticated;

create index if not exists recipe_import_usage_day_idx
  on public.recipe_import_usage(used_on, user_id);

create or replace function public.consume_recipe_import_quota(
  p_user_limit integer,
  p_global_limit integer
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  today_utc date := (timezone('utc', now()))::date;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;
  if p_user_limit < 1 or p_global_limit < 1 then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtext('recipe_import_quota:' || today_utc::text));
  if (select count(*) from public.recipe_import_usage where used_on = today_utc) >= least(p_global_limit, 1000) then
    return false;
  end if;
  if (select count(*) from public.recipe_import_usage where used_on = today_utc and user_id = caller_id) >= least(p_user_limit, 50) then
    return false;
  end if;

  insert into public.recipe_import_usage(user_id, used_on)
  values(caller_id, today_utc);
  return true;
end;
$$;

revoke execute on function public.consume_recipe_import_quota(integer, integer) from public, anon;
grant execute on function public.consume_recipe_import_quota(integer, integer) to authenticated;

create or replace function public.create_imported_recipe(
  p_name text,
  p_category text,
  p_yield_per_batch numeric,
  p_yield_label text,
  p_oven_capacity numeric,
  p_cycle_minutes integer,
  p_instructions text,
  p_notes text,
  p_ingredients jsonb,
  p_provenance jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  recipe_id uuid;
  ingredient jsonb;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;
  if jsonb_array_length(coalesce(p_ingredients, '[]'::jsonb)) < 1 then
    raise exception 'At least one ingredient is required';
  end if;

  insert into public.recipes(
    user_id, name, category, yield_per_batch, yield_label,
    oven_capacity, cycle_minutes, instructions, notes
  ) values (
    caller_id, left(p_name, 120), left(p_category, 80), p_yield_per_batch, left(p_yield_label, 40),
    p_oven_capacity, p_cycle_minutes, left(coalesce(p_instructions, ''), 20000), left(coalesce(p_notes, ''), 5000)
  ) returning id into recipe_id;

  for ingredient in select * from jsonb_array_elements(coalesce(p_ingredients, '[]'::jsonb)) loop
    insert into public.recipe_ingredients(
      user_id, recipe_id, name, grams, role, package_grams, sort_order
    ) values (
      caller_id, recipe_id, left(ingredient->>'name', 120),
      (ingredient->>'grams')::numeric,
      (ingredient->>'role')::public.ingredient_role,
      nullif(ingredient->>'packageGrams', '')::numeric,
      coalesce((ingredient->>'sortOrder')::integer, 0)
    );
  end loop;

  insert into public.recipe_imports(
    user_id, recipe_id, source_type, source_label, source_url,
    processing_method, ai_model, consent_version, source_snapshot, warnings
  ) values (
    caller_id,
    recipe_id,
    p_provenance->>'sourceType',
    left(coalesce(p_provenance->>'sourceLabel', ''), 240),
    nullif(left(coalesce(p_provenance->>'sourceUrl', ''), 2000), ''),
    p_provenance->>'processingMethod',
    nullif(left(coalesce(p_provenance->>'aiModel', ''), 120), ''),
    nullif(left(coalesce(p_provenance->>'consentVersion', ''), 80), ''),
    coalesce(p_provenance->'sourceSnapshot', '{}'::jsonb),
    coalesce(p_provenance->'warnings', '[]'::jsonb)
  );

  return recipe_id;
end;
$$;

revoke execute on function public.create_imported_recipe(text, text, numeric, text, numeric, integer, text, text, jsonb, jsonb) from public, anon;
grant execute on function public.create_imported_recipe(text, text, numeric, text, numeric, integer, text, text, jsonb, jsonb) to authenticated;

create or replace function public.save_recipe(
  p_recipe_id uuid,
  p_name text,
  p_category text,
  p_yield_per_batch numeric,
  p_yield_label text,
  p_oven_capacity numeric,
  p_cycle_minutes integer,
  p_instructions text,
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
    instructions = p_instructions,
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
    'instructions', p_instructions, 'notes', p_notes,
    'version', next_version, 'ingredients', p_ingredients
  ));
  return next_version;
end;
$$;

revoke execute on function public.save_recipe(uuid, text, text, numeric, text, numeric, integer, text, text, jsonb) from public, anon;
grant execute on function public.save_recipe(uuid, text, text, numeric, text, numeric, integer, text, text, jsonb) to authenticated;
