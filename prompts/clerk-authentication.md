# Clerk Authentication

## Goal

Add production-ready Clerk authentication to the existing Next.js 16 App Router application. Provide hosted Clerk sign-in and sign-up pages, make Clerk session state available throughout the app, replace the header's placeholder Login button with working signed-out and signed-in account controls, and require authentication for all news detail routes.

Keep the home feed and design-system page public. This task establishes authentication, session-aware UI, and news-detail route protection only; it does not add organizations, billing, Supabase user synchronization, or authorization rules for the scraping/analysis pipeline.

## Skills read

- `.agents/skills/clerk/SKILL.md`
  - The router identified this as a fresh Clerk setup task.
  - The routed `clerk-setup` sub-skill is referenced by the router and lockfile but is not present in the repository's installed `.agents/skills` contents, so implementation will use the available Clerk router guidance and installed package types.
- Current Next.js 16 documentation in `node_modules/next/dist/docs/`:
  - `01-app/02-guides/authentication.md`
  - `01-app/01-getting-started/16-proxy.md`
  - `01-app/02-guides/environment-variables.md`

## Existing code inspected

- `AGENTS.md`
- `package.json`
- `.gitignore`
- `README.md`
- `app/layout.tsx`
- `app/globals.css`
- `app/page.tsx`
- `app/news/[id]/page.tsx`
- `components/site-header.tsx`
- Existing prompt files for project conventions
- `node_modules/next/dist/docs/01-app/02-guides/authentication.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`
- `node_modules/next/dist/docs/01-app/02-guides/environment-variables.md`

## Decisions and assumptions

- Install the current `@clerk/nextjs` release compatible with the existing Next.js 16 and React 19 application.
- Use Clerk's App Router integration and prebuilt components rather than implementing a custom credential flow.
- Wrap the application with `ClerkProvider` in the root layout.
- Add catch-all Clerk routes at `/sign-in/[[...sign-in]]` and `/sign-up/[[...sign-up]]`.
- Add root `proxy.ts` using Clerk's current proxy/matcher pattern and a Clerk route matcher that protects `/news/:path*`.
- Keep `/`, `/sign-in/:path*`, `/sign-up/:path*`, static assets, and other existing non-news pages public.
- Preserve the originally requested news-detail URL when redirecting a signed-out user to sign in so successful authentication can return the user to that detail page.
- Signed-out users see working Login and Sign up controls.
- Signed-in users see Clerk's `UserButton`, including sign-out/account management behavior.
- Preserve the existing Subscribe button as a product affordance; do not connect it to Clerk Billing in this task.
- Use environment URL variables consistent with the canonical list in `AGENTS.md`.
- Do not create or commit `.env.local`, and do not invent Clerk key values.
- Add/update `.env.example` with placeholders for Clerk variables because it is the project's canonical environment-variable list.
- If Clerk's current package API differs from assumptions, use the installed package's types and documentation as the source of truth.

## Files likely to change

- `package.json`
- `package-lock.json`
- `app/layout.tsx`
- `components/site-header.tsx`
- `app/sign-in/[[...sign-in]]/page.tsx`
- `app/sign-up/[[...sign-up]]/page.tsx`
- `proxy.ts`
- `.env.example`
- `README.md`

No Supabase schema or pipeline files should change.

## Implementation requirements

### Clerk setup

- Add `@clerk/nextjs` as a runtime dependency.
- Place `ClerkProvider` at the application root so auth state and Clerk components work on every route.
- Configure root `proxy.ts` using the current Next.js 16 `proxy` convention and Clerk's supported matcher.
- Exclude static assets and Next.js internals from unnecessary proxy matching while allowing Clerk to operate on application and API routes.
- Keep the application routes public by default, but use Clerk's server-side `auth.protect()` flow for `/news/:path*`.
- Ensure `/news/[id]` protection happens before the page renders; do not rely on client-side redirects, hidden content, or session-aware header controls for security.
- Preserve redirect-back behavior so a user who signs in after requesting `/news/<id>` returns to the requested article.
- Keep future secure data access responsible for its own authorization checks; proxy protection is not a substitute for authorization inside future server queries or mutations.

### Authentication routes

