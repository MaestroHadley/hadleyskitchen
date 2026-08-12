alter table public.google_connections
  add column recipe_folder_id text;

comment on column public.google_connections.recipe_folder_id is
  'Google Drive folder created and managed by Hearthworks for recipe documents.';

create table public.recipe_google_exports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  google_file_id text not null,
  google_file_url text not null,
  exported_at timestamptz not null default now(),
  unique (user_id, recipe_id)
);

create index recipe_google_exports_recipe_idx
  on public.recipe_google_exports(recipe_id);

alter table public.recipe_google_exports enable row level security;

create policy recipe_google_exports_owner
  on public.recipe_google_exports
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete
  on table public.recipe_google_exports
  to authenticated;

grant select, update
  on table public.google_connections
  to authenticated;
