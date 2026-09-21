-- BINGO Parapharmacie — COD orders with SERVER-SIDE price validation
-- Apply after 0001_init.sql (Supabase SQL editor, or `supabase db push`).
--
-- Security model: the browser NEVER sets prices or totals. The client sends only
-- { product_id, qty } pairs; create_order() re-reads each price from the products
-- table, recomputes line totals, subtotal, delivery, and grand total, then persists
-- the order atomically. Direct INSERTs are blocked by RLS — orders are created
-- solely through this SECURITY DEFINER function.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id                 text primary key,
  user_id            uuid references auth.users(id),          -- null for guest COD
  status             text not null default 'received'
                       check (status in ('received','confirmed','cancelled')),
  method             text not null default 'COD' check (method = 'COD'),
  subtotal_millimes  integer not null check (subtotal_millimes >= 0),
  delivery_millimes  integer not null check (delivery_millimes >= 0),
  total_millimes     integer not null check (total_millimes >= 0),
  customer_name      text not null,
  customer_phone     text not null,
  customer_address   text not null,
  customer_city      text not null,
  notes              text not null default '',
  created_at         timestamptz not null default now()
);

create table if not exists public.order_items (
  id             bigint generated always as identity primary key,
  order_id       text not null references public.orders(id) on delete cascade,
  product_id     text not null references public.products(id),
  title          text not null,                 -- snapshot of title at purchase time
  unit_millimes  integer not null check (unit_millimes >= 0),
  qty            integer not null check (qty > 0),
  line_millimes  integer not null check (line_millimes >= 0)
);

create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists orders_user_idx        on public.orders (user_id);
create index if not exists orders_created_idx      on public.orders (created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
--   * No INSERT/UPDATE/DELETE policies => direct writes denied to anon/auth.
--   * Orders are written only via create_order() (SECURITY DEFINER, bypasses RLS).
--   * A signed-in user may read back their own orders; guests cannot (they keep
--     the confirmation returned at checkout).
-- ---------------------------------------------------------------------------
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "orders read own" on public.orders;
create policy "orders read own" on public.orders
  for select using (auth.uid() is not null and user_id = auth.uid());

drop policy if exists "order_items read own" on public.order_items;
create policy "order_items read own" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- create_order(): the only path that writes an order.
--   p_customer : jsonb { name, phone, address, city, notes }
--   p_items    : jsonb [ { product_id, qty }, ... ]
-- Returns jsonb { success, order? , error? }.
-- Delivery rule mirrors src/lib/config.ts (kept in sync intentionally):
--   free over 100_000 millimes, else a flat 7_000 fee.
-- ---------------------------------------------------------------------------
create or replace function public.create_order(p_customer jsonb, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c_free_over    constant integer := 100000;  -- FREE_DELIVERY_OVER_MILLIMES
  c_delivery_fee constant integer := 7000;    -- DELIVERY_FEE_MILLIMES
  v_order_id  text;
  v_item      jsonb;
  v_qty       integer;
  v_product   record;
  v_line      integer;
  v_subtotal  integer := 0;
  v_delivery  integer;
  v_priced    jsonb := '[]'::jsonb;   -- validated + server-priced line items
  v_items_out jsonb := '[]'::jsonb;   -- shape returned to the client
begin
  -- 1. Guard: non-empty cart + required customer fields.
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('success', false, 'error', 'Your cart is empty.');
  end if;
  if coalesce(p_customer->>'name','')    = '' or coalesce(p_customer->>'phone','')   = ''
  or coalesce(p_customer->>'address','') = '' or coalesce(p_customer->>'city','')    = '' then
    return jsonb_build_object('success', false, 'error', 'Missing required delivery details.');
  end if;

  -- 2. Validate + price every item from the DB BEFORE writing anything
  --    (so a bad item leaves no partial order behind).
  for v_item in select value from jsonb_array_elements(p_items) as t(value)
  loop
    v_qty := coalesce((v_item->>'qty')::integer, 0);
    if v_qty <= 0 then
      return jsonb_build_object('success', false, 'error', 'Invalid quantity in cart.');
    end if;

    select id, title, price_millimes
      into v_product
      from public.products
      where id = (v_item->>'product_id') and active = true;

    if not found then
      return jsonb_build_object('success', false,
        'error', 'A product in your cart is no longer available.');
    end if;

    v_line     := v_product.price_millimes * v_qty;
    v_subtotal := v_subtotal + v_line;
    v_priced   := v_priced || jsonb_build_object(
      'product_id', v_product.id, 'title', v_product.title,
      'unit', v_product.price_millimes, 'qty', v_qty, 'line', v_line);
  end loop;

  v_delivery := case when v_subtotal >= c_free_over then 0 else c_delivery_fee end;
  v_order_id := 'BNG-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));

  -- 3. Persist order header, then line items.
  insert into public.orders(
    id, user_id, subtotal_millimes, delivery_millimes, total_millimes,
    customer_name, customer_phone, customer_address, customer_city, notes)
  values (
    v_order_id, auth.uid(), v_subtotal, v_delivery, v_subtotal + v_delivery,
    p_customer->>'name', p_customer->>'phone', p_customer->>'address',
    p_customer->>'city', coalesce(p_customer->>'notes',''));

  for v_item in select value from jsonb_array_elements(v_priced) as t(value)
  loop
    insert into public.order_items(order_id, product_id, title, unit_millimes, qty, line_millimes)
    values (
      v_order_id, v_item->>'product_id', v_item->>'title',
      (v_item->>'unit')::integer, (v_item->>'qty')::integer, (v_item->>'line')::integer);

    v_items_out := v_items_out || jsonb_build_object(
      'title', v_item->>'title', 'qty', (v_item->>'qty')::integer,
      'lineTotal', (v_item->>'line')::integer);
  end loop;

  return jsonb_build_object('success', true, 'order', jsonb_build_object(
    'id', v_order_id, 'items', v_items_out,
    'subtotal', v_subtotal, 'delivery', v_delivery,
    'total', v_subtotal + v_delivery, 'method', 'COD'));

exception when others then
  -- Any unexpected DB error rolls back the whole block; return a safe message.
  return jsonb_build_object('success', false,
    'error', 'We could not place your order. Please try again.');
end;
$$;

-- Only the RPC is callable by the app roles; the tables stay write-locked.
revoke all on function public.create_order(jsonb, jsonb) from public;
grant execute on function public.create_order(jsonb, jsonb) to anon, authenticated;
