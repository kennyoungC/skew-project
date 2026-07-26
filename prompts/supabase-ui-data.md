# Supabase-backed article UI

## Goal

Replace demo article data on the home feed and news details route with analyzed
articles stored in Supabase. Keep the existing minimal responsive visual system
while ensuring the UI displays stored data only.

## Skills read

- `.agents/skills/supabase/SKILL.md`
- Project `AGENTS.md`
- Bundled Next.js 16.2 data-fetching, page, and dynamic-route documentation

## Existing code inspected

- `app/page.tsx`
- `app/news/[id]/page.tsx`
- `components/compact-news-card.tsx`
- `components/news-card.tsx`
- `components/bias-meter.tsx`
- `lib/demo-news.ts`
- `lib/demo-article-detail.ts`
- `lib/supabase/queries/articles.ts`
- `lib/supabase/server.ts`
- `lib/supabase/types.ts`
- `proxy.ts`

## Decisions and assumptions

- “Lead/load articles from the database” means wire both the home cards and the
  existing article details page to Supabase.
- Only articles with a saved `article_analyses` row appear in the public feed.
- Reads happen directly in async Server Components through the existing
  server-only service-role query layer. No service-role credential reaches the
  browser.
- Keep `/news/[id]` protected by the existing Clerk middleware.
- Database fields are the source of truth. Do not invent category, region,
  author, caption, credit, source count, or multi-source comparison data because
  those fields are not present in the schema.
- Each stored row is one source article, so wording must describe AI analysis of
  that article rather than a comparison across multiple sources.
- Use `published_at` for dates and derive read time from `raw_text` only.
- Render `raw_text` as paragraphs using conservative blank-line splitting with a
  safe fallback for single-block text.
- Related Articles remains out of scope until the pgvector work in `AGENTS.md`
  section 20 is implemented.
- Demo data can remain for `/design-system`, but production home/detail routes
  must not import it.
- No database schema or RLS changes are required.

## Files likely to change

- `app/page.tsx`
- `app/news/[id]/page.tsx`
- `app/loading.tsx`
- `app/news/[id]/loading.tsx`
- `components/compact-news-card.tsx`
- New small presentation/formatting module under `lib/news/` if useful
- `README.md`

## Implementation requirements

### Data access

- Reuse `listAnalyzedArticles` for the home feed and
  `getAnalyzedArticleById` for details.
- Keep queries server-only and select only analyzed rows using the existing
  `article_analyses!inner` relationship.
- Sort home articles newest first and use a bounded initial feed limit.
- Return Next.js `notFound()` for unknown or unanalyzed article IDs.
- Avoid joined-table `.eq()` filters, per the project Supabase rule.

### Home page

- Make the page an async Server Component.
- Replace the hardcoded `topNews` array with Supabase results.
- Map each row to a typed card view model or let the card consume the analyzed
  query type directly.
- Every card must show:
  - title
  - source name
  - stored image
  - published date
  - sentiment label
  - AI-estimated framing label
  - left, center, and right percentages
  - confidence when available
- Link image and title to the real `/news/<uuid>` route.
- Preserve the current three-column responsive grid and restrained card style.
- Add a useful empty state when there are no analyzed articles.
- Do not fall back to demo articles when Supabase is empty or unavailable.

### Details page

- Load the article by UUID from Supabase in both page rendering and metadata.
- Display the stored title, source, image, published date, estimated read time,
  and cleaned article text.
- Display the complete stored analysis:
  - summary
  - sentiment label and score
  - AI-estimated framing label
  - left/center/right percentages
  - confidence
  - framing notes
  - loaded terms
  - disclaimer
  - model name
- Remove demo-only and misleading claims such as “12 sources,” source weighting,
  fake authors, fake photo credits, and fixed generation dates.
- Link to the original article URL in a clear “Read original” action.
- Keep the existing responsive two-column desktop layout and single-column
  mobile layout.
- Do not add scraping, analysis, mutations, feedback submission, newsletters, or
  related-article queries to the page.

### Loading and failure behavior

- Add lightweight skeleton/loading states for the home and details routes.
- Keep error messages generic and never expose environment values, database
  details, or service-role errors to the browser.

### Formatting

- Use `Intl.DateTimeFormat` for published dates.
- Format confidence as a percentage.
- Preserve numeric framing values without recomputing model output.
- Show sentiment and framing labels in human-readable title case.
- Derive read time at approximately 225 words per minute with a one-minute
  minimum.

## Security requirements

- `SUPABASE_SERVICE_ROLE_KEY` stays exclusively in server-only modules.
- Do not instantiate the service-role client in a Client Component.
- Do not add public mutation endpoints or expose raw database errors.
- Do not weaken existing Clerk protection for `/news`.
- Images and article text must be rendered as data, never injected as HTML.

## Acceptance criteria

- Home cards are populated from analyzed Supabase articles, not demo arrays.
- An analyzed article card links to a working database-backed details page.
- All card fields required by `AGENTS.md` section 19 are visible.
- The details page shows all stored analysis fields and actual article content.
- Unanalyzed articles do not appear in the feed.
- Unknown/unanalyzed IDs return the not-found experience.
- Empty analyzed datasets show a polished empty state.
- No server-only secret appears in client code or output.
- Existing scrape, source, and analyze API routes remain unchanged.

## Checks to run

- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `git diff --check`
- Run a read-only Supabase query through the existing query module to confirm
  analyzed articles and joined source/analysis fields deserialize correctly.
- Verify the rendered home page contains a real stored article title.
- Verify a real `/news/<uuid>` route renders stored analysis.
- Verify an unknown UUID returns the not-found response.

## Exact manual test steps expected after implementation

1. Ensure `.env.local` contains the existing Supabase server configuration.
2. Start the app:

   ```bash
   npm run dev -- --port 3001
   ```

3. Open `http://localhost:3001` and confirm cards match analyzed rows in
   Supabase.
4. Click a card, sign in through Clerk if prompted, and confirm the details page
   shows the same title, source, image, publication date, article body, and full
   analysis stored in Supabase.
5. Compare the UI with:

   ```sql
   select
     a.id,
     a.title,
     a.image_url,
     a.published_at,
     a.analyzed_at,
     s.name as source,
     aa.summary,
     aa.sentiment_label,
     aa.sentiment_score,
     aa.bias_label,
     aa.left_percentage,
     aa.center_percentage,
     aa.right_percentage,
     aa.confidence,
     aa.framing_notes,
     aa.loaded_terms,
     aa.disclaimer,
     aa.model
   from articles a
   join sources s on s.id = a.source_id
   join article_analyses aa on aa.article_id = a.id
   order by a.published_at desc;
   ```

6. Open a nonexistent UUID such as
   `http://localhost:3001/news/00000000-0000-0000-0000-000000000000` and confirm
   the not-found experience appears after authentication.
