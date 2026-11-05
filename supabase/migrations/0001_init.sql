-- BankStatementToSheets — initial schema
-- Apply with: supabase db push   (or paste into the Supabase SQL editor)

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro', 'business')),
  monthly_pages_left integer not null default 0,   -- resets each billing cycle
  bonus_pages_left integer not null default 20,     -- free signup pages + page packs, never expire
  pages_used integer not null default 0,
  stripe_customer_id text unique,
  subscription_status text,
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.conversions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_name text not null,
  pages integer not null,
  bank_name text,
  currency text,
  period_start date,
  period_end date,
  transaction_count integer not null default 0,
  reconciliation_status text,
  statement jsonb not null,           -- extracted data only; the PDF itself is never stored
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);
create index if not exists conversions_user_created on public.conversions (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.conversions enable row level security;

-- Users read their own profile; all writes go through the service role (webhooks / credit RPC).
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for select using ((select auth.uid()) = id);

drop policy if exists "own conversions read" on public.conversions;
create policy "own conversions read" on public.conversions for select using ((select auth.uid()) = user_id);
drop policy if exists "own conversions delete" on public.conversions;
create policy "own conversions delete" on public.conversions for delete using ((select auth.uid()) = user_id);

-- Create a profile with free pages on signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atomically spend pages: monthly allowance first, then bonus pages.
-- Returns remaining total, or -1 if the user doesn't have enough.
create or replace function public.consume_pages(p_user uuid, p_pages integer)
returns integer language plpgsql security definer set search_path = public as $$
declare
  m integer; b integer; from_monthly integer;
begin
  select monthly_pages_left, bonus_pages_left into m, b from profiles where id = p_user for update;
  if not found or m + b < p_pages then return -1; end if;
  from_monthly := least(m, p_pages);
  update profiles
     set monthly_pages_left = m - from_monthly,
         bonus_pages_left = b - (p_pages - from_monthly),
         pages_used = pages_used + p_pages
   where id = p_user;
  return (m + b) - p_pages;
end;
$$;

-- Give pages back when a conversion fails after pages were reserved.
create or replace function public.refund_pages(p_user uuid, p_pages integer)
returns void language sql security definer set search_path = public as $$
  update profiles
     set bonus_pages_left = bonus_pages_left + p_pages,
         pages_used = greatest(0, pages_used - p_pages)
   where id = p_user;
$$;

revoke execute on function public.consume_pages(uuid, integer) from public, anon, authenticated;
revoke execute on function public.refund_pages(uuid, integer) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

