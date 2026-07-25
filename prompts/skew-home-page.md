# Skew/Biasly Home Page from Attached Reference

## Goal

Reimplement the `/` homepage to closely match the attached desktop news-dashboard reference: a slim utility bar, compact primary navigation, horizontal topic rail, dense three-column “Top News” card grid, and dark multi-column footer.

Preserve `/design-system` and continue using the existing Tailwind-first design tokens and shared components. Keep homepage content driven by typed demo data so it can later be replaced by real Supabase results without restructuring the UI.

## Skills read

- No project skill is needed for this UI-only implementation.
- Continue following the installed Next.js App Router, image, font, and Tailwind documentation already inspected for this project.

## Existing code inspected

- `AGENTS.md`
- `app/layout.tsx`
- `app/globals.css`
- `app/page.tsx`
- `app/design-system/page.tsx`
- `components/brand.tsx`
- `components/icons.tsx`
- `components/site-header.tsx`
- `components/bias-meter.tsx`
- `components/news-card.tsx`
- `components/site-footer.tsx`
- `lib/demo-news.ts`
- `next.config.ts`
- `package.json`
- Attached homepage UI reference

## Decisions and assumptions

- “Skew home page” refers to the homepage represented by the attached UI while retaining the current Biasly product branding shown in the reference and project context.
- The task changes only `/`; `/design-system` remains available.
- The page will use typed demo news records for visual implementation only. No local JSON persistence or browser mutation will be introduced.
- Demo card images will use the currently approved Unsplash hostname.
- Navigation controls, login, subscribe, topics, and cards are presentation-only until corresponding routes/auth/data exist.
- Icons will continue using the existing inline SVG system; a few small missing icons may be added.
- Desktop should be visually close to the reference, while tablet/mobile behavior will be inferred responsibly.

## Files likely to change

- `app/page.tsx`
- `components/site-header.tsx`
- `components/news-card.tsx` or a new compact homepage-card component
- `components/site-footer.tsx`
- `components/icons.tsx`
- `lib/demo-news.ts`
- `app/globals.css` only if a genuinely global token is missing

The `/design-system` implementation should not be changed unless a shared-component API adjustment is required to prevent regressions.

## Visual interpretation

### Overall

- Warm off-white application canvas.
- Maximum content width around 1160–1280px.
- Poppins typography.
- Compact vertical rhythm and information-dense editorial layout.
- Thin gray dividers and card borders.
- Minimal shadows; rely mainly on borders and surface contrast.

### Utility bar

- Full-width near-black strip, approximately 32–36px high.
- Left side: Browser Extension and theme choices.
- Right side: date, Set Location, and International Edition.
- Small white/gray text and subtle separators.
- Hide lower-priority utility items gracefully on narrow screens.

### Main navigation

- White/off-white bar approximately 70–76px high.
- Left: menu icon and Biasly News wordmark.
- Center/left navigation links: Home, For You with notification dot, Local, Blindspot.
- Active Home underline.
- Right: dark Subscribe button and outlined Login button.
- Mobile: keep brand and menu, collapse text navigation, retain one practical account action if space permits.

### Topic rail

- Full-width bordered strip below navigation.
- Horizontally scrollable rounded gray topic chips.
- Include plus signs as shown.
- Compact 32–36px chip height.
- Hide scrollbars while retaining horizontal touch/trackpad scrolling.

### Top News grid

- Section title “Top News”.
- Desktop: three equal columns with approximately 24px gaps.
- Tablet: two columns.
- Mobile: one column.
- At least 12 demo cards to reproduce the reference density.

### Compact news cards

- Medium border radius, thin border, white surface.
- Large 16:9 or similar image occupying the top portion.
- Circular information icon overlaid in the image’s top-right corner.
- Content region:
  - compact category and region metadata
  - strong two-to-three-line headline
  - compact proportional left/center/right framing meter
  - source count at the bottom
- No summary paragraph on these compact cards.
- Keep consistent card heights as much as headline wrapping permits.
- Preserve explicit AI-estimated framing semantics through accessible labeling even if the visual label is shortened in the dense card.
- Do not communicate framing with color alone; percentages must remain visible in each segment.

### Footer

- Dark charcoal footer.
- Brand/tagline column.
- Company links.
- Help links.
- Connect/social icon row.
- Bottom copyright divider.
- Stack columns cleanly on mobile.

## Implementation requirements

- Use Tailwind utility classes for component presentation.
- Keep `globals.css` limited to the existing tokens, Tailwind theme definitions, and true global base/accessibility rules.
- Keep the page server-rendered.
- Use `next/image` with stable aspect ratios and responsive `sizes`.
- Add a typed compact card variant or dedicated component without breaking the larger `NewsCard` displayed on `/design-system`.
- Expand `lib/demo-news.ts` to at least 12 suitable typed stories with:
  - unique ID
  - source or source-count display
  - category
  - region
  - title
  - image
  - framing percentages that total 100
- Avoid duplicating the compact card markup in `app/page.tsx`.
- Ensure all mapped collections use stable keys.
- Add accessible names to icon-only buttons.
- Use `Link` for real internal route navigation such as `/` and `/design-system`.

## Responsiveness

- Desktop ≥1024px: three-column grid and full primary navigation.
- Tablet around 768px: two-column grid, reduced navigation.
- Mobile ≤640px: one-column grid, horizontally scrolling topics, compact header.
- No horizontal page overflow at 320px.
- Topic rail may scroll internally.
- Card text, meter percentages, and source count must remain legible on narrow screens.

## Security requirements

- Do not add API calls, secrets, environment variables, authentication behavior, scraping, or browser-side data mutation.
- Do not expose server-only configuration.
- Keep remote images restricted to the existing configured hostname.
- Do not render unsanitized HTML.

## Acceptance criteria

- `/` closely matches the attached homepage reference in structure, density, typography, spacing, color, and responsive behavior.
- `/design-system` still renders correctly.
- The homepage includes the utility bar, primary navigation, topic rail, “Top News” title, 12-card grid, and dark footer.
- Cards use shared typed data and a reusable component.
- Framing meters are proportional, textual, and accessible.
- Tailwind remains the primary styling mechanism.
- The page is ready for future real data replacement.
- TypeScript, ESLint, and production build checks pass.

## Checks to run

- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Exact manual test steps expected after implementation

1. Run `npm run dev`.
2. Open `http://localhost:3000`.
3. Confirm the utility bar, main navigation, topic rail, Top News grid, and footer match the attached reference.
4. Confirm 12 news cards render in three columns on a desktop viewport around 1440px.
5. Verify each card contains an image, metadata, headline, left/center/right percentages, and source count.
6. Resize to approximately 768px and confirm the grid becomes two columns.
7. Resize to 375px and 320px and confirm the grid becomes one column with no page-level horizontal overflow.
8. Horizontally scroll the topic rail on mobile.
9. Use Tab to verify visible focus indicators on navigation, chips, buttons, cards, and icon controls.
10. Open `http://localhost:3000/design-system` and confirm the design-system page still renders without regression.
11. Check the browser console and Next.js terminal for errors.
