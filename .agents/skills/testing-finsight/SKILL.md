---
name: testing-finsight
description: How to run and end-to-end test the FinSight personal finance tracker locally (Next.js 16 + local Supabase stack)
---

# Testing FinSight locally

## Services
- `supabase start` — API on :54321, Postgres :54322, Studio :54323, Mailpit :54324. Apply schema on first run:
  `docker exec -i supabase_db_personal-expence-tracker psql -U postgres -d postgres < supabase/schema.sql`
- `npm run dev` — app on :3000. `.env.local` points at the local stack with demo keys (gitignored).
- Inspect DB directly: `docker exec -i supabase_db_personal-expence-tracker psql -U postgres -d postgres -c "..."` (no psql on host).
- Dev server log: `/tmp/nextdev.log` (or wherever `npm run dev` was launched) — server-action and page errors land here.

## Auth
- Email confirmations are OFF in the local stack: signup via `/signup` logs in instantly and redirects to `/dashboard`.
- Any email works (e.g. `tester@finsight.dev`), password must be >= 8 chars. Full name seeds `profiles.full_name`.
- Signup trigger (`handle_new_user` in schema.sql) creates the profile + 14 default categories (10 expense, 4 income).
- Sign out button is in the top nav. Protected routes redirect to `/login` server-side via `app/(app)/layout.tsx`.

## E2E golden path
1. `/` → Sign up → lands on `/dashboard`.
2. `/transactions` — Add form at top: Type radio (expense/income), Amount, Category select (options depend on selected kind), optional new category, Date (defaults to today), Note. `Add transaction` / when editing `Save changes` + `Cancel`. List rows have `Edit`/`Delete` buttons. Filters: All/Income/Expenses pills + `← Prev`/`Next →` month nav via `?month=YYYY-MM&kind=`.
3. `/dashboard` — 4 stat cards, donut / 6-month bars / cumulative area charts, Budget progress, Insights, Recent transactions.
4. `/budgets` — one card per expense category; set a limit below actual spend to get the red over-budget state; over state also appears on dashboard Budget progress + an "Over budget: <cat>" warn insight.
5. Sign out → `/login`; hitting `/dashboard` while logged out → `/login`.

## Debugging data issues
- Server components destructure `{ data: ... }` and swallow PostgREST errors — if a field silently falls back (e.g. name shows "there", currency "USD"), add a temp `console.log(JSON.stringify(result))` in the page and read `/tmp/nextdev.log`; PostgREST errors like `column X does not exist` surface there, not in the browser.
- Browser console stays clean for server-side errors; check the dev log instead.

## Devin Secrets Needed
- None for local testing. SUPABASE_ACCESS_TOKEN/VERCEL_TOKEN only matter for the hosted deployment.
