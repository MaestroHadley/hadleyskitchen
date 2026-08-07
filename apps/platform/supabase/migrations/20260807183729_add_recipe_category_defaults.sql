create table public.recipe_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  name_normalized text generated always as (lower(trim(name))) stored,
  created_at timestamptz not null default now(),
  unique (user_id, name_normalized)
);

alter table public.recipe_categories enable row level security;

create policy recipe_categories_select_owner
on public.recipe_categories for select
to authenticated
using ((select auth.uid()) = user_id);

create policy recipe_categories_insert_owner
on public.recipe_categories for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy recipe_categories_update_owner
on public.recipe_categories for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy recipe_categories_delete_owner
on public.recipe_categories for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.recipe_categories to authenticated;

insert into public.recipe_categories (user_id, name)
select distinct user_id, trim(category)
from public.recipes
where nullif(trim(category), '') is not null
on conflict (user_id, name_normalized) do nothing;

insert into public.recipe_categories (user_id, name)
select users.id, defaults.name
from auth.users as users
cross join (values
  ('Bagels'),
  ('Bread'),
  ('Cookies'),
  ('Other'),
  ('Pastry'),
  ('Sweet Rolls')
) as defaults(name)
on conflict (user_id, name_normalized) do nothing;

create or replace function private.seed_default_recipe_categories()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.recipe_categories (user_id, name)
  values
    (new.id, 'Bagels'),
    (new.id, 'Bread'),
    (new.id, 'Cookies'),
    (new.id, 'Other'),
    (new.id, 'Pastry'),
    (new.id, 'Sweet Rolls')
  on conflict (user_id, name_normalized) do nothing;
  return new;
end;
$$;

revoke all on function private.seed_default_recipe_categories() from public, anon, authenticated;

create trigger on_auth_user_created_recipe_categories
after insert on auth.users
for each row execute function private.seed_default_recipe_categories();
