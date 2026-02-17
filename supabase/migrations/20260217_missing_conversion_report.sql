-- Phase 2: report recipe line unit pairs that cannot be converted.

create or replace function public.get_missing_conversions(
  p_owner_id uuid default auth.uid()
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
    where rl.owner_id = p_owner_id
      and rl.unit is not null
      and trim(rl.unit) <> ''
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
