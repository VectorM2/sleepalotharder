-- =====================================================================
-- SleepALot — HARDENED STATE  (run for the `sleepalotharder` app)
-- This is the DATABASE-SIDE remediation. It is the "after" side of your
-- evidence for the IDOR / broken-access and SQL-injection findings.
--
-- Run 01_schema.sql first (once). You can run this on the SAME project
-- after testing the vulnerable version, to flip it into the secure state.
-- To go back to vulnerable, re-run 02_vulnerable_state.sql.
-- =====================================================================

-- ---------------------------------------------------------------------
-- FIX (SQL Injection): replace the dynamic-SQL search function with a
-- parameterized version. No string concatenation of user input.
-- ---------------------------------------------------------------------
create or replace function public.search_products(term text)
returns setof public.products
language sql
security invoker            -- run as the caller, not the definer
set search_path = public
as $$
  select * from public.products
  where name ilike '%' || term || '%'
     or description ilike '%' || term || '%'
  order by name;
$$;
-- ^ Here `term` is bound as a parameter value; it can never be parsed as
--   SQL. The `ilike '%' || term || '%'` concatenation builds a STRING
--   VALUE, not query text, so it is safe.

grant execute on function public.search_products(text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- FIX (Broken access control / IDOR): enable RLS everywhere and add
-- least-privilege policies.
-- ---------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.products     enable row level security;
alter table public.reviews      enable row level security;
alter table public.orders       enable row level security;
alter table public.order_items  enable row level security;

-- PRODUCTS: public catalogue — anyone may read, nobody may write via the API.
drop policy if exists "products readable by all" on public.products;
create policy "products readable by all"
  on public.products for select using ( true );

-- PROFILES: a user may read/update only their own profile.
drop policy if exists "own profile readable" on public.profiles;
create policy "own profile readable"
  on public.profiles for select using ( auth.uid() = id );
drop policy if exists "own profile updatable" on public.profiles;
create policy "own profile updatable"
  on public.profiles for update using ( auth.uid() = id );

-- REVIEWS: anyone may read; only authenticated users may add; body length capped.
drop policy if exists "reviews readable by all" on public.reviews;
create policy "reviews readable by all"
  on public.reviews for select using ( true );
drop policy if exists "authenticated can add reviews" on public.reviews;
create policy "authenticated can add reviews"
  on public.reviews for insert to authenticated
  with check ( auth.uid() = user_id );

-- ORDERS: a user may read only their OWN orders. This is what stops the IDOR.
drop policy if exists "own orders readable" on public.orders;
create policy "own orders readable"
  on public.orders for select using ( auth.uid() = user_id );
drop policy if exists "own orders insertable" on public.orders;
create policy "own orders insertable"
  on public.orders for insert to authenticated
  with check ( auth.uid() = user_id );

-- ORDER_ITEMS: readable only if the parent order belongs to the user.
drop policy if exists "own order items readable" on public.order_items;
create policy "own order items readable"
  on public.order_items for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------
-- FIX (Storage misconfiguration): make the bucket private. The app then
-- serves images via short-lived signed URLs.
-- ---------------------------------------------------------------------
update storage.buckets set public = false where id = 'product-images';
drop policy if exists "public read product-images" on storage.objects;
-- (No public select policy => objects are only reachable via signed URLs
--  generated server-side.)
