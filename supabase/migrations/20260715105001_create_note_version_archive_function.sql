create or replace function public.archive_note_before_update()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.note_versions
    where user_id = old.user_id
      and created_at >= statement_timestamp() - interval '10 minutes'
  ) then
    insert into public.note_versions (user_id, content, last_entry_date)
    values (old.user_id, old.content, old.last_entry_date);
  end if;

  return new;
end;
$$;

revoke all on function public.archive_note_before_update() from public, anon;
grant execute on function public.archive_note_before_update() to authenticated;
