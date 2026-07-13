revoke all privileges on table public.moments from anon, authenticated;
grant select on table public.moments to anon, authenticated;

revoke all privileges on table public.notes from anon, authenticated;
grant select, insert, update on table public.notes to authenticated;

revoke all privileges on table public.moment_traces from anon, authenticated;
grant select, insert on table public.moment_traces to authenticated;
