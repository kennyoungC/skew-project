# PostHog post-wizard report

The wizard has completed a deep integration of PostHog into Biasly News. The setup includes client-side initialisation via `instrumentation-client.ts` (the Next.js 15.3+ approach), a reverse proxy through Next.js rewrites to the EU PostHog ingestion endpoint, a server-side singleton client in `lib/posthog-server.ts`, Clerk user identification via a dedicated client component, server-side event capture on the news detail page and both pipeline API routes, and client-side error tracking on the global error boundary.

| Event | Description | File |
|---|---|---|
| `article_viewed` | Fires when a user loads a news article detail page, capturing the article's source, sentiment, and framing. | `app/news/[id]/page.tsx` |
| `scrape_run_completed` | Fires after the scrape pipeline finishes, capturing status, articles inserted, and duration. | `app/api/scrape/route.ts` |
| `analysis_run_completed` | Fires after the AI analysis pipeline finishes, capturing status, articles analyzed, and duration. | `app/api/analyze/route.ts` |
| `page_error_reset` | Fires when a user clicks the Try Again button on the global error page. | `app/error.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — dashboard](https://eu.posthog.com/project/232899/dashboard/850198)
- [Article views over time (wizard)](https://eu.posthog.com/project/232899/insights/PNx08YuX)
- [Article views by source (wizard)](https://eu.posthog.com/project/232899/insights/IODrzCRO)
- [Scrape pipeline runs by status (wizard)](https://eu.posthog.com/project/232899/insights/BhiLs0Tv)
- [Analysis pipeline runs by status (wizard)](https://eu.posthog.com/project/232899/insights/Mh9q3tEE)
- [Page error resets (wizard)](https://eu.posthog.com/project/232899/insights/kuqKYK3G)

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` to `.env.example` and any monorepo/bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — the current implementation identifies on every page load when the user is signed in (via `PostHogUserIdentity`), which covers the returning-visitor case; verify this works end-to-end in staging.
- [ ] Supabase, Clerk, and OpenAI are present in this project. Run `npx @posthog/wizard warehouse` to connect them to PostHog's data warehouse.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
