-- =====================================================================
-- SleepALot — Database schema
-- Run this FIRST in the Supabase SQL Editor (Dashboard > SQL Editor).
-- Creates all tables and the (deliberately vulnerable) search function.
-- Row Level Security is intentionally LEFT OFF here — that is one of the
-- planted vulnerabilities. See 02_vulnerable_state.sql and
-- 03_hardened_policies.sql.
-- =====================================================================

-- ---------- PROFILES ----------
-- One row per auth user. `role` lets us show a privilege/role field.
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  full_name   text,
  role        text not null default 'customer',   -- 'customer' | 'admin'
  created_at  timestamptz not null default now()
);

-- ---------- PRODUCTS ----------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique,
  description text,
  price       numeric(10,2) not null default 0,
  image_url   text,
  stock       int not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------- REVIEWS ----------
-- `body` is rendered as raw HTML by the vulnerable app => stored XSS lives here.
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  author_name text not null default 'Anonymous',
  rating      int not null default 5 check (rating between 1 and 5),
  body        text not null,
  created_at  timestamptz not null default now()
);

-- ---------- ORDERS ----------
-- Reading someone else's order by id is the IDOR target.
create table if not exists public.orders (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  total            numeric(10,2) not null default 0,
  status           text not null default 'paid',
  shipping_address text,
  created_at       timestamptz not null default now()
);

create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  uuid references public.products(id) on delete set null,
  quantity    int not null default 1,
  unit_price  numeric(10,2) not null default 0
);

-- =====================================================================
-- VULNERABLE search function (SQL Injection target)
-- Uses string concatenation inside dynamic SQL, so a crafted `term`
-- can break out of the string literal and inject arbitrary SQL.
-- The hardened replacement is in 03_hardened_policies.sql.
-- SECURITY DEFINER + a permissive search_path make the injection worse,
-- which is realistic for a misconfigured helper function.
-- =====================================================================
create or replace function public.search_products(term text)
returns setof public.products
language plpgsql
security definer
set search_path = public
as $$
begin
  -- !! VULNERABLE: term is concatenated straight into the query text.
  return query execute
    'select * from public.products where name ilike ''%' || term || '%''
     or description ilike ''%' || term || '%'' order by name';
end;
$$;

-- Allow the anon/authenticated roles to call the function (needed for the demo).
grant execute on function public.search_products(text) to anon, authenticated;

-- Storage bucket for product images is created in 02_vulnerable_state.sql
-- (as a PUBLIC bucket — that is the storage misconfiguration finding).
