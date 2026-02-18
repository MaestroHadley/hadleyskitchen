-- Treat sourdough starter as 50/50 flour + water in aggregate totals.
-- Also ensure shared default sourdough starter exists in grams.

begin;

insert into public.ingredients (name, unit_type, owner_id)
select 'Sourdough starter', 'g', null::uuid
where not exists (
  select 1
  from public.ingredients i
  where i.owner_id is null
    and lower(i.name) = 'sourdough starter'
);

update public.ingredients
set unit_type = 'g'
where owner_id is null
  and lower(name) = 'sourdough starter'
  and lower(unit_type) <> 'g';

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
  ),
  starter_targets as (
    select
      (
        select i.id
        from public.ingredients i
        where lower(i.name) = 'water'
          and (i.owner_id = p_owner_id or i.owner_id is null)
        order by case when i.owner_id = p_owner_id then 0 else 1 end
        limit 1
      ) as water_id,
      (
        select i.id
        from public.ingredients i
        where lower(i.name) in ('bread flour', 'all-purpose flour')
          and (i.owner_id = p_owner_id or i.owner_id is null)
        order by
          case
            when lower(i.name) = 'bread flour' then 0
            when lower(i.name) = 'all-purpose flour' then 1
            else 2
          end,
          case when i.owner_id = p_owner_id then 0 else 1 end
        limit 1
      ) as flour_id
  ),
  expanded as (
    -- Keep all non-starter lines as-is.
    select
      c.ingredient_id,
      c.ingredient_name,
      c.canonical_unit,
      c.canonical_qty,
      c.missing_conversion
    from converted c
    where lower(c.ingredient_name) <> 'sourdough starter'

    union all

    -- Expand starter to water when both targets exist.
    select
      st.water_id as ingredient_id,
      wi.name as ingredient_name,
      'g'::text as canonical_unit,
      c.canonical_qty * 0.5 as canonical_qty,
      c.missing_conversion as missing_conversion
    from converted c
    cross join starter_targets st
    join public.ingredients wi on wi.id = st.water_id
    where lower(c.ingredient_name) = 'sourdough starter'
      and st.water_id is not null
      and st.flour_id is not null

    union all

    -- Expand starter to flour when both targets exist.
    select
      st.flour_id as ingredient_id,
      fi.name as ingredient_name,
      'g'::text as canonical_unit,
      c.canonical_qty * 0.5 as canonical_qty,
      c.missing_conversion as missing_conversion
    from converted c
    cross join starter_targets st
    join public.ingredients fi on fi.id = st.flour_id
    where lower(c.ingredient_name) = 'sourdough starter'
      and st.water_id is not null
      and st.flour_id is not null

    union all

    -- Fallback: if targets are missing, keep starter line to avoid dropping totals.
    select
      c.ingredient_id,
      c.ingredient_name,
      c.canonical_unit,
      c.canonical_qty,
      true as missing_conversion
    from converted c
    cross join starter_targets st
    where lower(c.ingredient_name) = 'sourdough starter'
      and (st.water_id is null or st.flour_id is null)
  )
  select
    ingredient_id,
    max(ingredient_name) as ingredient_name,
    max(canonical_unit) as canonical_unit,
    coalesce(sum(canonical_qty), 0) as total_qty,
    sum(case when missing_conversion then 1 else 0 end)::int as missing_line_count
  from expanded
  group by ingredient_id;
$$;

commit;
