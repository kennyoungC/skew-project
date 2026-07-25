# Biasly App Design System Implementation

## Goal

Replace the untouched Create Next App screen with a polished, responsive Biasly news homepage and a reusable design-system foundation derived from the attached UI reference. The result should feel like a real reader-facing product, not a design-system documentation sheet.

## Skills read

- No project skill was required for this UI-only task.
- Followed the repository instruction to use the installed Next.js documentation for framework, styling, image, and font behavior.

## Existing code inspected

- `AGENTS.md`
- `app/page.tsx`
- `app/layout.tsx`
- `app/globals.css`
- `package.json`
- `next.config.ts`
- `postcss.config.mjs`
- `tsconfig.json`
- `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/12-images.md`
- `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md`

## Visual interpretation

- Translate the reference into the actual Biasly application rather than recreating the reference board itself.
- Use Poppins as the primary family with clear geometric headings and highly readable body copy.
- Keep the interface editorial, calm, and mostly monochrome.
- Use the reference semantic palette for political framing:
  - left: `#B42318`
  - center: `#E5E7EB`
  - right: `#1D4ED8`
- Use near-black primary text, slate-gray secondary text, white surfaces, subtle gray backgrounds, and quiet borders.
- Favor compact pills, 2px outline icons, medium-radius cards, subtle shadows, and generous whitespace.
- Use the reference card as the primary inspiration: strong image, source/category metadata, bold headline, concise summary, segmented framing meter, and reading metadata.

## Decisions and assumptions

- This task is a visual foundation and homepage implementation only; it will not add Supabase, Clerk, scraping, analysis, or API behavior.
- The homepage will use a small typed in-file mock dataset so the interface can be evaluated before persistence is implemented. This is presentation seed data, not an application storage mechanism.
- Reference-derived elements will be implemented as reusable components and tokens rather than repeated ad hoc class strings.
- Icons will be implemented as accessible inline SVG components to avoid adding a dependency solely for icons.
- Article images will use deterministic remote image URLs and explicit Next.js remote image configuration, or local assets if remote optimization proves unsuitable during implementation.
- Search, category controls, bookmarks, and sign-in affordances may be visually present but will not claim unavailable backend behavior.
- The implementation will remain primarily server-rendered. Client components will be introduced only if an interaction genuinely requires state.

## Files likely to change

- `app/layout.tsx`
- `app/globals.css`
- `app/page.tsx`
- `next.config.ts`
- `package.json` only if a truly necessary dependency or script is missing
- `components/brand.tsx`
- `components/icons.tsx`
- `components/site-header.tsx`
- `components/category-filter.tsx`
- `components/bias-meter.tsx`
- `components/news-card.tsx`
- `components/section-heading.tsx`
- `components/site-footer.tsx`
- `lib/demo-news.ts`

The exact component split may be adjusted during implementation to keep the code small and cohesive.

## Implementation requirements

### Foundations

- Load Poppins through `next/font/google`, self-hosted by Next.js.
- Update page metadata to the Biasly product name and reference tagline.
- Define semantic CSS custom properties for:
  - primary and secondary text
  - page, surface, elevated, and muted backgrounds
  - border and divider
  - left, center, and right framing colors
  - focus ring
  - small, medium, large, and full radii
  - small, medium, and large shadows
- Expose the tokens to Tailwind v4 through the existing `@theme inline` setup where useful.
- Implement the 4px-based spacing rhythm using Tailwind utilities and a few named CSS tokens where consistent reuse improves clarity.
- Remove the automatic dark-mode override because the supplied design system is explicitly light and monochrome.
- Add sensible global reset behavior, smooth font rendering, selection color, and visible keyboard focus.

### Page structure

- Build a sticky or visually anchored top header with:
  - Biasly wordmark and small “News” label
  - desktop navigation
  - search affordance
  - restrained sign-in button
  - compact mobile behavior
- Build an editorial hero with:
  - short eyebrow
  - strong page title
  - supporting copy based on “Balanced news coverage, powered by AI.”
  - a compact transparency or methodology cue
