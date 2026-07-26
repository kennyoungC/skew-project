-- Apply in Supabase Dashboard -> SQL Editor for an existing Biasly database.

create extension if not exists vector with schema extensions;

alter table public.article_analyses
  add column if not exists embedding extensions.vector(1536);

set maintenance_work_mem = '64MB';
drop index if exists public.article_analyses_embedding_ivfflat_idx;
create index article_analyses_embedding_ivfflat_idx
  on public.article_analyses
  using ivfflat (embedding extensions.vector_cosine_ops)
  with (lists = 1)
  where embedding is not null;
reset maintenance_work_mem;

create or replace function public.match_related_articles(
  query_article_id uuid,
  query_embedding extensions.vector(1536),
  match_count integer default 5
)
returns table (
  id uuid,
  title text,
  image_url text,
  published_at timestamptz,
  source_name text,
  sentiment_label text,
  bias_label text,
  left_percentage smallint,
  center_percentage smallint,
  right_percentage smallint,
  confidence numeric,
  similarity double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    a.id,
    a.title,
    a.image_url,
    a.published_at,
    s.name as source_name,
    aa.sentiment_label,
    aa.bias_label,
    aa.left_percentage,
    aa.center_percentage,
    aa.right_percentage,
    aa.confidence,
    1 - (
      aa.embedding OPERATOR(extensions.<=>) query_embedding
    ) as similarity
  from public.article_analyses aa
  join public.articles a on a.id = aa.article_id
  join public.sources s on s.id = a.source_id
  where aa.embedding is not null
    and aa.article_id <> query_article_id
    and a.analyzed_at is not null
  order by aa.embedding OPERATOR(extensions.<=>) query_embedding
  limit least(greatest(match_count, 1), 5);
$$;

revoke all on function public.match_related_articles(
  uuid,
  extensions.vector,
  integer
) from public, anon, authenticated;
grant execute on function public.match_related_articles(
  uuid,
  extensions.vector,
  integer
) to service_role;

notify pgrst, 'reload schema';
