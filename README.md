# FinSight — Personal Finance Tracker

Track income and expenses, visualize spending with charts, set monthly budgets,
and get rule-based suggestions on how to spend according to your balance and needs.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Supabase (Postgres + Auth) · Recharts · Vercel

## Features

- Email/password auth (Supabase Auth, SSR sessions via `@supabase/ssr`)
- Transactions: income/expense with categories, dates, notes — add, edit, delete, filter by month/type
- Custom categories (seeded defaults per user, add your own inline)
- Dashboard: income/expense/net/savings-rate cards, spending-by-category donut,
  income-vs-expense bars (6 months), cumulative daily spend, budget progress
- Budgets: monthly per-category limits with over/under progress bars
- Insights: rules-based suggestions (savings rate, month-over-month trend,
  top-category concentration, budget overruns, 50/30/20 essentials check)
- Row-Level Security on every table — users only ever see their own data

## Local development

```bash
npm install
cp .env.example .env.local   # fill in Supabase URL + anon key
npm run dev
```

### Supabase

The schema lives in `supabase/schema.sql`.

- **Cloud project:** Supabase Dashboard → SQL Editor → run `schema.sql`.
- **Local stack:** `supabase start`, then
  `docker exec -i supabase_db_personal-expence-tracker psql -U postgres -d postgres < supabase/schema.sql`
  and point `.env.local` at `http://localhost:54321` with the local anon key.

## Deploy

**Vercel** — import the repo, framework preset Next.js, and set env vars:

| Var | Where |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (server-only) |
| `NEXT_PUBLIC_SITE_URL` | your `https://<project>.vercel.app` URL |

In Supabase → Authentication → URL Configuration, add the production URL to
redirect URLs and set it as the Site URL.
