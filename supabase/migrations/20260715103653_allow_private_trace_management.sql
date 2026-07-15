grant update, delete on table public.moment_traces to authenticated;

drop policy if exists "users can update their own traces" on public.moment_traces;
create policy "users can update their own traces"
  on public.moment_traces
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "users can delete their own traces" on public.moment_traces;
create policy "users can delete their own traces"
  on public.moment_traces
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
