-- BINGO Parapharmacie — core catalog schema + RLS
-- Apply in the Supabase SQL editor (or `supabase db push`).

create table if not exists public.categories (
  slug text primary key,
  name text not null,
  sort integer not null default 0
);

create table if not exists public.products (
  id                 text primary key,
  brand              text not null,
  title              text not null,
  category           text not null references public.categories(slug),
  price_millimes     integer not null check (price_millimes >= 0),
  old_price_millimes integer check (old_price_millimes >= 0),
  rating             numeric(2,1) not null default 0 check (rating >= 0 and rating <= 5),
  rating_count       integer not null default 0,
  image              text not null,
  alt                text not null default '',
  tags               text[] not null default '{}',
  active             boolean not null default true,
  created_at         timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_active_idx   on public.products (active);

-- Row Level Security: catalog is public-read; writes are denied to anon/auth
-- (no write policy => only the service_role key can insert/update/delete).
alter table public.categories enable row level security;
alter table public.products   enable row level security;

drop policy if exists "categories public read" on public.categories;
create policy "categories public read"
  on public.categories for select using (true);

drop policy if exists "products public read" on public.products;
create policy "products public read"
  on public.products for select using (active = true);
