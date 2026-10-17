# niravpandey.com

Personal site and blog, built with Next.js (App Router), Tailwind CSS and Supabase.

## Running locally

```bash
pnpm install
pnpm dev
```

Then open http://localhost:3000.

Other scripts: `pnpm build`, `pnpm start`, `pnpm lint`.

## Environment variables

Put these in `.env.local`:

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (data and storage) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key |
| `NEXT_PUBLIC_APP_URL` | Site URL used in emailed links (defaults to https://niravpandey.com) |
| `JWT_SECRET` | Signs newsletter confirm and unsubscribe links |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Sends newsletter confirmation emails |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate-limits newsletter sign-ups |

## Layout

- `app/`: routes. Home (`page.tsx`), blog index and posts, `/subscribe`, the newsletter server action, and the newsletter verify and unsubscribe API routes.
- `components/home/`: home page sections.
- `components/blog/`: blog index (topic chart, semantic map, post list) and MDX image components.
- `components/layout/`, `components/ui/`: navbar, footer and shared UI.
- `lib/`: Supabase data loaders (`blog`, `projects`, `skills`, `experience`, `site-settings`), Supabase clients and storage URLs, newsletter tokens, and small utilities.

Content (posts, projects, skills, experience, gallery images) lives in Supabase. Blog posts are stored as MDX and rendered with `next-mdx-remote`.
