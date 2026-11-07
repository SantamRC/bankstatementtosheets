-- Billing via Dodo Payments (merchant of record). Replaces the Stripe-specific columns.
-- Apply in the Supabase SQL editor (prod) before deploying the code that uses it.

alter table public.profiles add column if not exists billing_customer_id text unique;  -- Dodo customer_id
alter table public.profiles add column if not exists subscription_id text;             -- Dodo subscription_id
-- Pages granted each month by the active plan (0 on free). Yearly plans renew once a year but the
-- allowance still refills monthly: consume_pages() tops it up lazily when allowance_resets_at has passed.
alter table public.profiles add column if not exists monthly_allowance integer not null default 0;
alter table public.profiles add column if not exists allowance_resets_at timestamptz;

-- Webhook idempotency: Dodo retries deliveries, so each webhook-id is processed once.
create table if not exists public.webhook_events (
  id text primary key,
  type text,
  received_at timestamptz not null default now()
);
alter table public.webhook_events enable row level security;  -- no policies: service role only

-- Monthly refill (also used by consume_pages). Returns nothing; safe to call anytime.
create or replace function public.refresh_allowance(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r timestamptz;
begin
  select allowance_resets_at into r from profiles where id = p_user for update;
  if r is null or r > now() then return; end if;
  while r <= now() loop r := r + interval '1 month'; end loop;
  update profiles
     set monthly_pages_left = monthly_allowance,
         allowance_resets_at = r
   where id = p_user and monthly_allowance > 0;
end;
$$;

create or replace function public.consume_pages(p_user uuid, p_pages integer)
returns integer language plpgsql security definer set search_path = public as $$
declare
  m integer; b integer; from_monthly integer;
begin
  perform refresh_allowance(p_user);
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

-- Page packs: atomic increment (no read-modify-write race between concurrent webhooks).
create or replace function public.add_bonus_pages(p_user uuid, p_pages integer)
returns void language sql security definer set search_path = public as $$
  update profiles set bonus_pages_left = bonus_pages_left + p_pages where id = p_user;
$$;

revoke execute on function public.refresh_allowance(uuid) from public, anon, authenticated;
revoke execute on function public.consume_pages(uuid, integer) from public, anon, authenticated;
revoke execute on function public.add_bonus_pages(uuid, integer) from public, anon, authenticated;
