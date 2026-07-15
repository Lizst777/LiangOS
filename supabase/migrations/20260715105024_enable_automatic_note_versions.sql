drop trigger if exists notes_archive_before_update on public.notes;
create trigger notes_archive_before_update
  before update of content, last_entry_date on public.notes
  for each row
  when (
    old.content is distinct from new.content
    or old.last_entry_date is distinct from new.last_entry_date
  )
  execute function public.archive_note_before_update();
