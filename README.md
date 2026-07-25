This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Copy the environment template and add the Clerk and Supabase values described
below:

```bash
cp .env.example .env.local
```

Keep the configured `/sign-in` and `/sign-up` URLs in place. Never commit
`.env.local`; the Clerk secret key is server-only.

## Supabase setup

Supabase is the source of truth for sources, articles, analyses, pipeline logs,
and Oxylabs scheduling state. The current UI still renders demo data; connecting
the pages to these queries is a separate implementation task.

1. Create or select a Supabase project.
2. Open **Dashboard → SQL Editor**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and run it.
3. Run the script a second time to confirm the setup is idempotent.
4. In **Table Editor**, verify that `sources`, `articles`,
   `article_analyses`, `logs`, `oxylabs_schedules`, and
   `oxylabs_schedule_runs` exist and have Row Level Security enabled.
5. Copy the project URL, publishable/anon key, and service-role/secret key into
   `.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_or_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_or_secret_key
   ```

`SUPABASE_SERVICE_ROLE_KEY` is server-only and must never be exposed to browser
code. Clerk remains the authentication provider; this project does not use
Supabase Auth.

Newer Supabase projects can default to not exposing SQL-created tables through
the Data API. The schema explicitly grants the `service_role` access required
by the server-side `supabase-js` client and revokes table access from `anon` and
`authenticated`. No browser data policies are created in this phase.

## Manual scraping

The manual scrape pipeline reads active homepage entry pages from Supabase,
retrieves homepage and article HTML through the Oxylabs Web Scraper Realtime
API, validates article content, and appends valid articles to Supabase.

Add these server-only values to `.env.local`:

```bash
OXY_WSA_USERNAME=your_oxylabs_username
OXY_WSA_PASSWORD=your_oxylabs_password
BIASLY_ADMIN_SECRET=a_long_random_secret
```

Never prefix these values with `NEXT_PUBLIC_`. Trigger scraping only from a
trusted terminal or server:

```bash
curl -sS -X POST http://localhost:3000/api/scrape \
  -H 'Content-Type: application/json' \
  -H "x-biasly-admin-secret: $BIASLY_ADMIN_SECRET" \
  --data '{
    "sourceNames":["BBC News","Fox News","NPR","Reuters","The Guardian"],
    "limitPerSource":5
  }'
```

The source selectors are optional. Omitting them uses all active Supabase
sources. `limitPerSource` defaults to 5 and is capped at 5. Watch the terminal
running `npm run dev` for safe per-source progress logs. Scraped articles remain
hidden from the current demo UI until AI analysis and live UI data wiring are
implemented.

Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The home feed is public. News detail routes under `/news` require a signed-in
Clerk user and return users to the requested article after authentication.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
