# Supabase database and data access

## Goal

Implement the initial Supabase persistence foundation for Skew News (the product is still called `biasly` in some existing project copy) without wiring the current demo UI to live data yet. Supabase must become the typed source of truth for sources, articles, analyses, pipeline logs, Oxylabs schedules, and Oxylabs schedule runs.

This phase must provide:

- a reviewable initial SQL schema;
- secure, server-only Supabase client creation;
- TypeScript database types synchronized with the SQL;
- small, typed data-access modules for the six core tables;
- environment and setup documentation;
- no scraping, scheduling API routes, AI calls, pgvector embeddings, or UI replacement.

## Skills read

- `.agents/skills/supabase/SKILL.md`
  - Checked the current Supabase changelog and current official guidance for Data API exposure, RLS, table design, JavaScript client initialization, and typed relational queries.
  - Accounted for the 2026 Data API change under which newly created tables may not be exposed automatically.

## Existing code inspected

- `AGENTS.md`
- `package.json`
- `package-lock.json`
- `.env.example`
- `README.md`
- `lib/demo-news.ts`
- `lib/demo-article-detail.ts`
- `app/page.tsx`
- `app/news/[id]/page.tsx`
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md`
- `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`

Findings:

- The project has no Supabase dependency, schema, migrations, client, generated types, or query modules.
- The home and news detail pages use demo data and should remain unchanged in this database-foundation phase.
- The project uses Next.js `16.2.11`; database access belongs in server modules and Server Components, and secrets must remain outside the client module graph.
- There is no `supabase/config.toml` or `supabase/schemas/`, so the repository does not currently use a declarative-schema or Supabase CLI migration workflow.

## Decisions and assumptions

- Treat this as the initial schema from section 7 of `AGENTS.md`; do not add the section 20 `embedding vector(1536)` column yet.
- Use UUID primary keys generated with `gen_random_uuid()` for all application tables.
- Store Oxylabs schedule IDs and job/run IDs as `text`, never JavaScript numbers, because they may exceed `Number.MAX_SAFE_INTEGER`.
- Store flexible log context, parser configuration, scheduler payloads, result summaries, and errors as `jsonb` where their shapes may evolve.
- Use Postgres checks/enums (implemented as constrained text where practical) for score bounds, percentages, allowed labels, log levels/statuses, and percentage totals.
- Make `articles.original_url` unique and also index `canonical_url` to support append-only deduplication. Preserve canonical URL as nullable because it can be absent during extraction, while `original_url`, title, image, publication date, and cleaned raw text are required for valid stored articles.
- Make `article_analyses.article_id` both a foreign key and unique so each article has at most one current analysis.
- Use `ON DELETE RESTRICT` from articles to sources and `ON DELETE CASCADE` only for records wholly owned by an article or schedule where deletion is explicitly performed outside scraping.
- Enable RLS on every public table. Do not create permissive `anon` or `authenticated` policies in this phase because Clerk, not Supabase Auth, is the authentication source and all current app access is server mediated.
- Explicitly grant required table/schema/sequence access to `service_role` so the Supabase Data API works on projects using the new restricted exposure default. Revoke table access from `anon` and `authenticated` for defense in depth.
- Use a typed service-role client with `server-only` and disabled Supabase Auth session persistence/refresh/detection. Do not create or export a browser client in this phase.
- Add `@supabase/supabase-js` as an exact/pinned runtime dependency and commit the lockfile update.
- Query helpers will throw contextual errors instead of returning unchecked `{ data, error }` tuples to callers.
- Joined-table filters will not use `.eq("foreignTable.column", ...)`; filtering will happen on the base table or safely in JavaScript as required by `AGENTS.md`.
- URL existence checks will chunk inputs to at most 15 URLs per `.in()` request.
- Pending analysis will be determined from the actual related `article_analyses` row, not `articles.analyzed_at` alone.
- No real source URLs or seed news data will be invented.
- Because there is no configured Supabase CLI/local project or connected database, deliver `supabase/schema.sql` as the canonical, idempotent Dashboard SQL Editor script. Do not claim that the remote database was changed.

## Files likely to change

- `package.json`
- `package-lock.json`
- `.env.example`
- `README.md`
- `supabase/schema.sql` (new)
- `lib/supabase/types.ts` (new)
- `lib/supabase/server.ts` (new)
- `lib/supabase/queries/sources.ts` (new)
- `lib/supabase/queries/articles.ts` (new)
- `lib/supabase/queries/analyses.ts` (new)
- `lib/supabase/queries/logs.ts` (new)
- `lib/supabase/queries/oxylabs-schedules.ts` (new)
- `lib/supabase/queries/oxylabs-schedule-runs.ts` (new)
- Optional small shared files under `lib/supabase/` for error handling, constants, or public domain result types when they materially reduce repetition.

Do not modify the home page, news details page, demo data, Clerk setup, scraping pipeline, or AI pipeline in this phase.

## Implementation requirements

### SQL schema

Create an idempotent `supabase/schema.sql` containing these tables and relationships:

1. `sources`
   - `id`, `name`, `listing_url`, optional `parser_strategy`, `is_active`, optional `logo_url`, timestamps.
   - Unique source name and listing URL.
   - Index active sources.

2. `articles`
   - `id`, `source_id`, `original_url`, optional `canonical_url`, `title`, `image_url`, `published_at`, `raw_text`, `scraped_at`, optional `analyzed_at`, timestamps.
   - Unique original URL; useful canonical URL, source, published, and analysis-state indexes.
   - Checks prevent blank required text values.

3. `article_analyses`
   - `id`, unique `article_id`, `summary`, sentiment score/label, derived bias score, bias label, left/center/right percentages, confidence, framing notes, loaded terms, disclaimer, model, timestamps.
   - `loaded_terms` should use a typed JSON-compatible representation (`text[]` preferred unless existing constraints make `jsonb` more appropriate).
   - Enforce score/confidence bounds, allowed labels, each percentage from 0–100, percentages totaling 100, and `bias_score` consistency with `(right_percentage - left_percentage) / 100` within safe numeric precision.
   - Do not include an embedding column.

4. `logs`
   - `id`, level, event/action name, message, optional source/article/schedule/run references, structured context, timestamp.
   - Add indexes for recent logs and common entity/run lookup.

5. `oxylabs_schedules`
   - `id`, `source_id`, exact external `schedule_id` as text, schedule state/status, optional cron/expression and request payload, sync timestamps, timestamps.
   - One stored schedule per source and unique external schedule ID.

6. `oxylabs_schedule_runs`
   - `id`, `oxylabs_schedule_id`, exact external run/job IDs as text where present, status, result status, counts/summary/error metadata, processing timestamps, timestamps.
   - Uniqueness must prevent reprocessing the same external run/job while allowing absent external IDs before discovery.

Add an idempotent `updated_at` trigger function and attach it to mutable tables. Add only indexes that support specified product queries and pipeline checks.

### TypeScript and client

- Add a generated-style `Database` type that exactly mirrors the SQL `public` schema, including `Row`, `Insert`, `Update`, and `Relationships` definitions for all six tables.
- Export useful aliases derived from `Database`, not duplicated handwritten shapes.
- Create a lazily initialized, typed, server-only service-role client.
- Validate required environment variables with clear server-side errors.
- Configure the service client with:
  - `persistSession: false`
  - `autoRefreshToken: false`
  - `detectSessionInUrl: false`
- Ensure importing data-access modules into a Client Component fails at build time through `server-only`.

### Data-access modules

Implement only reusable operations needed by the stated architecture:

- Sources:
  - list active sources, with optional selected source IDs/names;
  - fetch a source by ID;
  - create/update source configuration for future administrative server workflows.
- Articles:
  - list analyzed articles for the public feed with source and analysis data, ordered by publication date and bounded pagination;
  - fetch one analyzed article by ID with source and analysis;
  - check existing original/canonical URLs in chunks of at most 15;
  - insert one or multiple validated article rows append-only, using conflict-safe dedupe rather than destructive replacement;
  - mark an article analyzed only after a saved analysis;
  - list pending-analysis articles based on missing `article_analyses` rows, with configurable bounded batches.
- Analyses:
  - fetch by article ID;
  - insert/upsert a validated analysis for an article, without accepting an embedding field;
  - support the later atomic sequence by keeping analysis persistence and the analyzed timestamp operations explicit.
- Logs:
  - insert a structured log event;
  - list recent logs with bounded pagination and optional base-table filters.
- Oxylabs schedules:
  - list stored schedules with sources;
  - find by source/external schedule ID;
  - insert/update synchronization state while preserving external IDs as strings.
- Oxylabs schedule runs:
  - find already processed external run/job IDs;
  - insert/update run processing state and summaries;
  - list recent runs with bounded pagination.

Use explicit select lists instead of `select("*")` for public/article view queries. Keep mutations server-only. Return small domain result types shaped for future UI/pipeline callers.

### Environment and documentation

- Add the canonical Supabase variables to `.env.example`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Keep the service-role key clearly marked server-only.
- Update `README.md` with exact project setup:
  1. create/select a Supabase project;
  2. run `supabase/schema.sql` in Dashboard → SQL Editor;
  3. verify the six tables and RLS;
  4. copy URL, anon/publishable key, and service-role/secret key into `.env.local`;
  5. never commit `.env.local`;
  6. note that current UI still uses demo data until a separate UI integration task.
- Mention the 2026 Data API exposure setting and that the schema explicitly grants `service_role` access.

## Security requirements

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code or prefix it with `NEXT_PUBLIC_`.
- Never use Supabase Auth; Clerk remains the authentication provider.
- Enable RLS on all public tables.
- Do not grant or policy-enable browser reads or writes in this phase.
- Explicitly revoke `anon`/`authenticated` table access and grant only the server `service_role` access needed through the Data API.
- Avoid `SECURITY DEFINER`; the timestamp trigger must be an ordinary trigger function with a fixed/search-safe path where appropriate.
- Do not log credentials, environment values, full scraped article bodies, or raw provider payloads containing secrets.
- Preserve append-only scraping semantics: no article-delete/reset helper and no replace-all operation.
- Keep all external 64-bit IDs as strings end to end.
- Ensure foreign keys and uniqueness constraints enforce dedupe and referential integrity.

## Acceptance criteria

- `supabase/schema.sql` can be run more than once without destructive resets or duplicate-object failures.
- All six required tables exist with correct keys, relationships, constraints, timestamps, indexes, and RLS enabled.
- `article_analyses` has no embedding column.
- Invalid analysis scores, invalid labels, non-totaling framing percentages, and inconsistent bias scores are rejected by the database.
- Duplicate original article URLs and duplicate external schedule/run identifiers are prevented.
- The typed service client cannot enter the browser bundle and does not persist Supabase Auth sessions.
- `lib/supabase/types.ts` matches the committed schema.
- Query modules cover sources, articles, analyses, logs, schedules, and schedule runs without mixing UI, scraping, or AI logic.
- Public feed/detail queries return analyzed articles only.
- Pending-analysis logic detects the absence of an `article_analyses` row rather than trusting `analyzed_at`.
- URL existence checks never send more than 15 values to a single `.in()` filter.
- No service key, admin secret, source URL, demo seed data, or credentials are committed.
- Existing UI and Clerk behavior remain unchanged.

## Checks to run

From the project root:

```bash
npm run typecheck
npm run lint
npm run build
```

Also perform static SQL checks for:

- all six table declarations;
- all six RLS enable statements;
- no `embedding` column;
- required unique/check/foreign-key constraints;
- no permissive `anon`/`authenticated` policies;
- explicit `service_role` grants.

If a real Supabase project or local CLI is not configured, clearly report that remote SQL execution and live query verification were not possible rather than claiming success.

## Exact manual test steps expected after implementation

1. In Supabase Dashboard, open SQL Editor, paste `supabase/schema.sql`, and run it.
2. Run the same file a second time and confirm it completes without destructive changes.
3. In Table Editor, verify:
   - `sources`
   - `articles`
   - `article_analyses`
   - `logs`
   - `oxylabs_schedules`
   - `oxylabs_schedule_runs`
4. In each table’s RLS view, verify RLS is enabled and no browser policy grants anonymous writes.
5. Put the project URL, anon/publishable key, and service-role/secret key into `.env.local` using the names from `.env.example`.
6. Start the app:

   ```bash
   npm run dev
   ```

7. Confirm the existing demo home page and authenticated news detail route still load.
8. Use Dashboard SQL Editor to insert one source and one valid article, then test constraints:
   - reinsert the same `original_url` and confirm it is rejected;
   - insert an analysis whose percentages do not total 100 and confirm it is rejected;
   - insert an analysis with a valid total but inconsistent `bias_score` and confirm it is rejected;
   - insert a valid analysis and set `articles.analyzed_at`;
   - verify the stored external Oxylabs ID preserves every digit when inserted as text.
9. After a small temporary server-only smoke script or future route calls the query helpers, confirm:
   - active-source lookup returns only active rows;
   - feed/detail lookup excludes articles without analysis;
   - pending-analysis lookup returns articles with no analysis row even when `analyzed_at` was accidentally set;
   - a URL existence request with more than 15 values is chunked internally.

