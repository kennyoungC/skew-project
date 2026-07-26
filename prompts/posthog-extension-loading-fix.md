# Fix PostHog browser extension loading errors

## Goal

Eliminate the browser console errors for PostHog Web Vitals, Dead Clicks,
ExceptionAutocapture, and Surveys while preserving the existing analytics,
identity, exception capture, and optional PostHog product behavior.

The fix should make these extensions part of the application bundle instead of
requiring runtime script downloads that currently fail.

## Skills read

- No project skill applies directly to PostHog. Per `AGENTS.md`, use the
  installed package types/source, existing project patterns, Next.js local
  documentation, and current official PostHog documentation.

## Existing code inspected

- `instrumentation-client.ts`
- `components/posthog-user-identity.tsx`
- `app/error.tsx`
- `app/layout.tsx`
- `lib/posthog-server.ts`
- `next.config.ts`
- `.env.example`
- `package.json`
- `package-lock.json`
- `posthog-setup-report.md`
- installed `posthog-js` 1.407.2 entrypoints and configuration types

## Diagnosis

The browser imports the default `posthog-js` module. With the configured remote
features, that entrypoint attempts to load optional extensions dynamically.
The failed runtime downloads generate:

- `[PostHog.js] [Web Vitals] "failed to load script"`
- `[PostHog.js] [Dead Clicks] "failed to load script"`
- `[PostHog.js] [ExceptionAutocapture] "failed to load script"`
- `[PostHog.js] [Surveys] "Could not load surveys script"`

The installed package includes a supported `posthog-js/dist/module.full`
entrypoint that bundles the optional browser extensions. Use that entrypoint so
the application does not depend on those runtime extension script requests.

## Decisions and assumptions

- Preserve Web Vitals, dead-click capture, exception autocapture, and surveys
  rather than disabling them merely to hide console errors.
- Keep `/ingest` reverse-proxy rewrites for PostHog API/event requests.
- Keep the existing EU PostHog configuration.
- Use one small client-only PostHog module as the sole browser import so
  initialization, Clerk identification, and error capture share the same
  singleton and entrypoint.
- Do not change the server-side `posthog-node` client.
- Do not add packages or change package versions.
- Do not expose any new environment values.

## Files likely to change

- new `lib/posthog-client.ts`
- `instrumentation-client.ts`
- `components/posthog-user-identity.tsx`
- `app/error.tsx`
- `.env.example` only if needed to document the already-used PostHog public
  variables

## Implementation requirements

1. Create a client-only PostHog module:
   - include `"use client"`;
   - import the singleton from `posthog-js/dist/module.full`;
   - export that singleton for all browser consumers.
2. Update `instrumentation-client.ts`,
   `components/posthog-user-identity.tsx`, and `app/error.tsx` to use the shared
   client module.
3. Keep PostHog initialization in `instrumentation-client.ts` and do not
   initialize it a second time.
4. Preserve:
   - `api_host: "/ingest"`;
   - EU `ui_host` behavior;
   - current defaults date;
   - exception capture;
   - development debug behavior;
   - Clerk `identify` and `reset`;
   - global error-boundary event capture.
5. Avoid browser calls when the PostHog token is absent. Identity and error
   helpers must not produce secondary initialization warnings or runtime
   failures in that state.
6. If `.env.example` is updated, document only the existing public project
   token and EU host variables and keep the canonical environment documentation
   consistent.
7. Do not alter server event capture or unrelated application behavior.

## Security requirements

- The PostHog project token and host are public browser configuration only.
- Do not expose server secrets.
- Do not log user tokens, Clerk session data, or analytics payloads.
- Keep personal identification behavior unchanged; do not add new properties.

## Acceptance criteria

- Browser code has one shared PostHog singleton.
- The full bundled entrypoint is used by all browser consumers.
- Core analytics, Clerk identity, manual exception capture, exception
  autocapture, Web Vitals, dead clicks, and surveys remain available.
- The four reported runtime script-loading console errors no longer occur.
- `/ingest` remains the API proxy.
- Server-side PostHog capture is unchanged.
- The app behaves safely when the public PostHog token is missing.
- TypeScript, ESLint, and the production build pass.

## Checks to run

```bash
npm run typecheck
npm run lint
npm run build
```

Also inspect the generated client bundle/build output for successful resolution
of `posthog-js/dist/module.full`.

## Exact manual test steps expected after implementation

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Open the app in a fresh private/incognito browser window.
3. Open DevTools, clear the Console and Network panels, and reload.
4. Confirm the Console no longer reports failed PostHog scripts for Web Vitals,
   Dead Clicks, ExceptionAutocapture, or Surveys.
5. In Network, confirm PostHog API requests use `/ingest`; extension JavaScript
   requests should no longer be required for the four bundled features.
6. Sign in and navigate between the home and article detail pages.
7. Confirm page events and the identified Clerk user appear in PostHog
   Live Events.
8. Exercise an application error path in a safe test environment and confirm
   exception capture still works.
