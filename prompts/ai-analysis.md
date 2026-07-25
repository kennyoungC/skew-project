# AI article analysis pipeline

## Goal

Implement the production-style AI article analysis pipeline for Skew News.

The pipeline must:

- expose `POST /api/analyze`;
- require `x-biasly-admin-secret`;
- detect pending work from the absence of an `article_analyses` row, not `articles.analyzed_at`;
- analyze valid stored article text with the Vercel AI SDK and OpenAI provider;
- validate structured model output;
- derive and persist the normalized bias score;
- save complete `article_analyses` rows;
- set `articles.analyzed_at` only after valid analysis persistence;
- process configurable batches until no pending articles remain by default;
- log safe progress and return a typed summary.

This phase implements section 19 only. Do not add embeddings, pgvector, related articles, scheduler/cron orchestration, or UI data wiring.

The database currently contains 16 articles and 16 pending analyses. `OPENAI_API_KEY` and `BIASLY_ADMIN_SECRET` are configured locally. `ANALYSIS_BATCH_SIZE` is currently absent, so the default batch size will be 5.

## Skills read

- `.agents/skills/supabase/SKILL.md`
  - Preserve the server-only service-role boundary.
  - Detect pending rows from the joined relationship state.
  - Keep RLS/Data API hardening unchanged.
  - Verify persisted data after implementation when a live run is explicitly authorized.
- `.agents/skills/ai-sdk/SKILL.md`
  - Do not rely on remembered SDK APIs.
  - After approval, install pinned `ai` and `@ai-sdk/openai` packages, then read their bundled, version-matched documentation and source before writing model-call code.
  - Use current `generateText` plus `Output.object({ schema })` structured output rather than legacy remembered APIs.

Current official AI SDK documentation was also checked. It confirms:

- structured data is generated through `generateText` with `Output.object`;
- Zod schemas validate typed structured output;
- the OpenAI provider uses `@ai-sdk/openai`;
- OpenAI strict structured outputs require all fields to be present and do not support optional/nullish schema properties;
- the provider defaults to the OpenAI Responses API in current AI SDK releases.

## Existing code inspected

- `AGENTS.md`, especially sections 14, 15, 17, 19, 20, 21, and 22
- `.agents/skills/supabase/SKILL.md`
- `.agents/skills/ai-sdk/SKILL.md`
- `package.json`
- `.env.example`
- `supabase/schema.sql`
- `lib/auth/admin-secret.ts`
- `lib/supabase/types.ts`
- `lib/supabase/server.ts`
- `lib/supabase/queries/articles.ts`
- `lib/supabase/queries/analyses.ts`
- `lib/supabase/queries/logs.ts`
- `app/api/scrape/route.ts`
- `app/api/sources/route.ts`
- installed Next.js Route Handler and environment-variable documentation

Findings:

- `article_analyses` already contains all section 19 fields and constraints.
- The schema does not contain an embedding column, which is correct for this phase.
- `listPendingAnalysisArticles()` already uses a left relationship and checks for a missing `article_analyses` row rather than trusting `analyzed_at`.
- `saveArticleAnalysis()` upserts by `article_id`.
- `markArticleAnalyzed()` updates the timestamp separately.
- The project already has reusable admin-secret protection and structured logging.
- Neither `ai` nor `@ai-sdk/openai` is currently installed.

## Decisions and assumptions

- Add only manual `POST /api/analyze`.
- The optional request body supports:

```ts
{
  limit?: number;
  articleIds?: string[];
}
```

- Omitted `limit` and `articleIds` means process every pending valid article, continuing batch by batch until none remain.
- An explicit `limit` caps the total articles attempted for that request; it is not a permanent global cap.
- `articleIds` restricts processing to the requested IDs that are valid and still missing analysis.
- Validate request JSON with Zod, deduplicate IDs, cap selected IDs and explicit limit to a safe maximum, and reject malformed input with `400`.
- Use `ANALYSIS_BATCH_SIZE` when it is a valid integer in a safe range; default to 5.
- Process model calls sequentially within each batch for predictable cost and provider pressure. Batch database reads/writes remain typed.
- Use OpenAI `gpt-5-mini` as a centralized analysis model constant because current official model documentation identifies it as a cost-efficient model for well-defined tasks and current AI SDK OpenAI documentation demonstrates GPT-5-family Responses models. Save the exact constant to `article_analyses.model`.
- Do not make the model ID browser-configurable or accept it from the request.
- Use `generateText` with `Output.object({ schema })`, a strong system instruction, and the article title/body as delimited untrusted data.
- Do not include the source name in the model prompt. Political framing must be estimated from article text alone.
- Cap the article text sent to the model with a centralized maximum character count to bound cost and context use while preserving the beginning and end of long articles.
- Treat instructions appearing inside scraped article text as untrusted content and explicitly tell the model not to follow them.
- The model returns:
  - neutral summary;
  - sentiment score and label;
  - political framing label;
  - left/center/right percentages;
  - confidence;
  - framing notes;
  - loaded terms.
