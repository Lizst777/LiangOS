revoke all privileges on table public.note_versions from anon, authenticated;
grant select, insert on table public.note_versions to authenticated;

revoke all privileges on sequence public.note_versions_id_seq from anon, authenticated;
grant usage on sequence public.note_versions_id_seq to authenticated;