- Add a horizontally scrollable category chip row based on the reference chips.
- Add a featured story using a larger card treatment.
- Add a responsive latest-news grid with reusable story cards.
- Add a compact trust/methodology band explaining that framing is AI-estimated.
- Add a dark footer inspired by the reference footer.

### News card

- Support featured and standard variants.
- Include:
  - image with stable aspect ratio
  - source and category metadata
  - article title
  - short summary where space permits
  - accessible left/center/right framing meter
  - percentages
  - published/read-time metadata
  - bookmark affordance
- Preserve the visual hierarchy shown in the reference without making small cards overcrowded.
- Use proper semantic headings and links.

### Bias meter

- Accept left, center, and right numeric percentages as typed props.
- Render proportionally sized segments.
- Include visible text or an accessible description so meaning is not communicated by color alone.
- Use the exact semantic direction colors from the reference.
- Label the result as AI-estimated framing, never as objective bias.

### Typography

- Page title: approximately 32–48px depending on viewport, bold, around 1.15–1.2 line height.
- Section title: approximately 24px, semibold.
- Card title: approximately 18–20px, semibold.
- Body: 14–16px, regular, around 1.6 line height.
- Supporting metadata/captions: 11–13px.
- Avoid excessive letter spacing; use uppercase sparingly for metadata only.

### Spacing, grid, and responsiveness

- Desktop container: max width around 1280px.
- Desktop grid: 12-column logic with 24px gutters and approximately 24px outer margins.
- Use responsive CSS grid layouts that collapse naturally:
  - desktop: featured split layout and 3-column article grid
  - tablet: 2-column card grid
  - mobile: single-column stack
- Preserve comfortable 16–24px mobile side padding.
- Allow chips to scroll horizontally without wrapping into an overly tall block.
- Ensure card images, meters, metadata, and action rows do not overflow at 320px viewport width.

### Interaction and accessibility

- Provide hover, active, focus-visible, and disabled visual states where applicable.
- Keep buttons and icon controls at least 40–44px in practical touch target size.
- Use descriptive labels for icon-only controls.
- Maintain strong contrast for all text and controls.
- Respect `prefers-reduced-motion`.
- Avoid unnecessary animation; use restrained color, border, and transform transitions.

## Security requirements

- Do not introduce secrets, environment variables, API calls, or client-side data mutations.
- Do not expose placeholders that resemble production credentials.
- Keep external image configuration limited to the exact hostnames used by demo content.
- Do not use unsanitized HTML or `dangerouslySetInnerHTML`.

## Acceptance criteria

- The starter screen is fully replaced by a cohesive Biasly news homepage.
- The visible design closely reflects the supplied reference’s typography, palette, spacing, radii, shadows, icon style, chips, buttons, and bias meter.
- Poppins is loaded using the current Next.js font API.
- Reusable components exist for at least the brand, header, category chips, news cards, bias meter, and footer.
- The page is polished at desktop, tablet, and mobile widths.
- The bias meter is proportional, typed, accessible, and explicitly labeled as AI-estimated.
- The UI has no dark-mode artifacts from the starter.
- No backend or pipeline behavior is added.
- There are no TypeScript, ESLint, or production-build errors.

## Checks to run

- `npx tsc --noEmit` because the current package does not yet define the required `typecheck` script.
- `npm run lint`
- `npm run build`
- If implementation adds the repository-required `typecheck` script, run `npm run typecheck` instead of the direct `npx tsc --noEmit`.

## Exact manual test steps expected after implementation

1. Run `npm run dev`.
2. Open `http://localhost:3000`.
3. Verify the Poppins-based Biasly header, editorial hero, chips, featured story, article grid, AI-framing explanation, and dark footer are visible.
4. Resize the viewport to approximately 1440px, 768px, and 375px.
5. At 1440px, verify the content stays centered and the article grid uses three columns.
6. At 768px, verify cards rearrange without clipped text, meters, or controls.
7. At 375px, verify the header remains usable, chips scroll horizontally, cards become a single column, and no horizontal page overflow appears.
8. Use the Tab key to move through links, buttons, chips, and bookmark controls; verify every interactive element has a visible focus indicator.
9. Confirm each framing meter presents left, center, and right values in text and does not rely on color alone.
10. Check the browser console and the terminal running Next.js for errors.
