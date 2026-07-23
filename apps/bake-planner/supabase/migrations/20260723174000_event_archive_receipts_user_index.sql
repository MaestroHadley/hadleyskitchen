create index if not exists event_archive_receipts_user_idx
  on public.event_archive_receipts(user_id, event_id, created_at desc);
