# Oxylabs Scheduler and automatic hourly pipeline

## Goal

Implement the complete Oxylabs Scheduler integration and Vercel Cron pipeline for biasly:

- create/sync one hourly Oxylabs homepage schedule per active Supabase source;
- list stored schedules and recent schedule runs;
- process only completed scheduled homepage jobs into articles through the existing scrape-to-insert rules;
- provide an admin-protected manual processing endpoint;
- run scheduled-result processing and then AI analysis automatically at 15 minutes past every hour;
- preserve exact Oxylabs 64-bit identifiers as strings;
- deactivate orphaned Oxylabs schedules so they do not continue billing.

This is a server-only pipeline feature. Do not add UI.

## Skills read

- `.agents/skills/oxylabs-web-scraper/SKILL.md`
- `.agents/skills/supabase/SKILL.md`

## Current documentation consulted

- Oxylabs Scheduler documentation:
  `https://developers.oxylabs.io/scraping-solutions/web-scraper-api/features/scheduler`
- Oxylabs Push-Pull result retrieval documentation:
  `https://developers.oxylabs.io/scraping-solutions/web-scraper-api/integration-methods/push-pull`
- Vercel Cron documentation:
  `https://vercel.com/docs/cron-jobs`
  and `https://vercel.com/docs/cron-jobs/manage-cron-jobs`
