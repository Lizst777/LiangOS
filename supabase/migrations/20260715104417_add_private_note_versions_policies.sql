create policy "users can read their own note versions"
  on public.note_versions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "users can create their own note versions"
  on public.note_versions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
