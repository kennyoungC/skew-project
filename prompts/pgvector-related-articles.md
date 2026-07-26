# pgvector embeddings and Related Articles

## Goal

Enable pgvector for Biasly, store one 1,536-dimension OpenAI embedding with each
article analysis, backfill embeddings without re-running valid existing
analyses, query related articles by cosine distance, and render up to five
related articles on the news details page.

## Skills read

- `.agents/skills/supabase/SKILL.md`
- `.agents/skills/ai-sdk/SKILL.md`
- Project `AGENTS.md`
- Installed AI SDK and OpenAI provider documentation/source
- Current Supabase pgvector, vector-column, vector-index, semantic-search, and
  changelog documentation

## Existing code inspected

- `supabase/schema.sql`
- `lib/supabase/types.ts`
- `lib/supabase/server.ts`
- `lib/supabase/queries/articles.ts`
- `lib/supabase/queries/analyses.ts`
- `lib/ai/article-analyzer.ts`
- `lib/analysis/pipeline.ts`
- `lib/analysis/types.ts`
- `app/api/analyze/route.ts`
- `app/news/[id]/page.tsx`
- `components/compact-news-card.tsx`
- `lib/news/presentation.ts`
- `package.json`
- `.env.example`

## Documentation decisions

- Use the Postgres extension name `vector` without an explicit extension
  version. Current Supabase changelog guidance deprecates extension version
  pinning.
- Use `extensions.vector(1536)` because the installed OpenAI provider docs
  confirm `text-embedding-3-small` returns 1,536 dimensions by default.
- Use cosine distance (`<=>`) and a `vector_cosine_ops` index.
- Follow the project requirement to use IVFFlat even though current Supabase
  guidance generally recommends HNSW for new projects.
- Wrap cosine search in a Postgres function because PostgREST/supabase-js does
  not expose pgvector distance operators directly.

## Decisions and assumptions

- The same existing `OPENAI_API_KEY` is used for analysis and embeddings.
- Embedding model is centralized as `text-embedding-3-small`.
- Embedding input contains the article title and cleaned raw article text, not
  source reputation or analysis labels.
- Bound embedding input to a safe character limit before calling OpenAI.
- A work item is pending when:
  - no `article_analyses` row exists, or
  - an analysis row exists but `embedding` is null.
- For a new analysis, run structured analysis and embedding generation together,
  save both in the same analysis upsert, then set `analyzed_at`.
- For an existing valid analysis with a null embedding, generate and update only
  the embedding. Do not rerun or overwrite the existing analysis.
- If either structured analysis or embedding generation fails for a new
  article, do not save a partial analysis and do not set `analyzed_at`.
- If embedding backfill fails, retain the existing analysis unchanged and leave
  it eligible for a later retry.
- Related results exclude the current article, require non-null embeddings and
  analyzed articles, order by cosine distance, and are limited to five.
- No similarity threshold is imposed initially because the product requirement
  asks for the five nearest articles; the UI may show fewer when fewer embedded
  analyzed articles exist.
- Do not display raw embeddings or send them to browser components.

## Database changes

Update `supabase/schema.sql` with idempotent SQL that:

1. Enables `vector` in the `extensions` schema.
2. Adds `article_analyses.embedding extensions.vector(1536)`.
3. Adds a partial IVFFlat cosine index for non-null embeddings.
4. Adds `public.match_related_articles(...)`, a stable SQL RPC that:
   - accepts the current article ID, its embedding, and a bounded match count;
   - joins `article_analyses`, `articles`, and `sources`;
   - excludes the current article;
   - requires non-null embeddings and `articles.analyzed_at`;
   - orders directly by `embedding <=> query_embedding`;
   - returns only the card fields plus cosine similarity.
5. Uses `SECURITY INVOKER`, an empty search path, and fully qualified objects.
6. Revokes RPC execution from `PUBLIC`, `anon`, and `authenticated`, then grants
   execution only to `service_role`.

Apply the same SQL to the configured Supabase project using an available,
authorized SQL path. If no authenticated Supabase MCP/CLI/dashboard SQL session
is available, provide one copy-paste SQL block and clearly report that the live
database step remains for the user.

## Type changes

- Add nullable `embedding` to the `article_analyses` Row/Insert/Update types.
- Add the typed `match_related_articles` function arguments and return row under
  `Database.public.Functions`.
- Represent pgvector values in a way that supports both number-array writes and
  PostgREST vector serialization without using `any`.
- Keep all existing enums and relationships intact.

## AI pipeline changes

- Add a server-only embedding module using the installed Vercel AI SDK:

  ```ts
  embed({
    model: openai.embedding("text-embedding-3-small"),
    value,
    maxRetries: ...
  })
  ```

- Validate that the returned vector contains exactly 1,536 finite numbers.
- Never log embedding contents or full article text.
- Extend the pending query to retrieve enough information to distinguish:
  - analysis + embedding work;
  - embedding-only backfill.
