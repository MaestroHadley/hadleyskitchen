-- Phase 5: allergen + dietary tags for recipes.

begin;

alter table if exists public.recipes
  add column if not exists allergen_tags text[] not null default '{}';

alter table if exists public.recipes
  add column if not exists dietary_tags text[] not null default '{}';

update public.recipes
set allergen_tags = coalesce(allergen_tags, '{}');

update public.recipes
set dietary_tags = coalesce(dietary_tags, '{}');

-- Extend missing conversion report function with optional recipe tag filters.
create or replace function public.get_missing_conversions(
  p_owner_id uuid default auth.uid(),
  p_allergen_filter text[] default null,
  p_dietary_filter text[] default null
)
returns table (
  ingredient_id uuid,
  ingredient_name text,
  from_unit text,
  to_unit text,
  line_count bigint
)
language sql
stable
as $$
  with line_units as (
    select
      rl.ingredient_id,
      lower(trim(rl.unit)) as from_unit,
      count(*) as line_count
    from public.recipe_lines rl
    join public.recipes r on r.id = rl.recipe_id
    where rl.owner_id = p_owner_id
      and r.owner_id = p_owner_id
      and r.archived_at is null
      and rl.unit is not null
      and trim(rl.unit) <> ''
      and (
        p_allergen_filter is null
        or cardinality(p_allergen_filter) = 0
        or r.allergen_tags && p_allergen_filter
      )
      and (
        p_dietary_filter is null
        or cardinality(p_dietary_filter) = 0
        or r.dietary_tags && p_dietary_filter
      )
    group by rl.ingredient_id, lower(trim(rl.unit))
  ),
  target_units as (
    select
      lu.ingredient_id,
      i.name as ingredient_name,
      lu.from_unit,
      lower(i.unit_type) as to_unit,
      lu.line_count
    from line_units lu
    join public.ingredients i on i.id = lu.ingredient_id
    where lu.from_unit <> lower(i.unit_type)
  ),
  evaluated as (
    select
      tu.*,
      public.unit_conversion_factor(tu.from_unit, tu.to_unit) as generic_factor,
      exists (
        select 1
        from public.ingredient_unit_conversions c
        where c.ingredient_id = tu.ingredient_id
          and lower(c.from_unit) = tu.from_unit
          and lower(c.to_unit) = tu.to_unit
          and (c.owner_id = p_owner_id or c.owner_id is null)
      ) as custom_exists
    from target_units tu
  )
  select
    ingredient_id,
    ingredient_name,
    from_unit,
    to_unit,
    line_count
  from evaluated
  where generic_factor is null
    and custom_exists = false
  order by line_count desc, ingredient_name asc, from_unit asc;
$$;

commit;