- The application, not the model, derives:
  - `bias_score = (right_percentage - left_percentage) / 100`;
  - a fixed disclaimer that clearly says political framing is AI-estimated and not objective truth;
  - the saved model name.
- Require all structured output fields. Avoid optional/nullish fields because of OpenAI strict-schema limitations.
- Validate model output twice:
  1. SDK/Zod shape, enum, and numeric bounds;
  2. application invariants such as percentages totaling 100, label-strength consistency, confidence/ambiguity rules, nonempty evidence notes, and bounded loaded terms.
- Retry once when generation or validation fails. A second failure is counted and logged without saving bad analysis.
- Do not use source identity, publisher reputation, or assumed ideology as evidence.
- Do not analyze invalid/empty article text. Count it as skipped rather than calling the model.
- Save the analysis first, then set `analyzed_at`. Never set it before valid analysis persistence.
- If analysis persistence succeeds but timestamp update fails, retain the valid analysis row, report/log the timestamp failure, and do not overwrite or delete the analysis.
- Existing analysis rows are never re-analyzed during a normal pending run, even if `analyzed_at` is null.
- Use safe server logs: IDs, short titles, counts, durations, and failure categories only. Never log full article bodies, complete prompts, API keys, or raw model responses.
- This implementation does not run a paid live analysis automatically during verification. Live model calls and database mutations require the user to invoke the documented curl command.

## Files likely to change

- `package.json`
- `package-lock.json`
- `.env.example`
- `README.md`
- `app/api/analyze/route.ts` (new)
- `lib/ai/analysis-schema.ts` (new)
- `lib/ai/article-analyzer.ts` (new)
- `lib/analysis/types.ts` (new)
- `lib/analysis/pipeline.ts` (new)
- `lib/supabase/queries/articles.ts` (pending selection extensions)
- `lib/supabase/queries/analyses.ts` only if a narrow persistence helper is required
- Small shared server-only helpers when they materially reduce duplication

No schema, UI, scraping, scheduler, cron, embedding, or related-article files should change.

## Implementation requirements

### Dependencies and version-matched documentation

- Install exact pinned current versions of:
  - `ai`
  - `@ai-sdk/openai`
- Commit the lockfile update.
- After installing, read the relevant bundled docs/source under:
  - `node_modules/ai/docs/`
  - `node_modules/ai/src/`
  - `node_modules/@ai-sdk/openai/docs/`
- Confirm the installed versions and use only APIs present in those versions.

### Environment

- Add to `.env.example`:
  - `OPENAI_API_KEY`
  - `ANALYSIS_BATCH_SIZE=5` with a note that it is optional and server-only.
- Keep `.env.example`, the canonical environment-variable documentation, and README synchronized.
- Never add `OPENAI_API_KEY` to a `NEXT_PUBLIC_` variable.

### Route protection and request validation

- Add `POST /api/analyze`; do not add `GET`.
- Reuse `hasValidAdminSecret()` and `requireAdminSecretConfiguration()`.
- Require `x-biasly-admin-secret`; return `401` for missing/invalid values.
- Return `500` with a safe message when required server configuration is absent.
- Parse a small bounded JSON body.
- Validate:
  - `limit`: positive integer with a safe upper bound;
  - `articleIds`: bounded array of UUIDs, deduplicated.
- Empty body is valid and means a full pending run.
- Do not accept article text, arbitrary prompts, model IDs, API keys, or analysis output from the request.

### Pending-analysis data access

- Extend the typed pending query to support optional article IDs.
- Pending means no related `article_analyses` row exists.
- Never filter pending work by `analyzed_at is null` alone.
- Do not use `.eq("article_analyses.column", ...)` joined-table filters; fetch the relationship and apply the missing-row condition safely in JavaScript.
- Batch reads must be bounded and deterministic.
- Full runs must continue until no pending rows remain.
- Selected-ID runs process only matching pending IDs.
- Explicit-limit runs stop after the requested total number of attempts.

