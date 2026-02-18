-- Compact QA seed for one specific user.
-- Default target email: hadleyskitchen@protonmail.com
-- This script is idempotent for title/name combos used below.

begin;

-- 1) Set target owner (REQUIRED).
-- If needed, change v_email below.
do $$
declare
  v_email text := 'hadleyskitchen@protonmail.com';
  v_owner uuid;
begin
  select id into v_owner
  from auth.users
  where lower(email) = lower(v_email)
  limit 1;

  if v_owner is null then
    raise exception 'No auth.users row found for email: %', v_email;
  end if;
end $$;

-- 2) Seed custom ingredients for this owner.
with params as (
  select id as owner_id
  from auth.users
  where lower(email) = lower('hadleyskitchen@protonmail.com')
  limit 1
)
insert into public.ingredients (name, unit_type, owner_id)
select v.name, v.unit_type, p.owner_id
from params p
join (
  values
    ('QA Bread Flour', 'g'),
    ('QA Water', 'g'),
    ('QA Sea Salt', 'g'),
    ('QA Yeast', 'g')
) as v(name, unit_type) on true
where not exists (
  select 1 from public.ingredients i
  where i.owner_id = p.owner_id
    and lower(i.name) = lower(v.name)
);

-- 3) Seed a QA recipe.
do $$
declare
  v_owner uuid;
  v_has_name_col boolean;
begin
  select id into v_owner
  from auth.users
  where lower(email) = lower('hadleyskitchen@protonmail.com')
  limit 1;

  if v_owner is null then
    raise exception 'No auth.users row found for email: hadleyskitchen@protonmail.com';
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'recipes'
      and column_name = 'name'
  ) into v_has_name_col;

  if v_has_name_col then
    execute $sql$
      insert into public.recipes (
        name,
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
        owner_id
      )
      select
        'QA Country Loaf',
        'QA Country Loaf',
        'bread',
        2,
        'loaf',
        'Compact QA seed recipe.',
        'Mix, bulk ferment, shape, proof, bake.',
        180,
        60,
        465,
        40,
        array['gluten']::text[],
        array['vegetarian']::text[],
        $1
      where not exists (
        select 1
        from public.recipes r
        where r.owner_id = $1
          and (r.title = 'QA Country Loaf' or r.name = 'QA Country Loaf')
      )
    $sql$
    using v_owner;
  else
    execute $sql$
      insert into public.recipes (
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
        owner_id
      )
      select
        'QA Country Loaf',
        'bread',
        2,
        'loaf',
        'Compact QA seed recipe.',
        'Mix, bulk ferment, shape, proof, bake.',
        180,
        60,
        465,
        40,
        array['gluten']::text[],
        array['vegetarian']::text[],
        $1
      where not exists (
        select 1
        from public.recipes r
        where r.owner_id = $1
          and r.title = 'QA Country Loaf'
      )
    $sql$
    using v_owner;
  end if;
end $$;

-- 4) Seed recipe lines for that recipe.
with params as (
  select id as owner_id
  from auth.users
  where lower(email) = lower('hadleyskitchen@protonmail.com')
  limit 1
),
recipe_target as (
  select r.id as recipe_id, p.owner_id
  from params p
  join public.recipes r on r.owner_id = p.owner_id and r.title = 'QA Country Loaf'
),
ing as (
  select i.id, i.name, i.owner_id
  from params p
  join public.ingredients i on i.owner_id = p.owner_id
  where i.name in ('QA Bread Flour', 'QA Water', 'QA Sea Salt', 'QA Yeast')
)
insert into public.recipe_lines (recipe_id, ingredient_id, qty, unit, owner_id)
select rt.recipe_id, i.id, v.qty, v.unit, rt.owner_id
from recipe_target rt
join ing i on true
join (
  values
    ('QA Bread Flour', 900::numeric, 'g'),
    ('QA Water', 700::numeric, 'g'),
    ('QA Sea Salt', 18::numeric, 'g'),
    ('QA Yeast', 3::numeric, 'g')
) as v(name, qty, unit) on v.name = i.name
where not exists (
  select 1
  from public.recipe_lines rl
  where rl.recipe_id = rt.recipe_id
    and rl.ingredient_id = i.id
);

-- 5) Seed a weekly plan + plan item (supports legacy column variants).
do $$
declare
  v_owner uuid;
  v_plan_id uuid;
  v_recipe_id uuid;
  v_has_weekly_name_col boolean;
  v_has_recipe_name_col boolean;
  v_has_qty_col boolean;
  v_has_ordered_qty_col boolean;
  v_has_quantity_col boolean;
