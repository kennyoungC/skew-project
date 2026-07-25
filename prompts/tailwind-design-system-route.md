# Tailwind-First Refactor and Design System Route

## Goal

Refactor the existing Biasly homepage from custom global component classes to a Tailwind-first implementation, while preserving its current appearance and responsive behavior. Add a dedicated `/design-system` route that presents the complete visual language and reusable UI primitives derived from the supplied reference.

Keep the homepage and its typed demo articles as a presentation shell that can later be populated from Supabase without redesigning the UI.

## Skills read

- No project skill is required for this UI-only task.
- Continue following the installed Next.js documentation for App Router pages, global CSS, and Tailwind usage.

## Existing code inspected

- `AGENTS.md`
- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `components/brand.tsx`
- `components/icons.tsx`
- `components/site-header.tsx`
- `components/bias-meter.tsx`
- `components/news-card.tsx`
- `components/section-heading.tsx`
- `components/site-footer.tsx`
- `lib/demo-news.ts`
- `package.json`
- `postcss.config.mjs`
- `next.config.ts`
- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`

## Decisions and assumptions

- Tailwind v4 is already installed and correctly loaded using `@import "tailwindcss"`.
- `globals.css` will retain only:
  - Tailwind import
  - semantic design tokens and Tailwind theme mappings
  - minimal reset/base styles
  - global accessibility behavior such as focus and reduced-motion handling
- Component layouts, typography, spacing, responsive rules, borders, states, and shadows will move into Tailwind utilities in TSX.
- Repeated complex utility combinations may be kept as local typed constants within their component, but no class-composition dependency will be added.
- The `/design-system` route is a developer-facing visual showcase, not a production navigation destination.
- The design-system route will use real shared components wherever possible, ensuring it stays synchronized with the application.
- The current homepage demo dataset remains separate from future persistence and can later be replaced by Supabase query results.
- No backend, authentication, database, scraping, or AI pipeline work is included.

## Files likely to change

- `app/globals.css`
- `app/page.tsx`
- `app/design-system/page.tsx`
- `components/brand.tsx`
- `components/site-header.tsx`
- `components/bias-meter.tsx`
- `components/news-card.tsx`
- `components/section-heading.tsx`
- `components/site-footer.tsx`
- Additional small showcase-only components if they materially improve clarity
- `lib/demo-news.ts` only if the showcase needs a clearly named exported sample

## Implementation requirements

### Tailwind-first refactor

- Remove component-specific global selectors such as `.site-header`, `.hero`, `.news-card`, `.bias-meter`, `.methodology`, and `.site-footer`.
- Express component presentation using Tailwind utilities directly in TSX.
- Preserve the current visual behavior:
  - sticky translucent header
  - editorial hero with decorative rings
  - scrollable category chips
  - responsive featured card
  - three/two/one-column latest-news grid
  - dark methodology band and footer
- Use semantic token utilities such as `bg-background`, `bg-surface`, `text-foreground`, `text-secondary`, `border-border`, `bg-left`, `bg-center`, and `bg-right`.
- Add any missing Tailwind theme mappings for radii and shadows using the Tailwind v4 CSS theme configuration.
- Keep dynamic framing segment widths as inline styles because they are runtime data values.
- Do not introduce arbitrary CSS merely to avoid a clear Tailwind utility.
- Preserve server components; do not add `use client` unless an interaction requires it.

### Shared component API

- Allow the Bias meter to be demonstrated independently and remain usable by news cards.
- Add optional class customization only when it improves component reuse.
- Keep props typed and avoid `any`.
- Ensure shared components do not embed route-specific section IDs or misleading navigation behavior where a neutral presentation element is more appropriate.

### `/design-system` route

Create a polished reference page at `app/design-system/page.tsx` with:

- A compact page header linking back to the homepage.
- Brand section:
  - Biasly wordmark
  - tagline
- Color section:
  - primary text
  - secondary text
  - surface
  - left framing
  - center framing
  - right framing
  - background, border, and divider neutrals
  - display token names and hex values
- Typography section:
  - H1, H2, H3, H4
  - body large, medium, small
  - caption
  - show size, weight, and line-height information
- Buttons section:
  - primary, secondary, text
  - default, hover/focus representation where feasible, outline, and disabled states
- Chips section:
  - default, active, and add/more examples
- Bias meter section:
  - balanced example
  - left-leaning example
  - right-leaning example
  - explicit AI-estimated wording
- News card example using the shared `NewsCard`.
- Icon section using the existing SVG icon set.
- Spacing section demonstrating the 4, 8, 16, 24, 32, 40, and 64px scale.
- Grid section showing a 12-column container diagram with 24px gutters.
- Shadow section showing small, medium, and large elevation.
- Border radius section showing small, medium, large, and full values.
- Dark footer strip similar to the reference’s design-system footer.

### Design-system page layout

- Closely reflect the supplied reference board:
  - neutral canvas
  - thin bordered panels
  - compact uppercase panel titles
  - desktop multi-column layout
  - consistent 16–24px internal panel padding
- Reflow panels into one column on small screens.
- Keep the showcase useful at 320px without horizontal page overflow.
- Grid and spacing demonstrations may scroll inside their panels if needed.

### Homepage readiness for real data

- Keep article rendering driven by the existing typed array mapping.
- Do not hardcode card markup repeatedly in the homepage.
- Preserve a clear replacement seam where future Supabase data can be passed into the same `NewsCard` component.
- Do not add loading, empty, or error states until real data fetching is implemented.

## Security requirements

- Do not introduce secrets, environment variables, API calls, browser-side mutations, or raw HTML rendering.
- Keep external image configuration restricted to the existing demo image host.
- Do not add client-side pipeline or data behavior.

## Acceptance criteria

- `/` retains the current polished homepage design and demo content.
- `/design-system` presents the full design system from the reference.
- Component-specific presentation is expressed predominantly with Tailwind utilities in TSX.
- `globals.css` contains only Tailwind setup, design tokens/theme mappings, and genuine global foundation styles.
- Shared components are used by both the homepage and design-system showcase where applicable.
- Both routes are responsive and accessible.
- Bias meters show percentages in text and remain labeled AI-estimated.
- The homepage remains data-driven and ready for a future Supabase dataset replacement.
- TypeScript, ESLint, and the Next.js production build pass.

## Checks to run

- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Exact manual test steps expected after implementation

1. Run `npm run dev`.
2. Open `http://localhost:3000`.
3. Confirm the homepage visually matches the current implementation after the Tailwind refactor.
4. Confirm the featured card and latest-news cards are still rendered from the typed demo data.
5. Open `http://localhost:3000/design-system`.
6. Verify the page shows brand, colors, typography, buttons, chips, framing meters, card example, icons, spacing, grid, shadows, and radius sections.
7. Resize both routes at approximately 1440px, 768px, 375px, and 320px.
8. Confirm there is no page-level horizontal overflow and that panels/cards reflow correctly.
9. Tab through links, buttons, chips, and icon controls to verify visible focus treatment.
10. Inspect the homepage and design-system framing meters to verify left/center/right percentages are readable and explicitly described as AI-estimated.
11. Check the browser console and Next.js terminal for errors.
