-- Shared ingredient catalog + multi-unit conversion support.
-- This migration assumes owner-based RLS already exists on core tables.

-- 1) Ingredients: keep grams as default, and allow shared (owner_id is null) reads.
alter table if exists public.ingredients
  alter column unit_type set default 'g';

drop policy if exists "ingredients_owner_select" on public.ingredients;
create policy "ingredients_owner_select"
  on public.ingredients for select
  using (owner_id = auth.uid() or owner_id is null);

-- 2) Per-ingredient custom conversions (e.g. 1 cup flour = 120g).
create table if not exists public.ingredient_unit_conversions (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients(id) on delete cascade,
  from_unit text not null,
  to_unit text not null,
  factor numeric not null check (factor > 0),
  owner_id uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists ingredient_unit_conversions_ingredient_idx
  on public.ingredient_unit_conversions (ingredient_id);
create index if not exists ingredient_unit_conversions_owner_idx
  on public.ingredient_unit_conversions (owner_id);

alter table public.ingredient_unit_conversions enable row level security;

drop policy if exists "ingredient_unit_conversions_select" on public.ingredient_unit_conversions;
drop policy if exists "ingredient_unit_conversions_insert" on public.ingredient_unit_conversions;
drop policy if exists "ingredient_unit_conversions_update" on public.ingredient_unit_conversions;
drop policy if exists "ingredient_unit_conversions_delete" on public.ingredient_unit_conversions;

create policy "ingredient_unit_conversions_select"
  on public.ingredient_unit_conversions for select
  using (owner_id = auth.uid() or owner_id is null);
create policy "ingredient_unit_conversions_insert"
  on public.ingredient_unit_conversions for insert
  with check (owner_id = auth.uid());
create policy "ingredient_unit_conversions_update"
  on public.ingredient_unit_conversions for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
create policy "ingredient_unit_conversions_delete"
  on public.ingredient_unit_conversions for delete
  using (owner_id = auth.uid());

-- 3) Seed shared default ingredients.
insert into public.ingredients (name, unit_type, owner_id)
select v.name, v.unit_type, null::uuid
from (
  values
    ('All-purpose flour', 'g'),
    ('Bread flour', 'g'),
    ('Cake flour', 'g'),
    ('Whole wheat flour', 'g'),
    ('Rye flour', 'g'),
    ('Granulated sugar', 'g'),
    ('Brown sugar', 'g'),
    ('Powdered sugar', 'g'),
    ('Sea salt', 'g'),
    ('Kosher salt', 'g'),
    ('Baking soda', 'g'),
    ('Baking powder', 'g'),
    ('Active dry yeast', 'g'),
    ('Instant yeast', 'g'),
    ('Sourdough starter', 'g'),
    ('Unsalted butter', 'g'),
    ('Salted butter', 'g'),
    ('Vegetable oil', 'ml'),
    ('Olive oil', 'ml'),
    ('Whole milk', 'ml'),
    ('Buttermilk', 'ml'),
    ('Heavy cream', 'ml'),
    ('Eggs', 'unit'),
    ('Egg whites', 'unit'),
    ('Vanilla extract', 'ml'),
    ('Honey', 'g'),
    ('Molasses', 'g'),
    ('Cornstarch', 'g'),
    ('Cocoa powder', 'g'),
    ('Chocolate chips', 'g'),
    ('Cinnamon', 'g'),
    ('Nutmeg', 'g')
) as v(name, unit_type)
where not exists (
  select 1
  from public.ingredients i
  where i.owner_id is null
    and lower(i.name) = lower(v.name)
);

-- 4) Generic same-dimension conversion helper (mass, volume, count).
create or replace function public.unit_conversion_factor(
  p_from_unit text,
  p_to_unit text
)
returns numeric
language plpgsql
immutable
as $$
declare
  from_u text := lower(trim(coalesce(p_from_unit, '')));
  to_u text := lower(trim(coalesce(p_to_unit, '')));
