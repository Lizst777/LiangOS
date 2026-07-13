create table if not exists public.notes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  content text not null default '',
  updated_at timestamptz not null default now(),
  constraint notes_content_size_check check (octet_length(content) <= 1048576)
);

alter table public.notes enable row level security;

revoke all privileges on table public.notes from anon, authenticated;
grant select, insert, update on table public.notes to authenticated;

drop policy if exists "users can read their own note" on public.notes;
create policy "users can read their own note"
  on public.notes
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "users can create their own note" on public.notes;
create policy "users can create their own note"
  on public.notes
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "users can update their own note" on public.notes;
create policy "users can update their own note"
  on public.notes
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
