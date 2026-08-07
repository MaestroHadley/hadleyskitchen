alter table public.google_connections
  add column google_account_id text,
  add column google_email text;

comment on column public.google_connections.google_account_id is
  'Stable Google OpenID subject for the account that granted Drive access.';

comment on column public.google_connections.google_email is
  'Google email shown to the user as the owner of the connected Drive authorization.';