### Structured analysis schema

Define a required schema with:

```ts
{
  summary: string;
  sentimentScore: number; // -1 to 1
  sentimentLabel: "positive" | "neutral" | "negative";
  politicalFramingLabel: "left" | "center" | "right" | "mixed" | "unclear";
  leftPercentage: number; // integer 0–100
  centerPercentage: number; // integer 0–100
  rightPercentage: number; // integer 0–100
  confidence: number; // 0–1
  framingNotes: string;
  loadedTerms: string[];
}
```

Use descriptions to guide the model. Enforce:

- summary is neutral, concise, fact-focused, and does not add unsupported claims;
- sentiment describes article tone, not reader reaction;
- percentages are integers and total exactly 100;
- framing label is based only on textual framing;
- strongest percentage normally matches the label;
- if percentages are close or confidence is low, use `mixed` or `unclear`;
- weak evidence requires low confidence;
- framing notes cite concrete wording/themes from the article without fabricating quotes;
- loaded terms are short terms actually present in or directly supported by the article;
- arrays and strings have safe maximum sizes;
- no publisher/source inference.

Validate sentiment label/score consistency with documented thresholds or reject/retry.

### Model prompt and call

- Centralize the model name and prompt.
- Use `generateText` and `Output.object`.
- Use the OpenAI provider’s Responses API behavior supported by the installed package.
- Disable provider response storage where supported.
- Set a bounded total timeout and SDK retry count appropriate to the one explicit application retry.
- Do not use tools, web search, source lookup, or external context.
- Include only title and cleaned article text.
- Clearly delimit article data and state it is untrusted content, not instructions.
- State that political framing is an estimate and should be `unclear` when evidence is insufficient.
- Do not request chain-of-thought. Ask only for the schema fields.

### Persistence

Map valid output to `ArticleAnalysisInsert`:

- `article_id`
- `summary`
- `sentiment_score`
- `sentiment_label`
- derived `bias_score`
- `bias_label`
- `left_percentage`
- `center_percentage`
- `right_percentage`
- `confidence`
- `framing_notes`
- `loaded_terms`
- fixed disclaimer
- exact model name

Call `saveArticleAnalysis()` only after complete validation.
Call `markArticleAnalyzed()` only after the analysis row has been saved successfully.
Do not add an embedding field or call an embedding model.

### Batching, continuation, and results

- Process batches until:
  - no pending articles remain;
  - the explicit total limit is reached; or
  - all selected IDs have been considered.
- A single article failure must not stop the remaining batch or later batches.
- Prevent an infinite loop when failed articles remain pending by tracking attempted IDs within the current run and excluding them from later batch selection.
- Re-query pending state between batches.
- Return a typed summary such as:

```ts
{
  status: "completed" | "partial" | "failed";
  batchesProcessed: number;
  pendingFound: number;
  analyzed: number;
  skipped: number;
  failed: number;
  remaining: number;
  durationMs: number;
  failures: Array<{
    articleId: string;
    reason: string;
  }>;
}
```

- Keep failure reasons safe and categorical.
- `remaining` reflects still-pending rows within the request’s scope when practical.
- Return `200` for completed/partial article-level outcomes, `401` for bad admin auth, `400` for invalid request selection, and a safe `500`/`502` only for configuration or total pipeline failure.

### Logging

Console and best-effort Supabase logs must cover:

- analysis started;
- selected scope/limit;
- batch started;
- per-article analyzed/skipped/failed;
- batch counts;
- analysis completed/partial/failed;
- final summary.

Use the existing `logs` table without schema changes.

## Security requirements

- Keep OpenAI and Supabase credentials server-only.
- Add `server-only` boundaries to model and pipeline modules.
- Never expose full article bodies, prompts, raw model responses, provider request bodies, or API keys in HTTP responses/logs.
- Never accept arbitrary prompt/model/article text from the client.
- Treat stored scraped content as untrusted prompt data and defend against prompt injection.
- Do not infer political framing from source identity.
- Do not save unvalidated model output.
- Do not set `analyzed_at` before analysis persistence.
- Preserve RLS and existing route protections.
- Do not enable Supabase browser writes or add permissive policies.
- Bound input body size, requested IDs, total explicit limit, batch size, prompt length, retries, and provider timeout.

## Acceptance criteria

