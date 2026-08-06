create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

drop function if exists public.consume_recipe_import_quota(integer, integer);

alter table public.recipe_import_usage set schema private;
revoke all on private.recipe_import_usage from public, anon, authenticated;

create or replace function private.consume_recipe_import_quota(
  p_user_limit integer,
  p_global_limit integer
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  today_utc date := (timezone('utc', now()))::date;
  effective_user_limit integer := least(greatest(p_user_limit, 1), 3);
  effective_global_limit integer := least(greatest(p_global_limit, 1), 50);
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  perform pg_advisory_xact_lock(hashtext('recipe_import_quota:' || today_utc::text));
  if (select count(*) from private.recipe_import_usage where used_on = today_utc) >= effective_global_limit then
    return false;
  end if;
  if (select count(*) from private.recipe_import_usage where used_on = today_utc and user_id = caller_id) >= effective_user_limit then
    return false;
  end if;

  insert into private.recipe_import_usage(user_id, used_on)
  values(caller_id, today_utc);
  return true;
end;
$$;

revoke execute on function private.consume_recipe_import_quota(integer, integer) from public, anon;
grant execute on function private.consume_recipe_import_quota(integer, integer) to authenticated;

create or replace function public.consume_recipe_import_quota(
  p_user_limit integer,
  p_global_limit integer
) returns boolean
language sql
security invoker
set search_path = ''
as $$
  select private.consume_recipe_import_quota(p_user_limit, p_global_limit);
$$;

revoke execute on function public.consume_recipe_import_quota(integer, integer) from public, anon;
grant execute on function public.consume_recipe_import_quota(integer, integer) to authenticated;
