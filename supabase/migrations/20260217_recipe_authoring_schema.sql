-- Normalize recipe authoring fields used by /app/recipes UI.

begin;

-- Recipes table: title/category/description/instructions
alter table if exists public.recipes
  add column if not exists title text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'recipes'
      and column_name = 'name'
  ) then
    execute $copy$
      update public.recipes
      set title = coalesce(nullif(trim(title), ''), nullif(trim(name), ''), 'Untitled recipe')
    $copy$;
  end if;
end $$;

update public.recipes
set title = coalesce(nullif(trim(title), ''), 'Untitled recipe');

alter table if exists public.recipes
  alter column title set default 'Untitled recipe';
alter table if exists public.recipes
  alter column title set not null;

alter table if exists public.recipes
  add column if not exists category text;
update public.recipes
set category = coalesce(nullif(trim(lower(category)), ''), 'bread');
alter table if exists public.recipes
  alter column category set default 'bread';
alter table if exists public.recipes
  alter column category set not null;

alter table if exists public.recipes
  add column if not exists description text;

alter table if exists public.recipes
  add column if not exists instructions text;

-- Recipe lines table: qty + unit for mixed-unit entry.
alter table if exists public.recipe_lines
  add column if not exists qty numeric;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'recipe_lines'
      and column_name = 'quantity'
  ) then
    execute $copy$
      update public.recipe_lines
      set qty = coalesce(qty, quantity)
      where quantity is not null
    $copy$;
  end if;
end $$;

update public.recipe_lines
set qty = coalesce(qty, 0);

alter table if exists public.recipe_lines
  alter column qty set default 0;
alter table if exists public.recipe_lines
  alter column qty set not null;

alter table if exists public.recipe_lines
  add column if not exists unit text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'recipe_lines'
      and column_name = 'unit_type'
  ) then
    execute $copy$
      update public.recipe_lines
      set unit = coalesce(nullif(trim(unit), ''), nullif(trim(unit_type), ''))
      where unit_type is not null
    $copy$;
  end if;
end $$;

create index if not exists recipe_lines_recipe_id_idx on public.recipe_lines(recipe_id);
create index if not exists recipe_lines_ingredient_id_idx on public.recipe_lines(ingredient_id);

commit;
