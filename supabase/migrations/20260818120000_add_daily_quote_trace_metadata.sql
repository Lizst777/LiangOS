alter table public.moment_traces
  add column if not exists quote_date date,
  add column if not exists quote_author text,
  add column if not exists quote_source text,
  add column if not exists quote_source_url text;

alter table public.moment_traces
  drop constraint if exists moment_traces_quote_author_check,
  add constraint moment_traces_quote_author_check
    check (quote_author is null or char_length(quote_author) <= 48),
  drop constraint if exists moment_traces_quote_source_check,
  add constraint moment_traces_quote_source_check
    check (quote_source is null or char_length(quote_source) <= 120),
  drop constraint if exists moment_traces_quote_source_url_check,
  add constraint moment_traces_quote_source_url_check
    check (quote_source_url is null or char_length(quote_source_url) <= 512);

create unique index if not exists moment_traces_user_quote_date_key
  on public.moment_traces (user_id, quote_date);

comment on column public.moment_traces.quote_date is
  'Local calendar date of the LiangOS daily quote.';
comment on column public.moment_traces.quote_source_url is
  'Optional provenance URL from the pinned local quote corpus.';
