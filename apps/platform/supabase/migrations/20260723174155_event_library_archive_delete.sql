alter table public.events
  add column if not exists qa_checks jsonb not null default jsonb_build_object(
    'quantities', false,
    'starter', false,
    'shopping', false,
    'oven', false,
    'finalCount', false
  );

create table if not exists public.event_archive_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  destination text not null check (destination in ('doc', 'sheet', 'download')),
  checksum text not null check (char_length(checksum) = 64),
  google_file_url text,
  created_at timestamptz not null default now()
);

alter table public.event_archive_receipts enable row level security;

drop policy if exists event_archive_receipts_select_owner on public.event_archive_receipts;
create policy event_archive_receipts_select_owner
  on public.event_archive_receipts for select
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists event_archive_receipts_insert_owner on public.event_archive_receipts;
create policy event_archive_receipts_insert_owner
  on public.event_archive_receipts for insert
  to authenticated
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

drop policy if exists event_archive_receipts_delete_owner on public.event_archive_receipts;
create policy event_archive_receipts_delete_owner
  on public.event_archive_receipts for delete
  to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

grant select, insert, delete on table public.event_archive_receipts to authenticated;

create index if not exists event_archive_receipts_event_idx
  on public.event_archive_receipts(event_id, created_at desc);
create index if not exists events_user_status_date_idx
  on public.events(user_id, status, event_at);
create index if not exists events_user_updated_idx
  on public.events(user_id, updated_at desc);

create or replace function public.delete_event_with_archive(p_event_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  event_status text;
begin
  select status into event_status
  from public.events
  where id = p_event_id and user_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'Event not found';
  end if;

  if event_status <> 'draft' and not exists (
    select 1
    from public.event_archive_receipts
    where event_id = p_event_id
      and user_id = (select auth.uid())
      and created_at >= now() - interval '24 hours'
  ) then
    raise exception 'Create an archive before deleting a finalized event';
  end if;

  delete from public.events
  where id = p_event_id and user_id = (select auth.uid());
end;
$$;

revoke all on function public.delete_event_with_archive(uuid) from public;
grant execute on function public.delete_event_with_archive(uuid) to authenticated;
