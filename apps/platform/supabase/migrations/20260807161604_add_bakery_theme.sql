alter table if exists public.profiles
  add column if not exists theme_id text not null default 'studio';

do $$
begin
  alter table public.profiles
    add constraint profiles_theme_id_check
    check (theme_id in ('studio', 'garden', 'confetti'));
exception
  when duplicate_object then null;
end
$$;