- Avoid filtering on joined-table columns with `.eq()`. Fetch the joined
  relationship and evaluate null/missing embedding state in TypeScript.
- Ensure pagination and attempted-ID exclusion still prevent infinite loops.
- For new articles, generate the analysis and embedding concurrently when safe,
  then upsert them together.
- For existing analysis rows missing embeddings, update only `embedding`.
- Set `analyzed_at` only after both required artifacts exist.
- Extend progress and summary logging to distinguish analyzed articles,
  embeddings generated/backfilled, skipped work, and failures.
- Preserve `POST /api/analyze`, admin-secret protection, optional IDs/limit, and
  full-run batching.

## Related article data access

- Add `getRelatedArticles(articleId, embedding, limit?)` to
  `lib/supabase/queries/articles.ts`.
- Use the service-role client to call the typed RPC.
- Bound the result limit to five.
- Return a small explicit related-article type including similarity.
- Do not query when the current article has no embedding.
- Treat a missing embedding as an empty related list, not an error.

## Related Articles UI

- Load related articles on the server in `app/news/[id]/page.tsx`.
- Render a “Related Articles” section below the article body with up to five
  cards or compact story links using the existing visual language.
- Each related item links to `/news/<uuid>` and shows stored title, source,
  image, published date, AI-estimated framing distribution/label, sentiment,
  confidence, and optional similarity percentage.
- Do not render the section when the current article has no embedding or the RPC
  returns no results.
- Do not expose the current or related embedding vectors in rendered props,
  HTML, logs, or browser code.
- Keep the current Clerk protection and responsive layout unchanged.

## Security requirements

- Keep Supabase service-role and OpenAI credentials server-only.
- The vector RPC must be callable only by `service_role`.
- Use `SECURITY INVOKER`; do not introduce a public `SECURITY DEFINER` function.
- Set the function search path to empty and fully qualify table references.
- Preserve RLS and existing table grants.
- Do not add a browser endpoint for raw embeddings or similarity search.
- Render database content as text, never injected HTML.

## Files likely to change

- `supabase/schema.sql`
- `lib/supabase/types.ts`
- `lib/supabase/queries/articles.ts`
- `lib/supabase/queries/analyses.ts`
- `lib/ai/article-embedder.ts` (new)
- `lib/analysis/pipeline.ts`
- `lib/analysis/types.ts`
- `app/news/[id]/page.tsx`
- `README.md`

## Acceptance criteria

- The configured database has the `vector` extension enabled.
- `article_analyses.embedding` is nullable `vector(1536)`.
- The IVFFlat cosine index exists.
- Existing analyzed rows with null embeddings are selected for embedding-only
  backfill.
- Existing analysis fields are not regenerated during embedding-only backfill.
- New analyses save validated structured output and a valid 1,536-value
  embedding before setting `analyzed_at`.
- Related queries exclude the current article and return at most five nearest
  embedded analyzed articles.
- Details pages render related articles only when results exist.
- Embeddings and credentials never reach browser output.
- Existing scrape, sources, card feed, Clerk protection, and analysis request
  contract continue to work.

## Checks to run

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`
- Verify extension, column type/dimensions, index, function security, and grants
  using read-only SQL.
- Run the analysis route for one selected existing analysis with a null
  embedding to verify embedding-only backfill without changing its analysis
  timestamps/content beyond the intended embedding and `analyzed_at`.
- Verify the saved embedding is non-null and has 1,536 dimensions.
- Call the related-article query for one embedded article and confirm:
  - current article is excluded;
  - result count is at most five;
  - ordering is descending by similarity.
- Verify the rendered details HTML includes database-backed related article
  links and does not contain an embedding vector.

## Exact manual test steps expected after implementation

1. Apply the delivered SQL in Supabase Dashboard → SQL Editor if it was not
   applied automatically.
2. Start the app:

   ```bash
   npm run dev -- --port 3001
   ```

3. Backfill one pending embedding:

   ```bash
   curl -sS -X POST http://localhost:3001/api/analyze \
     -H 'Content-Type: application/json' \
     -H "x-biasly-admin-secret: $BIASLY_ADMIN_SECRET" \
     --data '{"limit":1}'
   ```

4. Backfill all remaining embeddings:

   ```bash
   curl -sS -X POST http://localhost:3001/api/analyze \
     -H 'Content-Type: application/json' \
     -H "x-biasly-admin-secret: $BIASLY_ADMIN_SECRET" \
     --data '{}'
   ```

5. Watch the `npm run dev` terminal for analysis and embedding progress.
6. Verify database state:

   ```sql
   select
     count(*) filter (where embedding is not null) as embedded,
     count(*) filter (where embedding is null) as missing_embeddings,
     min(vector_dims(embedding)) filter (where embedding is not null) as min_dims,
     max(vector_dims(embedding)) filter (where embedding is not null) as max_dims
   from public.article_analyses;
   ```

7. Open an embedded article from `http://localhost:3001`, sign in if Clerk
   prompts, and confirm Related Articles appears below the body with no more
   than five different stored articles.
