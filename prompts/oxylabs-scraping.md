# Oxylabs manual scraping pipeline

## Goal

Implement the production-style manual scrape-to-insert pipeline for Skew News using the Oxylabs Web Scraper Realtime API and Supabase.

The approved initial run scope is:

- BBC News
- Fox News
- NPR
- Reuters
- The Guardian
- up to 5 valid new articles per source

The implementation must add `POST /api/scrape`, protected by the shared admin secret, and execute the canonical homepage-to-article pipeline from `AGENTS.md`. It must fetch only source homepage entry pages stored in Supabase, extract visible homepage story-card links, reject non-article URLs before spending a detail request, scrape valid detail candidates through Oxylabs, clean and validate article content, deduplicate against Supabase, append valid articles, write structured logs, and return a complete summary.

This phase is manual scraping only. Do not implement Oxylabs Scheduler, Vercel Cron, AI analysis, embeddings, or UI data wiring.

## Skills read

- `.agents/skills/oxylabs-web-scraper/SKILL.md`
  - Use the synchronous Realtime endpoint: `POST https://realtime.oxylabs.io/v1/queries`.
  - Use HTTP Basic authentication from `OXY_WSA_USERNAME` and `OXY_WSA_PASSWORD`.
  - Use `source: "universal"` with the requested URL and consume raw HTML from `results[0].content`.
  - Oxylabs Realtime is synchronous; support a long request timeout and clear provider error handling.
- `.agents/skills/supabase/SKILL.md`
  - Keep service-role access server-only.
  - Use the existing typed Supabase client and query modules.
  - Respect RLS/Data API exposure and never expose privileged credentials.
  - Verify database behavior rather than assuming writes succeeded.

Current official Oxylabs documentation was checked for the Universal source and Realtime integration. It confirms the endpoint, `universal` payload, raw HTML response shape, optional `render: "html"`, and synchronous behavior.

## Existing code inspected

- `AGENTS.md`, especially sections 7–17 and 21–22
- `.agents/skills/oxylabs-web-scraper/SKILL.md`
- `.agents/skills/supabase/SKILL.md`
- `package.json`
- `.env.example`
- `supabase/schema.sql`
- `lib/supabase/types.ts`
- `lib/supabase/server.ts`
- `lib/supabase/queries/sources.ts`
- `lib/supabase/queries/articles.ts`
- `lib/supabase/queries/logs.ts`
- `lib/supabase/queries/shared.ts`
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`

The active `sources` rows were read from Supabase:

| Source | Homepage entry page | Parser strategy |
| --- | --- | --- |
| BBC News | `https://www.bbc.com/news` | none |
| Fox News | `https://www.foxnews.com/` | none |
| NPR | `https://www.npr.org/` | none |
| Reuters | `https://www.reuters.com/` | none |
| The Guardian | `https://www.theguardian.com/us` | none |

The required environment variables `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OXY_WSA_USERNAME`, `OXY_WSA_PASSWORD`, and `BIASLY_ADMIN_SECRET` are configured locally. Their values were not displayed.

## Decisions and assumptions