begin
  if from_u = '' or to_u = '' then
    return null;
  end if;

  if from_u = to_u then
    return 1;
  end if;

  -- Mass (base: g)
  if from_u = 'kg' then
    from_u := 'g'; return 1000 * public.unit_conversion_factor('g', to_u);
  elsif from_u = 'oz' then
    from_u := 'g'; return 28.349523125 * public.unit_conversion_factor('g', to_u);
  elsif from_u = 'lb' then
    from_u := 'g'; return 453.59237 * public.unit_conversion_factor('g', to_u);
  end if;

  if to_u = 'kg' then
    return public.unit_conversion_factor(from_u, 'g') / 1000;
  elsif to_u = 'oz' then
    return public.unit_conversion_factor(from_u, 'g') / 28.349523125;
  elsif to_u = 'lb' then
    return public.unit_conversion_factor(from_u, 'g') / 453.59237;
  end if;

  -- Volume (base: ml)
  if from_u = 'l' then
    from_u := 'ml'; return 1000 * public.unit_conversion_factor('ml', to_u);
  elsif from_u = 'tsp' then
    from_u := 'ml'; return 4.92892159375 * public.unit_conversion_factor('ml', to_u);
  elsif from_u = 'tbsp' then
    from_u := 'ml'; return 14.78676478125 * public.unit_conversion_factor('ml', to_u);
  elsif from_u = 'cup' then
    from_u := 'ml'; return 236.5882365 * public.unit_conversion_factor('ml', to_u);
  end if;

  if to_u = 'l' then
    return public.unit_conversion_factor(from_u, 'ml') / 1000;
  elsif to_u = 'tsp' then
    return public.unit_conversion_factor(from_u, 'ml') / 4.92892159375;
  elsif to_u = 'tbsp' then
    return public.unit_conversion_factor(from_u, 'ml') / 14.78676478125;
  elsif to_u = 'cup' then
    return public.unit_conversion_factor(from_u, 'ml') / 236.5882365;
  end if;

  -- Direct base-unit resolution
  if (from_u = 'g' and to_u = 'g') or (from_u = 'ml' and to_u = 'ml') then
    return 1;
  end if;

  -- Count
  if (from_u = 'unit' and to_u = 'unit') or (from_u = 'count' and to_u = 'unit') then
    return 1;
  end if;

  return null;
end;
$$;

-- 5) Convert qty to ingredient canonical unit with fallback status.
create or replace function public.convert_to_ingredient_unit(
  p_ingredient_id uuid,
  p_qty numeric,
  p_from_unit text,
  p_owner_id uuid default auth.uid()
)
returns table (
  canonical_qty numeric,
  canonical_unit text,
  conversion_source text,
  missing_conversion boolean
)
language sql
stable
as $$
  with ing as (
    select i.id, lower(i.unit_type) as canonical_unit
    from public.ingredients i
    where i.id = p_ingredient_id
  ),
  prep as (
    select
      ing.canonical_unit,
      coalesce(nullif(lower(trim(p_from_unit)), ''), ing.canonical_unit) as from_unit
    from ing
  ),
  generic as (
    select
      public.unit_conversion_factor(prep.from_unit, prep.canonical_unit) as factor,
      prep.canonical_unit
    from prep
  ),
  custom as (
    select
      c.factor,
      lower(c.to_unit) as to_unit
    from prep
    join public.ingredient_unit_conversions c
      on c.ingredient_id = p_ingredient_id
     and lower(c.from_unit) = prep.from_unit
     and lower(c.to_unit) = prep.canonical_unit
     and (c.owner_id = p_owner_id or c.owner_id is null)
    order by
      case when c.owner_id = p_owner_id then 0 else 1 end,
      c.created_at desc
    limit 1
  )
  select
    case
      when generic.factor is not null then p_qty * generic.factor
      when custom.factor is not null then p_qty * custom.factor
      else null
    end as canonical_qty,
    prep.canonical_unit,
    case
      when generic.factor is not null then 'generic'
      when custom.factor is not null then 'ingredient_specific'
      else 'missing'
    end as conversion_source,
    (generic.factor is null and custom.factor is null) as missing_conversion
  from prep
  left join generic on true
  left join custom on true;
$$;

