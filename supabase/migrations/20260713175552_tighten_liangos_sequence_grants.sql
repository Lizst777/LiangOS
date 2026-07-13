revoke all privileges on sequence public.moments_id_seq from anon, authenticated;

revoke all privileges on sequence public.moment_traces_id_seq from anon, authenticated;
grant usage on sequence public.moment_traces_id_seq to authenticated;