- Add only the manual `POST /api/scrape` route in this phase.
- The request body may specify `sourceIds`, `sourceNames`, and `limitPerSource`; omitted values default to all active sources and 5 valid articles per source.
- For the approved first manual test, use all five active sources and `limitPerSource: 5`.
- Bound `limitPerSource` to 1–5 for cost and runtime safety in the initial pipeline.
- Use `runtime = "nodejs"` and a route maximum duration suitable for multiple synchronous Oxylabs calls, within what the installed Next.js version supports.
- Keep the route thin: authenticate, validate input, call the pipeline, map typed errors to safe HTTP responses.
- Put provider access, parsing, validation, orchestration, and route authentication in separate server-only modules.
- Install and pin `cheerio` and `zod` if absent; update the lockfile.
- Use raw HTML rather than `parse: true` because these five news homepages/detail pages do not share an Oxylabs dedicated parsed schema.
- Start with `source: "universal"` and no JavaScript render. Retry a single request with `render: "html"` only when the non-rendered result is successful but empty/structurally unusable. Do not retry authentication, quota, or invalid-request failures.
- Use an abort timeout near the documented Realtime limit and never retry more than once.
- Limit expensive detail requests: extract a bounded candidate pool per source, reject strictly before detail scraping, deduplicate candidates, check Supabase before scraping details, and stop when 5 valid new articles have been inserted for that source.
- Candidate extraction must consider anchors in visible story-card/article containers, not every page anchor. Source-specific URL rules are mandatory because all five sources have different path patterns.
- No source URL may be hardcoded as a scraping target. Source names may select a parser strategy, but the actual homepage URL always comes from Supabase.
- URL normalization must remove fragments and known tracking parameters, resolve relative URLs against the stored homepage, keep HTTP(S), reject off-domain links unless an explicitly allowed canonical publisher hostname is part of the source strategy, and preserve meaningful path/query identifiers.
- Use strict source-specific article URL checks. If uncertain, reject.
- Detail parsing should prefer JSON-LD and Open Graph metadata for title, canonical URL, image, and publication date, then fall back to source-specific DOM selectors.
- Body extraction should clone the document and remove scripts, styles, navigation, ads, subscriptions, newsletters, related/most-viewed blocks, social/share controls, captions, and other boilerplate before collecting meaningful article blocks.
- Accept body content when it has at least 3 meaningful paragraphs or at least 900 meaningful cleaned characters with a clear article title, image, publication date, and article-specific URL.
- Store clean article text only. Do not store homepage HTML, raw detail HTML, CSS, scripts, credentials, or provider payloads.
- Use existing `findExistingArticleUrls`, which chunks `.in()` filters to 15 URLs, and append-only `insertArticlesAppendOnly`.
- Handle canonical URL collisions defensively in the pipeline, even though only `original_url` is database-unique in the initial schema.
- Continue other sources and candidates after source/article-level failures. A total configuration/authentication failure should fail the run cleanly.
- Persist best-effort structured logs to `logs` without allowing a logging failure to hide or replace the primary pipeline error.
- Console logs should be neat, concise, and safe: counts and source names, never secrets or complete article bodies.

## Files likely to change

- `package.json`
- `package-lock.json`
- `.env.example`
- `README.md`
- `app/api/scrape/route.ts` (new)
- `lib/auth/admin-secret.ts` or equivalent small server-only helper (new)
- `lib/oxylabs/client.ts` (new)
- `lib/scraping/types.ts` (new)
- `lib/scraping/source-strategies.ts` (new)
- `lib/scraping/url.ts` (new)
- `lib/scraping/homepage-parser.ts` (new)
- `lib/scraping/article-parser.ts` (new)
- `lib/scraping/pipeline.ts` (new)
- Small testable helpers under `lib/scraping/` where they improve separation
- Existing Supabase query modules only if a narrowly required helper is missing

No schema change is expected. Do not alter the current UI, demo data, Clerk routes, scheduler tables, analysis modules, or pages.

## Implementation requirements

### Dependencies and configuration

- Add exact pinned versions of `cheerio` and `zod`.
- Add these canonical server-only values to `.env.example` and keep the table/documentation synchronized:
  - `OXY_WSA_USERNAME`
  - `OXY_WSA_PASSWORD`
  - `BIASLY_ADMIN_SECRET`
- Document that credentials and the admin secret must be in `.env.local` and must never use `NEXT_PUBLIC_`.

### Admin-secret protection

- `POST /api/scrape` must require `x-biasly-admin-secret`.
- Compare it against `BIASLY_ADMIN_SECRET`.
- Return `401` for missing/invalid credentials.
- Do not accept the secret in query parameters or request JSON.
- Use a timing-safe comparison where inputs permit it.
- Do not expose the configured value in errors or logs.

### Request validation

Validate the optional JSON body with Zod:

```ts
{
  sourceIds?: string[];
  sourceNames?: string[];
  limitPerSource?: number;
}
```

- Reject malformed JSON or invalid values with `400`.
- Deduplicate selectors.
- If both IDs and names are supplied, require sources to match both filters consistently with the existing source query behavior, or reject ambiguous empty selection.
- Return a clear `400` when requested sources do not resolve to active database rows.
- Default to all active sources and 5 valid articles per source.

### Oxylabs client

- Use `POST https://realtime.oxylabs.io/v1/queries`.
- Build Basic Auth from `OXY_WSA_USERNAME` and `OXY_WSA_PASSWORD` only on the server.
- Payload:

```json
{
  "source": "universal",
  "url": "<Supabase URL>",
  "user_agent_type": "desktop_chrome"
}
```

- Parse and validate the provider response before reading `results[0].content`.
- Require a successful provider response and usable HTML content.
- Capture provider status codes in safe typed errors.
- Retry once with `render: "html"` only for a successful-but-empty/unusable page.
- Use an abort timeout and always clear it.
- Never include credentials or full provider responses in thrown messages.

### Homepage candidate extraction