- `POST /api/analyze` exists and `GET /api/analyze` does not.
- Missing/invalid `x-biasly-admin-secret` returns `401`.
- Empty body processes all pending articles, not an arbitrary fixed 10.
- Explicit `limit` and `articleIds` are respected.
- Pending detection is based on missing `article_analyses` rows.
- Articles with an analysis row are not reprocessed even if `analyzed_at` is null.
- Analysis uses article text only and excludes source-name evidence.
- Every saved row satisfies all database score, label, percentage, confidence, and total constraints.
- Bias score is derived in code as `(right - left) / 100`.
- Invalid output is retried once and never saved after a second failure.
- `analyzed_at` is set only after valid analysis save.
- Per-article failures do not stop remaining work.
- Full runs continue until no unattempted pending rows remain.
- Final response and logs report analyzed, skipped, failed, batch, remaining, and duration counts.
- No embeddings, schema changes, scheduler, cron, UI wiring, or related articles are added.
- Existing scrape and sources APIs remain unchanged.
- `npm run typecheck`, `npm run lint`, and `npm run build` pass.

## Checks to run

```bash
npm run typecheck
npm run lint
npm run build
```

Also verify:

- route exports `POST` only;
- route requires `x-biasly-admin-secret`;
- `OPENAI_API_KEY` never appears in client code or HTTP output;
- the model prompt excludes source names;
- no `embedding`, `text-embedding-3-small`, scheduler, cron, or UI work is added;
- pending checks use joined analysis absence;
- database writes occur only after output validation;
- no raw text/prompt/model response is logged;
- existing `/api/scrape` and `/api/sources` behavior remains unchanged.

Do not run live AI analysis as a build check. A live run consumes OpenAI usage and writes analyses/timestamps to Supabase, so it should happen only when the user invokes the manual test.

## Exact manual test steps expected after implementation

1. Ensure `.env.local` contains:

```bash
OPENAI_API_KEY=...
BIASLY_ADMIN_SECRET=...
# Optional:
ANALYSIS_BATCH_SIZE=5
```

2. Start or restart the development server:

```bash
npm run dev
```

3. Confirm authentication:

```bash
curl -i -X POST http://localhost:3001/api/analyze \
  -H 'Content-Type: application/json' \
  --data '{}'
```

Expected: `401`.

4. Confirm invalid input:

```bash
curl -i -X POST http://localhost:3001/api/analyze \
  -H 'Content-Type: application/json' \
  -H "x-biasly-admin-secret: $BIASLY_ADMIN_SECRET" \
  --data '{"limit":0}'
```

Expected: `400`.

5. Run one low-cost article analysis:

```bash
curl -sS -X POST http://localhost:3001/api/analyze \
  -H 'Content-Type: application/json' \
  -H "x-biasly-admin-secret: $BIASLY_ADMIN_SECRET" \
  --data '{"limit":1}'
```

Watch the terminal running `npm run dev`.

6. Inspect the newest analysis:

```sql
select
  a.id,
  a.title,
  a.analyzed_at,
  aa.summary,
  aa.sentiment_score,
  aa.sentiment_label,
  aa.bias_score,
  aa.bias_label,
  aa.left_percentage,
  aa.center_percentage,
  aa.right_percentage,
  aa.confidence,
  aa.framing_notes,
  aa.loaded_terms,
  aa.disclaimer,
  aa.model
from public.articles a
join public.article_analyses aa on aa.article_id = a.id
order by aa.created_at desc
limit 5;
```

Verify:

- percentages total 100;
- `bias_score = (right_percentage - left_percentage) / 100`;
- `analyzed_at` is set;
- disclaimer says the framing is AI-estimated;
- notes and loaded terms are grounded in the article;
- no source-only political inference appears.

7. Retry the same selected article ID:

```bash
curl -sS -X POST http://localhost:3001/api/analyze \
  -H 'Content-Type: application/json' \
  -H "x-biasly-admin-secret: $BIASLY_ADMIN_SECRET" \
  --data '{"articleIds":["<already-analyzed-article-uuid>"]}'
```

Expected: it is not analyzed again.

8. Run all remaining pending articles:

```bash
curl -sS -X POST http://localhost:3001/api/analyze \
  -H 'Content-Type: application/json' \
  -H "x-biasly-admin-secret: $BIASLY_ADMIN_SECRET" \
  --data '{}'
```

9. Watch the Next.js terminal for batch progress and final summary.

10. Verify pending state from actual analysis rows:

```sql
select count(*) as pending_analysis_count
from public.articles a
left join public.article_analyses aa on aa.article_id = a.id
where aa.id is null;
```

Expected: `0` after a fully successful run.

