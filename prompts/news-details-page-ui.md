# News Details Page UI

## Goal

Implement a responsive, production-style news details page based on the attached UI reference. Create a dynamic route at `/news/[id]` that presents an article, AI-estimated framing analysis, AI summary, source breakdown, related stories, newsletter signup presentation, and the existing Biasly header/footer.

Preserve the current homepage and `/design-system`.

## Skills read

- No project skill is required for this UI-only implementation.
- Follow the installed Next.js App Router documentation already inspected, especially the current async dynamic-route `params` behavior.

## Existing code inspected

- `AGENTS.md`
- `app/layout.tsx`
- `app/globals.css`
- `app/page.tsx`
- `app/design-system/page.tsx`
- `components/site-header.tsx`
- `components/site-footer.tsx`
- `components/bias-meter.tsx`
- `components/compact-news-card.tsx`
- `components/news-card.tsx`
- `components/icons.tsx`
- `lib/demo-news.ts`
- Attached news details UI reference

## Decisions and assumptions

- The dynamic details route will be `/news/[id]`.
- The page will initially use typed demo article-detail data because Supabase persistence is not yet connected.
- Unknown IDs will use the Next.js `notFound()` behavior.
- Homepage cards should link to a valid demo detail route so the page can be reached naturally.
- AI framing must remain explicitly presented as AI-estimated, even where the supplied reference uses the shorter “Bias Analysis” wording.
- The main article body and analysis content will be typed static JSX/data, not injected HTML.
- Header and footer remain shared with the homepage.
- Save, share, feedback, source, and newsletter controls are presentational until backend behavior is implemented.

## Files likely to change

- `app/news/[id]/page.tsx`
- `app/news/[id]/not-found.tsx` if a route-specific empty state improves the result
- `components/article-analysis-panel.tsx`
- `components/article-summary-panel.tsx`
- `components/source-breakdown-panel.tsx`
- `components/related-story.tsx`
- `components/newsletter-band.tsx`
- `components/compact-news-card.tsx`
- `components/icons.tsx`
- `lib/demo-news.ts`
- `lib/demo-article-detail.ts`
- `next.config.ts` only if a new image hostname becomes necessary

Exact component boundaries may be simplified if a smaller structure remains readable and reusable.

## Visual interpretation

### Page shell

- Keep the existing slim dark utility bar, compact primary navigation, and dark footer.
- Do not show the homepage topic rail on the detail route unless the shared header currently includes it inseparably; preferably support a detail-page header variant that omits the topic rail to match the reference.
- Warm off-white page background.
- Centered desktop content width around 1160px.

### Desktop layout

- Two-column content layout:
  - main article column around 70%
  - sticky or naturally flowing analysis sidebar around 30%
- Approximately 36–40px column gap.
- Main content begins with metadata, headline, author/date/read time, and article actions.
- Sidebar begins aligned near the article title area.

### Article heading

- Compact category and region label.
- Large bold headline approximately 34–42px with tight line height.
- Byline, date, and reading time on one line where space allows.
- Save, Share, and overflow controls aligned to the right on desktop.
- Actions wrap or simplify cleanly on mobile.

### Hero image and caption

- Wide image with a subtle radius.
- Stable responsive aspect ratio.
- Small caption and credit below.
- Use `next/image`.

### Bias distribution

- Bordered surface panel immediately below the hero caption.
- Heading with information icon.
- Proportional left/center/right segmented meter.
- Source count below.
- Reuse the shared `BiasMeter` where possible.

### Article body

- Readable 16px body text with approximately 1.65–1.75 line height.
- Comfortable paragraph spacing.
- Keep article measure constrained within the main column.
- Use semantic paragraphs and quotation markup where appropriate.

### Sidebar panels

- White/off-white surface, thin border, medium radius.
- Consistent 20–24px padding.
- Panels stack with 20–24px gaps.

#### Analysis panel

- Title: “AI Framing Analysis” or similar explicit wording.
- Overall framing result, e.g. “Right 49%”.
- Note that the result is based on balanced sources.
- Separate left/center/right rows with percentages and compact bars.
- Short methodology disclaimer.
- “How We Analyze Framing” outline button.

#### AI summary panel

- Generated date and reading time.
- Five concise bullet points.
- AI summaries disclaimer.
- Feedback button.