- Local Next.js 16.2.11 docs:
  `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
  and
  `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`
- Supabase changelog index was requested as required by the skill. The direct
  changelog fetch was unavailable; no scheduler-specific Supabase API is being
  introduced, and the implementation must use the existing pinned
  `@supabase/supabase-js` 2.90.1 project patterns.

## Existing code inspected

- `app/api/scrape/route.ts`
- `app/api/analyze/route.ts`
- `lib/auth/admin-secret.ts`
- `lib/oxylabs/client.ts`
- `lib/scraping/pipeline.ts`
- `lib/scraping/types.ts`
- `lib/scraping/homepage-parser.ts`
- `lib/scraping/article-parser.ts`
- `lib/scraping/source-strategies.ts`
- `lib/analysis/pipeline.ts`
- `lib/supabase/server.ts`
- `lib/supabase/types.ts`
- `lib/supabase/queries/sources.ts`
- `lib/supabase/queries/articles.ts`
- `lib/supabase/queries/logs.ts`
- `lib/supabase/queries/oxylabs-schedules.ts`
- `lib/supabase/queries/oxylabs-schedule-runs.ts`
- `supabase/schema.sql`
- `.env.example`
- `package.json`

The database schema, generated-style types, and initial schedule/run query
modules already exist. There are no scheduler API routes, scheduled processing
pipeline, cron route, or `vercel.json`.

## Active sources inspected

The configured Supabase project currently has these active sources:

- BBC News
- Fox News
- NPR
- Reuters
- The Guardian

Use all active sources for schedule sync. Always load their current
`listing_url` values from Supabase; never hardcode URLs.

## Decisions and assumptions

- Create one Oxylabs schedule per active source, containing only that source's
  stored homepage URL.
- Oxylabs schedule cron is `0 * * * *` (top of each hour).
- Vercel Cron is `15 * * * *` UTC and calls `/api/cron/pipeline`.
- The Scheduler API requires `end_time`. Generate a bounded future UTC end time
  (for example, approximately one year ahead) when creating a schedule and
  persist the exact request payload. A later sync may replace an expired,
  inactive, failed, missing, or materially mismatched schedule.
- Use `source: "universal"` for homepage schedule items. Do not enable parsed
  output because the shared homepage parser needs HTML.
- Existing valid, matching schedule rows should be reused; sync must be
  idempotent and must not create duplicates on every call.
- If an active source lacks a local schedule row, create its schedule.
- If a stored source becomes inactive, deactivate its external schedule and
  mark the row inactive. Do not delete history.
- After creation/sync, list all external Oxylabs schedule IDs and deactivate
  every external schedule not represented by the currently stored schedule
  IDs. Treat all IDs as decimal strings.
- Use the Scheduler `/runs` endpoint, never `/jobs`, to discover processable
  jobs. Fetch results only for jobs whose `result_status` is exactly `done`.
- Scheduler job results are homepage HTML inputs only; never save the homepage
  itself as an article.
- Process each completed job idempotently, recording it in
  `oxylabs_schedule_runs`. Already completed/skipped job IDs must not be
  processed again.
- Refactor the existing manual scraper only as much as needed to share a
  homepage-HTML-to-articles function. Manual scraping continues to fetch live
  homepage HTML. Scheduled processing supplies fetched job-result HTML. Both
  paths must retain the same extraction, URL filtering, chunked dedupe,
  validation, append-only insertion, and summary logging behavior.
- Use the existing default limit of up to five valid articles per source for
  scheduled processing.
- The cron pipeline always attempts analysis after scheduled processing, even
  when processing throws or returns a failed summary.
- In production, cron authorization is the exact
  `Authorization: Bearer ${CRON_SECRET}` header Vercel sends. Reject missing
  configuration or mismatches with `401`. In local development only
  (`NODE_ENV === "development"`), skip this check as required by `AGENTS.md`.
- Admin action routes use `x-biasly-admin-secret`; read-only list routes do not
  start work. Keep all schedule data access server-side.
- Do not add `CRON_SECRET` to `.env.local` or `.env.example`; Vercel injects it.
  Keep the explanatory environment-variable documentation in `AGENTS.md` as
  the canonical source.

## Files likely to change

- `lib/oxylabs/client.ts` or a new focused
  `lib/oxylabs/scheduler-client.ts`
- `lib/scraping/pipeline.ts`
- a new focused scheduler processing/orchestration module under
  `lib/scraping/` or `lib/oxylabs/`
- `lib/supabase/queries/oxylabs-schedules.ts`
- `lib/supabase/queries/oxylabs-schedule-runs.ts`
- `app/api/oxylabs/schedules/route.ts`
- `app/api/oxylabs/scheduled-results/process/route.ts`
- `app/api/oxylabs/runs/route.ts`
- `app/api/cron/pipeline/route.ts`
- `vercel.json`
- `supabase/schema.sql` and `lib/supabase/types.ts` only if inspection during
  implementation proves a schema/type correction is necessary

Do not change UI files.

## Implementation requirements

### 1. Oxylabs Scheduler client

- Keep it `server-only`.
- Use Basic Auth from `OXY_WSA_USERNAME` and `OXY_WSA_PASSWORD`.
- Implement focused calls for:
  - `POST https://data.oxylabs.io/v1/schedules`
  - `GET https://data.oxylabs.io/v1/schedules`
  - `GET https://data.oxylabs.io/v1/schedules/{id}`
  - `GET https://data.oxylabs.io/v1/schedules/{id}/runs`
  - `PUT https://data.oxylabs.io/v1/schedules/{id}/state`
  - `GET https://data.oxylabs.io/v1/queries/{jobId}/results`
- Add bounded timeouts and safe provider error categories/messages.
- Never include credentials or raw provider response bodies in user-facing
  errors or logs.
- Read raw response text before parsing any response that contains schedule or
  job IDs.
- Extract `schedule_id`, schedule-list IDs, `run_id`, and job `id` digit
  sequences from raw text into strings before ordinary JSON parsing can lose
  precision. Never round-trip them through `number`.
- Validate non-ID response fields with Zod or explicit typed guards.
- Accept Oxylabs `done`, `pending`, and `faulted` result statuses. Do not fetch
  results for pending or faulted jobs.
- Extract usable raw HTML from the job result response, enforcing the same
  reasonable response-size and HTML-quality bounds as the realtime client.

### 2. Schedule sync

- `POST /api/oxylabs/schedules`
- Require a valid `x-biasly-admin-secret` header and no browser secret exposure.
- Load all active sources from Supabase.
- Create/reuse one hourly schedule per active source using its current
  `listing_url`.
- Persist exact string schedule ID, status, cron expression, request payload,
  and `last_synced_at`.