- Create Clerk prebuilt sign-in at `/sign-in`.
- Create Clerk prebuilt sign-up at `/sign-up`.
- Use catch-all route segments so Clerk's multi-step flows and callbacks work correctly.
- Center the auth card in a responsive page shell that uses the existing background and typography.
- Configure sign-in/sign-up cross-links through the project's canonical environment variables.

### Header integration

- Replace the nonfunctional Login button with Clerk-aware controls.
- Signed out:
  - Login navigates to `/sign-in`.
  - Sign up navigates to `/sign-up`.
- Signed in:
  - Render `UserButton` with an after-sign-out/fallback destination of `/`.
- Preserve the current layout density and responsive behavior.
- Keep practical control targets at least 40–44px where possible.
- Do not expose user/session tokens or secrets in rendered markup.

### Environment and documentation

- Create or update `.env.example` with:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
  - `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
  - `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`
  - `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL`
- Use safe placeholder values only.
- Document copying `.env.example` to `.env.local`, replacing placeholders with Clerk Dashboard keys, and restarting the dev server.
- Do not weaken the existing `.env*` ignore rule or commit real secrets.

## Security requirements

- `CLERK_SECRET_KEY` must remain server-only and must never use a `NEXT_PUBLIC_` prefix.
- Only Clerk's publishable key and documented public route configuration may be exposed to browser code.
- Do not log keys, tokens, cookies, session claims, or user profile data.
- Do not add custom password handling or persist credentials locally.
- Do not treat a hidden button or client-side conditional as authorization.
- Existing pipeline action routes remain governed by the separate `x-biasly-admin-secret` rule; Clerk authentication must not replace that control in this task.
- News-detail protection must execute on the server through Clerk's proxy integration.
- Do not pass the Clerk secret key, raw session tokens, or privileged auth data across the server/client boundary.
- Do not add Supabase Auth.

## Acceptance criteria

- The application is wrapped in `ClerkProvider`.
- `/sign-in` renders Clerk's sign-in flow.
- `/sign-up` renders Clerk's sign-up flow.
- A signed-out visitor can enter both flows from the site header.
- A signed-in visitor sees a working `UserButton` and can sign out.
- Signing out returns the visitor to `/`.
- Existing `/` and `/design-system` pages remain public and functional.
- A signed-out request to `/news/<valid-id>` is redirected to the Clerk sign-in flow before article content renders.
- After completing sign-in from a protected news-detail request, the user returns to the originally requested `/news/<valid-id>` URL.
- A signed-in request to `/news/<valid-id>` renders the existing news details page.
- Root `proxy.ts` uses the correct Next.js 16 convention and Clerk integration.
- `.env.example` contains all canonical Clerk variables without secrets.
- Setup instructions explain the required local Clerk keys.
- TypeScript, lint, and production build checks pass when valid Clerk test keys are configured.

## Checks to run

- `npm run typecheck`
- `npm run lint`
- `npm run build`

If a production build cannot complete solely because real Clerk environment values are intentionally unavailable, report that exact limitation and still run the remaining static checks. Do not fabricate credentials.

## Exact manual test steps expected after implementation

1. In the Clerk Dashboard, create or select the Biasly application.
2. Copy `.env.example` to `.env.local`.
3. Set the real `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` values in `.env.local`.
4. Keep the public route configuration set to `/sign-in`, `/sign-up`, and `/` as shown in `.env.example`.
5. Run `npm run dev`.
6. Open `http://localhost:3000`.
7. Confirm the homepage renders while signed out and the header shows Login and Sign up controls.
8. Select Login and confirm `/sign-in` renders the Clerk sign-in flow.
9. Follow the Sign up link and confirm `/sign-up` renders the Clerk sign-up flow.
10. Create a test account or sign in with an existing Clerk test user.
11. Confirm the app returns to `/` and the header displays the Clerk user control.
12. Open the user control, verify account-management affordances appear, then sign out.
13. Confirm sign-out returns to `/` and Login/Sign up reappear.
14. While signed out, open `/news/<valid-id>` directly and confirm it redirects to `/sign-in` without rendering article content.
15. Complete sign-in and confirm the app returns to the originally requested `/news/<valid-id>` page.
16. Sign out, then open `/` and `/design-system` and confirm both remain public.
17. Resize to 375px and confirm the account controls fit without horizontal page overflow.
18. Tab through the account controls and auth screens and verify visible keyboard focus.
19. Check the browser console and Next.js terminal for Clerk, proxy, redirect, or hydration errors.