- Parse only the retrieved stored homepage HTML.
- Identify likely visible story-card/article anchors through semantic container/tag/class signals and headline text.
- Reject anchors from `nav`, `header`, `footer`, menus, account areas, and non-content modules.
- Reject the canonical non-article list:
  - categories/sections
  - topics/tags
  - authors
  - search
  - navigation/menu/footer
  - shows/programs/podcasts
  - live pages
  - games
  - product/review/shopping
  - corporate/support
  - newsletter/subscription
  - video-only pages without a full article
- Normalize and deduplicate URLs.
- Apply strict source-specific patterns for BBC News, Fox News, NPR, Reuters, and The Guardian.
- Preserve candidate order from the homepage, cap the pool to a centralized safe number, and include rejection reasons in counters.
- Never crawl a section/listing page to discover additional candidates.

### Pre-detail dedupe

- Query Supabase for both candidate original and canonical URLs before detail scraping.
- Use no more than 15 values in a single `.in()` filter.
- Skip stored duplicates and count them.
- Deduplicate across sources and within the current run as well as against the database.

### Article detail parsing and validation

- Scrape each accepted candidate detail URL through the same Oxylabs client.
- Extract:
  - original URL
  - canonical URL
  - source ID
  - article-specific title
  - image URL
  - published timestamp
  - cleaned raw article text
  - scraped timestamp
- Prefer JSON-LD `NewsArticle`/`Article` metadata and Open Graph/article meta tags, with source-specific DOM fallbacks.
- Normalize dates to valid ISO timestamps.
- Normalize image/canonical URLs against the article URL.
- Reject generic titles and canonical URLs matching the non-article list.
- Clean article text before validation.
- Split one large body block by meaningful DOM blocks or sentence boundaries where necessary.
- Require image URL and publication date.
- Require either 3 meaningful paragraphs or 900 meaningful characters.
- Reject bodies dominated by unrelated headlines, captions, sponsor text, biographies, navigation, ads, CSS, scripts, or repeated labels.
- Do not save partial/invalid articles.

### Insert behavior

- Insert valid articles append-only.
- Never delete, reset, replace, or truncate existing articles.
- Use `original_url` conflict safety and canonical URL run/database dedupe.
- Stop a source when it reaches the requested number of successfully inserted valid articles, not merely scraped candidates.
- `analyzed_at` remains null.

### Logging and summary

Console and best-effort database logging must cover:

- scrape started
- selected sources
- per-source start
- homepage fetched
- candidates found
- candidates rejected before detail scrape
- duplicates skipped
- detail pages scraped
- articles inserted
- articles rejected after validation
- source-level errors
- scrape completed or failed

Return a typed summary with:

```ts
{
  status: "completed" | "partial" | "failed";
  sourcesChecked: number;
  candidatesFound: number;
  candidatesRejected: number;
  duplicatesSkipped: number;
  detailPagesScraped: number;
  articlesInserted: number;
  articlesRejected: number;
  articlesFailed: number;
  durationMs: number;
  rejectionReasons: Record<string, number>;
  sources: Array<{
    sourceId: string;
    sourceName: string;
    candidatesFound: number;
    detailPagesScraped: number;
    articlesInserted: number;
    duplicatesSkipped: number;
    rejected: number;
    failed: number;
  }>;
}
```

- Use consistent camelCase in the HTTP JSON response.
- Do not return full HTML, raw article bodies, credentials, or provider responses.
- A partial run should still return its completed work and counts.
- Use an appropriate non-2xx response only for request/auth/configuration errors or a total pipeline failure; article/source-level failures should normally produce a `200` partial summary.

## Security requirements

- Keep Oxylabs credentials, Supabase service-role key, and admin secret server-only.
- Add `server-only` boundaries to provider, parsing orchestration, and mutation modules.
- Never accept arbitrary target URLs from the API request; only scrape active source homepage URLs and derived article candidates.
- Enforce HTTP(S), domain allowlisting, normalization, and source-specific candidate rules to prevent SSRF/open-proxy behavior.
- Never follow candidate links to private/local/link-local IPs or non-public hostnames.
- Do not expose raw provider errors that may contain request or account details.
- Cap body size, candidate count, per-source insert limit, parallelism, and request duration.
- Use conservative bounded concurrency or sequential detail processing to avoid unexpected Oxylabs cost spikes.
- Do not run scraping from browser code.
- Do not log secrets or full scraped content.
- Preserve RLS and use the existing service-role client only on the server.

## Acceptance criteria

