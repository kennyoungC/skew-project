-- Skew News initial Supabase schema.
-- Safe to re-run: creates are guarded and triggers/grants are replaced idempotently.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (btrim(name) <> ''),
  listing_url text not null unique check (btrim(listing_url) <> ''),
  parser_strategy jsonb,
  is_active boolean not null default true,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete restrict,
  original_url text not null unique check (btrim(original_url) <> ''),
  canonical_url text,
  title text not null check (btrim(title) <> ''),
  image_url text not null check (btrim(image_url) <> ''),
  published_at timestamptz not null,
  raw_text text not null check (btrim(raw_text) <> ''),
  scraped_at timestamptz not null default now(),
  analyzed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.article_analyses (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null unique references public.articles(id) on delete cascade,
  summary text not null check (btrim(summary) <> ''),
  sentiment_score numeric(5,4) not null
    check (sentiment_score between -1 and 1),
  sentiment_label text not null
    check (sentiment_label in ('positive', 'neutral', 'negative')),
  bias_score numeric(5,4) not null
    check (bias_score between -1 and 1),
  bias_label text not null
    check (bias_label in ('left', 'center', 'right', 'mixed', 'unclear')),
  left_percentage smallint not null
    check (left_percentage between 0 and 100),
  center_percentage smallint not null
    check (center_percentage between 0 and 100),
  right_percentage smallint not null
    check (right_percentage between 0 and 100),
  confidence numeric(5,4) not null
    check (confidence between 0 and 1),
  framing_notes text not null,
  loaded_terms text[] not null default '{}',
  disclaimer text not null check (btrim(disclaimer) <> ''),
  model text not null check (btrim(model) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint article_analyses_percentages_total
    check (left_percentage + center_percentage + right_percentage = 100),
  constraint article_analyses_bias_score_matches_percentages
    check (
      abs(
        bias_score -
        ((right_percentage - left_percentage)::numeric / 100)
      ) <= 0.0001
    )
);

create table if not exists public.oxylabs_schedules (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null unique references public.sources(id) on delete cascade,
  schedule_id text not null unique check (btrim(schedule_id) <> ''),
  status text not null default 'active'
    check (status in ('active', 'inactive', 'pending', 'failed')),
  cron_expression text,
  request_payload jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.oxylabs_schedule_runs (
  id uuid primary key default gen_random_uuid(),
  oxylabs_schedule_id uuid not null
    references public.oxylabs_schedules(id) on delete cascade,
  external_run_id text,
  external_job_id text,
  status text not null default 'discovered'
    check (status in ('discovered', 'processing', 'completed', 'failed', 'skipped')),
  result_status text
    check (result_status is null or result_status in ('pending', 'done', 'faulted')),
  summary jsonb not null default '{}'::jsonb,
  error jsonb,
  started_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  level text not null check (level in ('debug', 'info', 'warn', 'error')),
  event text not null check (btrim(event) <> ''),
  message text not null check (btrim(message) <> ''),
  source_id uuid references public.sources(id) on delete set null,
  article_id uuid references public.articles(id) on delete set null,
  schedule_id uuid references public.oxylabs_schedules(id) on delete set null,
  schedule_run_id uuid references public.oxylabs_schedule_runs(id) on delete set null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists oxylabs_schedule_runs_external_run_unique
  on public.oxylabs_schedule_runs (oxylabs_schedule_id, external_run_id)
  where external_run_id is not null;
create unique index if not exists oxylabs_schedule_runs_external_job_unique
  on public.oxylabs_schedule_runs (oxylabs_schedule_id, external_job_id)
  where external_job_id is not null;

create index if not exists sources_active_idx
  on public.sources (name) where is_active;
create index if not exists articles_canonical_url_idx
  on public.articles (canonical_url) where canonical_url is not null;
create index if not exists articles_source_published_idx
  on public.articles (source_id, published_at desc);
create index if not exists articles_published_idx
  on public.articles (published_at desc);
create index if not exists articles_pending_analysis_idx
  on public.articles (created_at) where analyzed_at is null;
create index if not exists logs_created_at_idx
  on public.logs (created_at desc);
create index if not exists logs_source_id_idx
  on public.logs (source_id) where source_id is not null;
create index if not exists logs_article_id_idx
  on public.logs (article_id) where article_id is not null;
create index if not exists logs_schedule_id_idx
  on public.logs (schedule_id) where schedule_id is not null;
create index if not exists logs_schedule_run_id_idx
  on public.logs (schedule_run_id) where schedule_run_id is not null;
create index if not exists oxylabs_schedule_runs_recent_idx
  on public.oxylabs_schedule_runs (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sources_set_updated_at on public.sources;
create trigger sources_set_updated_at
before update on public.sources
for each row execute function public.set_updated_at();

drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at
before update on public.articles
for each row execute function public.set_updated_at();

drop trigger if exists article_analyses_set_updated_at on public.article_analyses;
create trigger article_analyses_set_updated_at
before update on public.article_analyses
for each row execute function public.set_updated_at();

drop trigger if exists oxylabs_schedules_set_updated_at on public.oxylabs_schedules;
create trigger oxylabs_schedules_set_updated_at
before update on public.oxylabs_schedules
for each row execute function public.set_updated_at();

drop trigger if exists oxylabs_schedule_runs_set_updated_at on public.oxylabs_schedule_runs;
create trigger oxylabs_schedule_runs_set_updated_at
before update on public.oxylabs_schedule_runs
for each row execute function public.set_updated_at();

alter table public.sources enable row level security;
alter table public.articles enable row level security;
alter table public.article_analyses enable row level security;
alter table public.logs enable row level security;
alter table public.oxylabs_schedules enable row level security;
alter table public.oxylabs_schedule_runs enable row level security;

revoke all on table
  public.sources,
  public.articles,
  public.article_analyses,
  public.logs,
  public.oxylabs_schedules,
  public.oxylabs_schedule_runs
from anon, authenticated;

grant usage on schema public to service_role;
grant select, insert, update, delete on table
  public.sources,
  public.articles,
  public.article_analyses,
  public.logs,
  public.oxylabs_schedules,
  public.oxylabs_schedule_runs
to service_role;

