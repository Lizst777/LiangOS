insert into public.note_versions (user_id, content, last_entry_date)
select notes.user_id, notes.content, notes.last_entry_date
from public.notes
where not exists (
  select 1
  from public.note_versions
  where note_versions.user_id = notes.user_id
);