begin
  select id into v_owner
  from auth.users
  where lower(email) = lower('hadleyskitchen@protonmail.com')
  limit 1;

  if v_owner is null then
    raise exception 'No auth.users row found for email: hadleyskitchen@protonmail.com';
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'weekly_plans'
      and column_name = 'name'
  ) into v_has_weekly_name_col;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'recipes'
      and column_name = 'name'
  ) into v_has_recipe_name_col;

  if v_has_weekly_name_col then
    execute $sql$
      insert into public.weekly_plans (name, title, week_start, week_end, owner_id)
      select 'QA Week Plan', 'QA Week Plan', current_date, current_date + 6, $1
      where not exists (
        select 1
        from public.weekly_plans wp
        where wp.owner_id = $1
          and (wp.title = 'QA Week Plan' or wp.name = 'QA Week Plan')
      )
    $sql$
    using v_owner;
  else
    execute $sql$
      insert into public.weekly_plans (title, week_start, week_end, owner_id)
      select 'QA Week Plan', current_date, current_date + 6, $1
      where not exists (
        select 1
        from public.weekly_plans wp
        where wp.owner_id = $1
          and wp.title = 'QA Week Plan'
      )
    $sql$
    using v_owner;
  end if;

  if v_has_weekly_name_col then
    execute $sql$
      select wp.id
      from public.weekly_plans wp
      where wp.owner_id = $1
        and (wp.title = 'QA Week Plan' or wp.name = 'QA Week Plan')
      order by wp.week_start desc, wp.id desc
      limit 1
    $sql$
    into v_plan_id
    using v_owner;
  else
    execute $sql$
      select wp.id
      from public.weekly_plans wp
      where wp.owner_id = $1
        and wp.title = 'QA Week Plan'
      order by wp.week_start desc, wp.id desc
      limit 1
    $sql$
    into v_plan_id
    using v_owner;
  end if;

  if v_has_recipe_name_col then
    execute $sql$
      select r.id
      from public.recipes r
      where r.owner_id = $1
        and (r.title = 'QA Country Loaf' or r.name = 'QA Country Loaf')
      limit 1
    $sql$
    into v_recipe_id
    using v_owner;
  else
    execute $sql$
      select r.id
      from public.recipes r
      where r.owner_id = $1
        and r.title = 'QA Country Loaf'
      limit 1
    $sql$
    into v_recipe_id
    using v_owner;
  end if;

  if v_plan_id is null or v_recipe_id is null then
    raise exception 'Could not resolve QA plan or QA recipe for plan item seeding.';
  end if;

  select exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='plan_items' and column_name='qty'
  ) into v_has_qty_col;
  select exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='plan_items' and column_name='ordered_qty'
  ) into v_has_ordered_qty_col;
  select exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='plan_items' and column_name='quantity'
  ) into v_has_quantity_col;

  if v_has_qty_col and v_has_ordered_qty_col then
    execute $sql$
      insert into public.plan_items (plan_id, recipe_id, qty, ordered_qty, owner_id)
      select $1, $2, 3, 3, $3
      where not exists (
        select 1 from public.plan_items pi where pi.plan_id = $1 and pi.recipe_id = $2
      )
    $sql$
    using v_plan_id, v_recipe_id, v_owner;
  elsif v_has_qty_col then
    execute $sql$
      insert into public.plan_items (plan_id, recipe_id, qty, owner_id)
      select $1, $2, 3, $3
      where not exists (
        select 1 from public.plan_items pi where pi.plan_id = $1 and pi.recipe_id = $2
      )
    $sql$
    using v_plan_id, v_recipe_id, v_owner;
  elsif v_has_ordered_qty_col then
    execute $sql$
      insert into public.plan_items (plan_id, recipe_id, ordered_qty, owner_id)
      select $1, $2, 3, $3
      where not exists (
        select 1 from public.plan_items pi where pi.plan_id = $1 and pi.recipe_id = $2
      )
    $sql$
    using v_plan_id, v_recipe_id, v_owner;
  elsif v_has_quantity_col then
    execute $sql$
      insert into public.plan_items (plan_id, recipe_id, quantity, owner_id)
      select $1, $2, 3, $3
      where not exists (
        select 1 from public.plan_items pi where pi.plan_id = $1 and pi.recipe_id = $2
      )
    $sql$
    using v_plan_id, v_recipe_id, v_owner;
  else
    raise exception 'plan_items has no qty/ordered_qty/quantity column supported by seed script.';
  end if;
end $$;

commit;