- `POST /api/scrape` is the only scrape trigger and rejects missing/invalid admin secrets with `401`.
- The route defaults to all active Supabase sources and 5 inserted valid articles per source.
- The approved five-source request resolves the exact current active rows from Supabase.
- Homepage and detail fetches use Oxylabs Realtime `universal`, not direct target `fetch`.
- Actual homepage URLs come from Supabase and arbitrary request URLs cannot be scraped.
- Only visible homepage story-card candidates are considered.
- Source-specific checks reject categories, programs, podcasts, live pages, games, shopping, and other non-articles before detail scraping.
- Existing URLs are queried in chunks of at most 15 and are not re-scraped.
- Inserted rows always have a real article title, image URL, published timestamp, meaningful cleaned body, and source reference.
- Articles remain append-only and duplicates are not inserted.
- `analyzed_at` remains null after scraping.
- Other sources continue after isolated errors.
- Terminal logs show safe per-source progress and a final summary.
- The response contains the required summary counters and grouped rejection reasons.
- No UI, AI, scheduler, cron, or database schema work is added.
- `npm run typecheck`, `npm run lint`, and `npm run build` pass.

## Checks to run

From the project root:

```bash
npm run typecheck
npm run lint
npm run build
```

Also verify:

- route exports `POST` and not `GET`;
- route requires `x-biasly-admin-secret`;
- no `NEXT_PUBLIC_` Oxylabs/admin variables exist;
- no direct target-site fetch exists outside the Oxylabs API client;
- no arbitrary URL is accepted from request JSON;
- every `.in()` URL call is capped at 15;
- no delete/truncate/reset operation exists;
- no AI, scheduler, or UI files changed.

If live scraping is run, first confirm the user-authorized scope remains all five active sources and at most 5 valid articles per source. Live scraping consumes Oxylabs usage and writes new rows to Supabase, so do not run it merely as a build check without explicit approval for that external mutation.

## Exact manual test steps expected after implementation

1. Ensure `.env.local` contains:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OXY_WSA_USERNAME=...
OXY_WSA_PASSWORD=...
BIASLY_ADMIN_SECRET=...
```

2. Start the development server and watch its terminal:

```bash
npm run dev
```

3. Confirm missing-secret protection:

```bash
curl -i -X POST http://localhost:3000/api/scrape \
  -H 'Content-Type: application/json' \
  --data '{"sourceNames":["BBC News"],"limitPerSource":1}'
```

Expected: `401`.

4. Confirm invalid input handling:

```bash
curl -i -X POST http://localhost:3000/api/scrape \
  -H 'Content-Type: application/json' \
  -H "x-biasly-admin-secret: $BIASLY_ADMIN_SECRET" \
  --data '{"limitPerSource":0}'
```

Expected: `400`.

5. Run one low-cost source smoke test:

```bash
curl -sS -X POST http://localhost:3000/api/scrape \
  -H 'Content-Type: application/json' \
  -H "x-biasly-admin-secret: $BIASLY_ADMIN_SECRET" \
  --data '{"sourceNames":["BBC News"],"limitPerSource":1}'
```

Watch the Next.js terminal for progress logs and inspect the returned summary.

6. Verify the inserted row in Supabase:

```sql
select
  a.id,
  s.name as source,
  a.original_url,
  a.canonical_url,
  a.title,
  a.image_url,
  a.published_at,
  length(a.raw_text) as raw_text_length,
  a.scraped_at,
  a.analyzed_at
from public.articles a
join public.sources s on s.id = a.source_id
order by a.scraped_at desc
limit 10;
```

Expected: valid article data, meaningful cleaned text, and `analyzed_at is null`.

7. Repeat the same one-source curl command.

Expected: the previously inserted URL is counted under `duplicatesSkipped`; no duplicate row is added.

8. Run the approved five-source request:

```bash
curl -sS -X POST http://localhost:3000/api/scrape \
  -H 'Content-Type: application/json' \
  -H "x-biasly-admin-secret: $BIASLY_ADMIN_SECRET" \
  --data '{
    "sourceNames":["BBC News","Fox News","NPR","Reuters","The Guardian"],
    "limitPerSource":5
  }'
```

9. Watch the Next.js terminal throughout. Confirm it reports source starts, homepage/candidate counts, rejections, duplicates, detail scraping, inserts, source-level errors, and the final summary.

10. Verify no invalid article rows were saved by reviewing the newest records:

```sql
select
  s.name,
  a.title,
  a.original_url,
  a.canonical_url,
  a.image_url,
  a.published_at,
  length(a.raw_text) as raw_text_length
from public.articles a
join public.sources s on s.id = a.source_id
order by a.scraped_at desc
limit 30;
```

Reject the implementation if rows are homepages, categories, topics, programs, podcasts, games, live feeds, shopping/product pages, missing images/dates, or contain webpage/CSS/navigation dumps.

