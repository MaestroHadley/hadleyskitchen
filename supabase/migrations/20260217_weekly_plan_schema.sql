-- Weekly plan authoring schema normalization.

begin;

alter table if exists public.weekly_plans
  add column if not exists title text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'weekly_plans'
      and column_name = 'name'
  ) then
    execute $copy$
      update public.weekly_plans
      set title = coalesce(nullif(trim(title), ''), nullif(trim(name), ''), 'Weekly Plan')
    $copy$;
  end if;
end $$;

update public.weekly_plans
set title = coalesce(nullif(trim(title), ''), 'Weekly Plan');

alter table if exists public.weekly_plans
  alter column title set default 'Weekly Plan';
alter table if exists public.weekly_plans
  alter column title set not null;

alter table if exists public.weekly_plans
  add column if not exists week_start date;

alter table if exists public.weekly_plans
  add column if not exists week_end date;

update public.weekly_plans
set week_start = coalesce(week_start, current_date)
where week_start is null;

update public.weekly_plans
set week_end = coalesce(week_end, week_start + 6)
where week_end is null;

alter table if exists public.weekly_plans
  alter column week_start set default current_date;
alter table if exists public.weekly_plans
  alter column week_start set not null;
alter table if exists public.weekly_plans
  alter column week_end set default (current_date + 6);
alter table if exists public.weekly_plans
  alter column week_end set not null;

alter table if exists public.weekly_plans
  drop constraint if exists weekly_plans_week_range_check;
alter table if exists public.weekly_plans
  add constraint weekly_plans_week_range_check check (week_end >= week_start);

alter table if exists public.weekly_plans
  add column if not exists archived_at timestamptz;

create index if not exists weekly_plans_owner_archived_idx
  on public.weekly_plans (owner_id, archived_at);

alter table if exists public.plan_items
  add column if not exists qty numeric;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'plan_items'
      and column_name = 'quantity'
  ) then
    execute $copy$
      update public.plan_items
      set qty = coalesce(qty, quantity)
      where quantity is not null
    $copy$;
  end if;
end $$;

update public.plan_items
set qty = coalesce(qty, 1)
where qty is null;

alter table if exists public.plan_items
  alter column qty set default 1;
alter table if exists public.plan_items
  alter column qty set not null;

alter table if exists public.plan_items
  drop constraint if exists plan_items_qty_positive_check;
alter table if exists public.plan_items
  add constraint plan_items_qty_positive_check check (qty > 0);

create index if not exists plan_items_plan_idx on public.plan_items (plan_id);
create index if not exists plan_items_recipe_idx on public.plan_items (recipe_id);

commit;
