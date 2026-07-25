# Sources read API route

## Goal

Implement `GET /api/sources` as a small, public, read-only Next.js Route Handler that returns the currently active news sources stored in Supabase.

The route exists so trusted UI and operational callers can discover available source IDs and names without gaining database credentials or mutation capability.

## Skills read

- `.agents/skills/supabase/SKILL.md`
  - Keep the service-role key server-only.
  - Retain RLS and Data API hardening.
  - Return only fields required by the caller.
  - Verify the live query after implementation.

## Existing code inspected

- `AGENTS.md`, especially API method and security rules
- `lib/supabase/queries/sources.ts`
- `lib/supabase/server.ts`
- `lib/supabase/types.ts`
- `app/api/scrape/route.ts`
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
- Current `app/api` route inventory

Findings:

- `listActiveSources()` already provides a typed server-only query, filters `is_active = true`, and sorts by source name.
- `POST /api/scrape` is the only current API route.
- The project specification requires `GET /api/sources` as a read/status route and reserves the admin secret for action routes that start or mutate work.

## Decisions and assumptions

- The route is intentionally public and does not require `x-biasly-admin-secret`.
- It must remain read-only and expose no mutation method.
- Return only safe discovery fields:
  - `id`
  - `name`
  - `listingUrl`
  - `logoUrl`
- Do not expose `parser_strategy`, internal timestamps, Supabase credentials, or inactive sources.
- Use camelCase in the HTTP response while preserving snake_case inside the database layer.
- Return a stable envelope:

```json
{
  "sources": [
    {
      "id": "uuid",
      "name": "BBC News",
      "listingUrl": "https://www.bbc.com/news",
      "logoUrl": null
    }
  ]
}
```

- Keep the route dynamic/fresh because source activation and configuration may change in Supabase.
- Do not add pagination because the configured source list is intentionally small.
- Do not modify the schema or add a browser-side Supabase client.

## Files likely to change

- `app/api/sources/route.ts` (new)
- `README.md` only if a concise endpoint reference materially helps

No database schema, scraping pipeline, UI, authentication, or dependency changes are expected.

## Implementation requirements

- Add `app/api/sources/route.ts`.
- Export `GET` only.
- Set Node.js runtime if needed for consistency with the existing server-only client.
- Call `listActiveSources()` from the existing typed query layer.
- Map results to the safe public response shape.
- Return `200` with `{ sources: [] }` when there are no active sources.
- On a database/configuration failure:
  - log a short server-side message without secrets or raw credentials;
  - return `500` with `{ "error": "Unable to load sources." }`;
  - do not return raw Supabase errors.
- Do not accept request bodies, arbitrary filters, or mutation parameters.
- Do not add `POST`, `PUT`, `PATCH`, or `DELETE`.
- Avoid caching stale source configuration; use a dynamic route and/or a response policy appropriate to the installed Next.js version.

## Security requirements

- Never expose `SUPABASE_SERVICE_ROLE_KEY`.
- Keep database access through `listActiveSources()` and the server-only service client.
- Return active sources only.
- Do not expose `parser_strategy`, timestamps, or internal logging fields.
- Do not add public database grants or RLS policies; the server remains the only database accessor.
- Do not require or expose `BIASLY_ADMIN_SECRET` for this read-only endpoint.
- Preserve `POST /api/scrape` admin-secret protection unchanged.

## Acceptance criteria

- `GET /api/sources` returns `200` and exactly the active Supabase sources in alphabetical order.
- Each response item contains only `id`, `name`, `listingUrl`, and `logoUrl`.
- Inactive sources are excluded.
- Empty data returns `{ "sources": [] }`.
- Database errors return a safe `500` response.
- The route has no mutation method and does not require an admin secret.
- Existing `/api/scrape` security is unchanged.
- No schema, dependency, UI, scraping, AI, scheduler, or authentication changes are introduced.
- `npm run typecheck`, `npm run lint`, and `npm run build` pass.

## Checks to run

```bash
npm run typecheck
npm run lint
npm run build
```

Also verify:

- `app/api/sources/route.ts` exports `GET` only;
- the route imports `listActiveSources()` rather than creating a browser client;
- no service-role value or raw database error is returned;
- the response contains no `parser_strategy`, `created_at`, `updated_at`, or `is_active`;
- `app/api/scrape/route.ts` remains unchanged and protected.

## Exact manual test steps expected after implementation

1. Start the development server:

```bash
npm run dev
```

2. Request the source list:

```bash
curl -i http://localhost:3000/api/sources
```

Expected:

- HTTP `200`;
- JSON with a `sources` array;
- BBC News, Fox News, NPR, Reuters, and The Guardian if all five remain active;
- alphabetical ordering;
- each item contains only `id`, `name`, `listingUrl`, and `logoUrl`.

3. Confirm no secret is required:

```bash
curl -sS http://localhost:3000/api/sources
```

Expected: the same public read response without `x-biasly-admin-secret`.

4. Temporarily deactivate one source in Supabase, call the route again, and confirm that source is absent. Reactivate it afterward.

5. Confirm the scrape action remains protected:

```bash
curl -i -X POST http://localhost:3000/api/scrape \
  -H 'Content-Type: application/json' \
  --data '{"sourceNames":["BBC News"],"limitPerSource":1}'
```

Expected: HTTP `401`.

