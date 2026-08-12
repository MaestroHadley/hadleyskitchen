alter table public.events
  add column if not exists shopping_checked_items text[] not null default array[]::text[];

alter table public.events
  drop constraint if exists events_shopping_checked_items_limit;

alter table public.events
  add constraint events_shopping_checked_items_limit
  check (cardinality(shopping_checked_items) <= 250);