#### Source breakdown panel

- Total source count.
- Left/center/right counts and percentages.
- List of top sources with their estimated framing labels.
- View-all-sources button.

### Related stories

- Section below the article body, separated by a top divider.
- Six compact related items in a two-column layout on desktop.
- Thumbnail, category/region, title, date, and read time.
- Collapse to one column on narrow screens.

### Newsletter band

- Full-width bordered band below article/sidebar content.
- Strong heading and supporting copy on the left.
- Email field and dark subscribe button on the right.
- Stack cleanly on mobile.
- Presentation only; prevent misleading form submission behavior.

## Tailwind requirements

- Use Tailwind utilities as the primary styling mechanism.
- Prefer canonical utilities whenever Tailwind has an exact equivalent.
- Use arbitrary utilities only for genuinely custom values such as calculated widths, `clamp()`, exact grid templates, and nonstandard typographic metrics.
- Do not add component-specific CSS to `globals.css`.
- Keep global CSS limited to tokens, theme mappings, resets, and accessibility foundations.

## Data model requirements

Create typed demo detail data containing:

- article ID
- category
- region
- headline
- author
- publication date
- read time
- hero image
- caption
- photo credit
- source count
- framing percentages totaling 100
- confidence or methodology description where displayed
- article paragraphs
- AI summary bullets
- top source names and estimated labels
- related story IDs/data

Keep the data structure suitable for later mapping from Supabase `articles`, `article_analyses`, and `sources`.

## Routing requirements

- Use the current Next.js 16 async `params` API for `app/news/[id]/page.tsx`.
- Provide metadata derived from the selected demo article where practical.
- Call `notFound()` for missing records.
- Update compact homepage story links to `/news/<id>` using `next/link`.
- Ensure the featured first card routes to a fully populated detail record.

## Responsiveness and accessibility

- Desktop ≥1024px: article/sidebar two-column layout.
- Below desktop: sidebar stacks below the article.
- Related stories: two columns on wider screens and one column on mobile.
- No horizontal overflow at 320px.
- Preserve at least 40–44px practical targets for actionable controls.
- Icon-only buttons require accessible labels.
- Visible focus styles must continue to work.
- Framing information must include text and percentages, not color alone.
- Use semantic article, aside, section, heading, list, time, and figure elements.

## Security requirements

- Do not add API calls, secrets, environment variables, authentication, scraping, or browser-side article mutation.
- Do not use `dangerouslySetInnerHTML`.
- Keep image hosts restricted to the existing approved hostname.
- Do not imply that presentational newsletter, feedback, save, or share controls persist data.

## Acceptance criteria

- A dynamic details page is available at `/news/<valid-id>`.
- The page closely matches the attached reference in structure, density, hierarchy, colors, and spacing.
- The first homepage card links to a valid detail page.
- Article heading, hero image, caption, framing distribution, article body, analysis sidebar, AI summary, source breakdown, related stories, newsletter band, and footer are present.
- AI-generated/framing content is clearly qualified.
- The page is responsive and accessible.
- The homepage and `/design-system` remain functional.
- Tailwind canonical utilities are preferred.
- TypeScript, ESLint, and production build checks pass.

## Checks to run

- `npm run typecheck`
- `npm run lint`
- `npm run build`

## Exact manual test steps expected after implementation

1. Run `npm run dev`.
2. Open `http://localhost:3000`.
3. Activate the first Top News card.
4. Confirm navigation to its `/news/<id>` route.
5. Verify the details page shows the article heading, author metadata, actions, hero image/caption, bias distribution, article body, and related stories.
6. Verify the sidebar shows AI framing analysis, AI summary, and source breakdown.
7. Confirm all left/center/right percentages are readable and described as AI-estimated.
8. Resize to approximately 1440px and confirm the two-column article/sidebar composition.
9. Resize to 768px and confirm the sidebar stacks cleanly.
10. Resize to 375px and 320px and confirm there is no page-level horizontal overflow.
11. Tab through header controls, article actions, sidebar buttons, related links, newsletter controls, and footer links.
12. Open `http://localhost:3000/design-system` and confirm there is no shared-component regression.
13. Visit an invalid route such as `http://localhost:3000/news/not-a-real-id` and confirm the not-found experience.
14. Check the browser console and Next.js terminal for errors.