-- 6) JSON-based aggregator RPC for app queries.
-- Input JSON shape per line:
-- { "ingredient_id": "...uuid...", "qty": 2.5, "unit": "cup", "multiplier": 1 }
create or replace function public.aggregate_ingredient_lines(
  p_lines jsonb,
  p_owner_id uuid default auth.uid()
)
returns table (
  ingredient_id uuid,
  ingredient_name text,
  canonical_unit text,
  total_qty numeric,
  missing_line_count int
)
language sql
stable
as $$
  with lines as (
    select
      (l->>'ingredient_id')::uuid as ingredient_id,
      coalesce((l->>'qty')::numeric, 0) as qty,
      nullif(l->>'unit', '') as unit,
      coalesce((l->>'multiplier')::numeric, 1) as multiplier
    from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) l
    where l ? 'ingredient_id'
  ),
  converted as (
    select
      ln.ingredient_id,
      i.name as ingredient_name,
      c.canonical_unit,
      c.canonical_qty,
      c.missing_conversion
    from lines ln
    join public.ingredients i on i.id = ln.ingredient_id
    cross join lateral public.convert_to_ingredient_unit(
      ln.ingredient_id,
      ln.qty * ln.multiplier,
      ln.unit,
      p_owner_id
    ) c
  )
  select
    ingredient_id,
    max(ingredient_name) as ingredient_name,
    max(canonical_unit) as canonical_unit,
    coalesce(sum(canonical_qty), 0) as total_qty,
    sum(case when missing_conversion then 1 else 0 end)::int as missing_line_count
  from converted
  group by ingredient_id;
$$;

-- 7) Seed starter ingredient-specific conversions (owner_id null = shared).
with target_ingredients as (
  select id, lower(name) as name
  from public.ingredients
  where owner_id is null
)
insert into public.ingredient_unit_conversions (
  ingredient_id, from_unit, to_unit, factor, owner_id
)
select
  ti.id,
  v.from_unit,
  v.to_unit,
  v.factor,
  null::uuid
from target_ingredients ti
join (
  values
    ('all-purpose flour', 'cup', 'g', 120::numeric),
    ('all-purpose flour', 'tbsp', 'g', 7.5::numeric),
    ('all-purpose flour', 'tsp', 'g', 2.5::numeric),
    ('bread flour', 'cup', 'g', 127::numeric),
    ('cake flour', 'cup', 'g', 113::numeric),
    ('whole wheat flour', 'cup', 'g', 120::numeric),
    ('rye flour', 'cup', 'g', 102::numeric),
    ('granulated sugar', 'cup', 'g', 200::numeric),
    ('brown sugar', 'cup', 'g', 220::numeric),
    ('powdered sugar', 'cup', 'g', 120::numeric),
    ('honey', 'tbsp', 'g', 21::numeric),
    ('molasses', 'tbsp', 'g', 20::numeric),
    ('unsalted butter', 'tbsp', 'g', 14.2::numeric),
    ('salted butter', 'tbsp', 'g', 14.2::numeric),
    ('cocoa powder', 'cup', 'g', 85::numeric),
    ('chocolate chips', 'cup', 'g', 170::numeric),
    ('cinnamon', 'tsp', 'g', 2.6::numeric),
    ('nutmeg', 'tsp', 'g', 2.2::numeric),
    ('baking soda', 'tsp', 'g', 4.6::numeric),
    ('baking powder', 'tsp', 'g', 4.0::numeric),
    ('sea salt', 'tsp', 'g', 5.7::numeric),
    ('kosher salt', 'tsp', 'g', 3.0::numeric),
    ('active dry yeast', 'tsp', 'g', 3.1::numeric),
    ('instant yeast', 'tsp', 'g', 3.1::numeric),
    ('sourdough starter', 'cup', 'g', 227::numeric)
) as v(name, from_unit, to_unit, factor)
  on v.name = ti.name
where not exists (
  select 1
  from public.ingredient_unit_conversions c
  where c.ingredient_id = ti.id
    and lower(c.from_unit) = lower(v.from_unit)
    and lower(c.to_unit) = lower(v.to_unit)
    and c.owner_id is null
);
