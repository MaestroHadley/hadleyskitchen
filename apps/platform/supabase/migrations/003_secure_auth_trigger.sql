-- Keep the auth trigger callable only by PostgreSQL's trigger machinery.
-- SECURITY DEFINER functions are executable by PUBLIC unless privileges are revoked explicitly.
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- Backfill users who signed in before the profile/settings trigger was installed.
insert into public.profiles (user_id, bakery_name)
select
  id,
  coalesce(nullif(raw_user_meta_data ->> 'full_name', ''), 'My Bakery')
from auth.users
on conflict (user_id) do nothing;

insert into public.planner_settings (user_id)
select id
from auth.users
on conflict (user_id) do nothing;