- Reconcile inactive/mismatched stored schedules safely.
- After any needed creations, call the external list-schedules endpoint,
  compare exact string IDs with the schedule IDs currently represented in the
  database, and deactivate orphans with `PUT /state`.
- Return a typed summary containing counts and per-source outcomes:
  sources checked, created, reused, replaced/deactivated, failed, and orphan
  schedules deactivated.
- Log concise console and database events without credentials.

### 3. Schedule and run reads

- `GET /api/oxylabs/schedules` returns stored schedule rows joined to their
  source metadata using the existing service-role query module.
- `GET /api/oxylabs/runs` returns recent stored processing runs with bounded
  `limit`, `offset`, and optional schedule/status filters.
- Validate query parameters and return `400` for invalid values.
- These are status/read routes only and must not call Oxylabs or start work.

### 4. Shared scheduled-result processing

- Add a reusable scheduled-results pipeline that:
  1. loads stored active schedules and associated active sources;
  2. calls `/runs` for each exact external schedule ID;
  3. considers only jobs with `result_status === "done"`;
  4. skips job IDs already stored as completed, processing, or skipped;
  5. creates/updates a local `oxylabs_schedule_runs` row around each attempt;
  6. fetches each completed job's homepage HTML from `/queries/{jobId}/results`;
  7. sends that HTML into the same homepage candidate/detail article pipeline
     used by manual scraping;
  8. records completed/failed status, result status, timestamps, typed summary,
     and safe error context;
  9. emits the canonical scrape summary and rejection reason counts.
- Concurrency must remain modest and deterministic; avoid a provider/database
  request burst across all schedules.
- Do not duplicate article parser, validator, URL strategy, URL existence
  chunking, or append-only insertion rules.
- Ensure processing retries are safe after partial failures and concurrent
  invocations cannot knowingly double-process an already claimed job.

### 5. Manual process route

- `POST /api/oxylabs/scheduled-results/process`
- Require `x-biasly-admin-secret`.
- Accept an empty JSON body for all eligible schedules. If a small optional
  source/schedule selector is supported, validate it strictly and default to
  all.
- Return the scheduled processing summary using an appropriate `200`, `400`,
  `401`, `500`, or `502` response.

### 6. Automatic cron pipeline

- Add `vercel.json` with:

  ```json
  {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "crons": [
      {
        "path": "/api/cron/pipeline",
        "schedule": "15 * * * *"
      }
    ]
  }
  ```

- Add `GET /api/cron/pipeline`, Node.js runtime, dynamic execution, and a
  duration configuration consistent with existing long-running routes.
- Production authorization:
  - require configured `CRON_SECRET`;
  - compare `Authorization` to `Bearer ${CRON_SECRET}` safely;
  - reject missing/invalid auth with `401`;
  - do not accept `BIASLY_ADMIN_SECRET`.
- Development authorization: allow local invocation without `CRON_SECRET`.
- Run scheduled result processing first.
- Always run `runArticleAnalysisPipeline({})` in a `finally`-style flow even if
  scheduled processing fails, so pre-existing pending articles are analyzed.
- Return a combined, typed JSON summary with independent processing and
  analysis results/errors and an overall status.
- Keep detailed progress in the Next.js/Vercel server logs.

### 7. Persistence and logging

- Use the existing Supabase service-role client only in server modules.
- Preserve schedule/run IDs as `text`/TypeScript `string`.
- Keep RLS enabled and do not grant schedule/log data to browser roles.
- Use existing query modules and `createLog`.
- Do not use joined-table `.eq("foreign.column", value)` filters.
- Avoid destructive deletes of schedules or history.

## Security requirements

- Never expose Oxylabs credentials, Supabase service-role key, OpenAI API key,
  admin secret, or cron secret to client code or responses.
- Never put secrets in URLs or committed files.
- Use timing-safe comparison for configured secrets where practical.
- Keep all Oxylabs, OpenAI, schedule processing, and privileged Supabase calls
  in server-only modules.
