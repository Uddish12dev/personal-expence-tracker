-- =====================================================================
-- FinSight — Personal Finance Tracker — Supabase schema
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
--
-- Sets up:
--   1. profiles, categories, transactions, budgets
--   2. Row-Level Security (users only ever see their own rows)
--   3. A signup trigger that creates the profile + seeds default categories
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- profiles ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  currency   text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- categories ----------
-- Per-user categories (seeded on signup, user can add more from the UI).
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  kind       text not null check (kind in ('income','expense')),
  color      text not null default '#64748b',
  created_at timestamptz not null default now(),
  unique (user_id, name, kind)
);

-- ---------- transactions ----------
create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  kind        text not null check (kind in ('income','expense')),
  amount      numeric(12,2) not null check (amount > 0),
  occurred_on date not null default current_date,
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, occurred_on desc);
create index if not exists transactions_user_kind_idx
  on public.transactions (user_id, kind);

-- ---------- budgets ----------
-- One row per (user, category, month). month is always the 1st (YYYY-MM-01).
create table if not exists public.budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  month       date not null,
  amount      numeric(12,2) not null check (amount > 0),
  created_at  timestamptz not null default now(),
  unique (user_id, category_id, month)
);

-- =====================================================================
-- Row-Level Security
-- =====================================================================

alter table public.profiles     enable row level security;
alter table public.categories   enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets      enable row level security;

create policy "profiles own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "categories own" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "transactions own" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "budgets own" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =====================================================================
-- Signup trigger: profile + default categories
-- =====================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;

  insert into public.categories (user_id, name, kind, color) values
    (new.id, 'Groceries',     'expense', '#10b981'),
    (new.id, 'Dining',        'expense', '#f59e0b'),
    (new.id, 'Rent',          'expense', '#6366f1'),
    (new.id, 'Utilities',     'expense', '#0ea5e9'),
    (new.id, 'Transport',     'expense', '#8b5cf6'),
    (new.id, 'Entertainment', 'expense', '#ec4899'),
    (new.id, 'Health',        'expense', '#ef4444'),
    (new.id, 'Shopping',      'expense', '#14b8a6'),
    (new.id, 'Travel',        'expense', '#f97316'),
    (new.id, 'Other',         'expense', '#64748b'),
    (new.id, 'Salary',        'income',  '#059669'),
    (new.id, 'Freelance',     'income',  '#22c55e'),
    (new.id, 'Investments',   'income',  '#84cc16'),
    (new.id, 'Other income',  'income',  '#a3e635')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- updated_at maintenance on profiles ----------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();