- Bound request bodies, query parameters, external response sizes, provider
  calls, and timeouts.
- Sanitize persisted error context and logs.
- Do not log raw HTML, credentials, authorization headers, or full provider
  responses.
- Maintain append-only article behavior and exact URL dedupe.

## Acceptance criteria

- All five currently active sources can be synced into one external hourly
  homepage schedule each without hardcoded URLs.
- Repeating the sync does not create duplicate schedules when stored schedules
  remain valid.
- External schedules absent from the current database schedule set are
  deactivated.
- No Oxylabs schedule or job ID is ever represented as a JavaScript number.
- Processing uses `/runs`, only fetches `done` results, and ignores pending or
  faulted jobs.
- A completed scheduled homepage result runs through the same candidate
  filtering, detail scraping, validation, cleanup, dedupe, append-only insert,
  and summary logging as manual scraping.
- The same completed external job cannot be successfully processed twice.
- Schedule and run list endpoints return bounded stored status data.
- Manual processing is admin-secret protected.
- Vercel Cron invokes the pipeline at minute 15 of every UTC hour.
- Production cron requests without the correct Bearer secret receive `401`;
  local development can invoke the route without adding `CRON_SECRET`.
- Analysis runs even when scheduled-result processing fails.
- No pipeline secrets reach browser code.
- Existing manual scrape and analysis endpoints retain their behavior.

## Checks to run

Run from the project root and report exact outcomes:

```bash
npm run typecheck
npm run lint
npm run build
```

Also perform safe route/auth smoke checks against `npm run dev`. Do not call the
schedule sync endpoint against live Oxylabs without making it explicit that it
creates billable recurring schedules.

## Exact manual test steps expected after implementation

1. Ensure `.env.local` contains valid Supabase, Oxylabs, OpenAI, and
   `BIASLY_ADMIN_SECRET` values. Do not add `CRON_SECRET` locally.
2. Apply `supabase/schema.sql` in Supabase Dashboard SQL Editor only if the
   implementation changes schema requirements.
3. Start the server and watch its terminal:

   ```bash
   npm run dev
   ```

4. Confirm the active sources:

   ```bash
   curl -sS http://localhost:3000/api/sources
   ```

5. Create/sync live Oxylabs schedules (this is a billable recurring external
   action and should be run only when ready):

   ```bash
   curl -sS -X POST http://localhost:3000/api/oxylabs/schedules \
     -H "x-biasly-admin-secret: $BIASLY_ADMIN_SECRET" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

6. List stored schedules:

   ```bash
   curl -sS http://localhost:3000/api/oxylabs/schedules
   ```

7. After Oxylabs has produced a completed hourly run, manually process results:

   ```bash
   curl -sS -X POST \
     http://localhost:3000/api/oxylabs/scheduled-results/process \
     -H "x-biasly-admin-secret: $BIASLY_ADMIN_SECRET" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

8. List recent persisted runs:

   ```bash
   curl -sS \
     "http://localhost:3000/api/oxylabs/runs?limit=20&offset=0"
   ```

9. Invoke the full cron pipeline locally; development intentionally skips
   `CRON_SECRET` validation:

   ```bash
   curl -sS http://localhost:3000/api/cron/pipeline
   ```

10. Confirm an action route rejects a missing admin secret:

    ```bash
    curl -i -X POST \
      http://localhost:3000/api/oxylabs/scheduled-results/process \
      -H "Content-Type: application/json" \
      -d '{}'
    ```

11. Watch the Next.js terminal for schedule sync, `/runs` discovery, completed
    job processing, canonical scrape summaries, and analysis batch/final
    summaries.
12. Confirm inserted articles in Supabase are valid article detail pages, not
    source homepages/listings, and that their analyses appear after the cron
    pipeline.
13. In Vercel, configure a production `CRON_SECRET` of at least 16 random
    characters, deploy, and verify the Cron Jobs dashboard shows
    `/api/cron/pipeline` at `15 * * * *`. Vercel sends it automatically as
    `Authorization: Bearer <secret>`.
