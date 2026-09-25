-- BHC Bingo — customer star ratings (stars only, no text reviews)
-- Apply after 0002_orders.sql (Supabase SQL editor, or `supabase db push`).
--
-- Anonymous-friendly: one vote per browser (voter_key from localStorage),
-- re-rating overwrites. Direct writes are blocked by RLS; the only write path
-- is rate_product() (SECURITY DEFINER), which validates 1..5 and recomputes the
-- product's displayed rating as a WEIGHTED BLEND of the seeded baseline and the
-- new votes, so existing social proof (e.g. "4.5 · 340") is preserved, not reset.

-- 1) Preserve the current seeded rating as an immutable baseline (once).
alter table public.products add column if not exists base_rating       numeric(2,1);
alter table public.products add column if not exists base_rating_count integer;

update public.products
   set base_rating = rating, base_rating_count = rating_count
 where base_rating is null;

-- 2) One row per (product, browser). stars constrained 1..5.
create table if not exists public.product_ratings (
  id          uuid primary key default gen_random_uuid(),
  product_id  text not null references public.products(id) on delete cascade,
  voter_key   text not null check (char_length(voter_key) between 8 and 64),
  stars       smallint not null check (stars between 1 and 5),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (product_id, voter_key)
);

create index if not exists product_ratings_product_idx on public.product_ratings (product_id);

-- 3) RLS: raw votes are never read or written directly by the app roles.
--    (No policies => anon/authenticated get nothing; only the RPC, which runs
--     as definer, touches this table.)
alter table public.product_ratings enable row level security;

-- 4) rate_product(): the only path that records a vote.
--    Returns jsonb { success, rating, ratingCount, error? }.
create or replace function public.rate_product(
  p_product_id text,
  p_voter_key  text,
  p_stars      integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exists       boolean;
  v_base_rating  numeric;
  v_base_count   integer;
  v_new_count    integer;
  v_new_sum      integer;
  v_total_count  integer;
  v_avg          numeric;
begin
  -- Validate inputs.
  if p_stars is null or p_stars < 1 or p_stars > 5 then
    return jsonb_build_object('success', false, 'error', 'Please choose 1 to 5 stars.');
  end if;
  if p_voter_key is null or char_length(p_voter_key) not between 8 and 64 then
    return jsonb_build_object('success', false, 'error', 'Invalid rating request.');
  end if;

  select true, coalesce(base_rating, rating, 0), coalesce(base_rating_count, rating_count, 0)
    into v_exists, v_base_rating, v_base_count
    from public.products
   where id = p_product_id and active = true;

  if not found then
    return jsonb_build_object('success', false, 'error', 'This product is no longer available.');
  end if;

  -- Upsert this browser's vote.
  insert into public.product_ratings (product_id, voter_key, stars)
  values (p_product_id, p_voter_key, p_stars)
  on conflict (product_id, voter_key)
    do update set stars = excluded.stars, updated_at = now();

  -- Recompute the displayed rating: weighted blend of baseline + real votes.
  select count(*), coalesce(sum(stars), 0)
    into v_new_count, v_new_sum
    from public.product_ratings
   where product_id = p_product_id;

  v_total_count := v_base_count + v_new_count;
  if v_total_count = 0 then
    v_avg := 0;
  else
    v_avg := round(((v_base_rating * v_base_count) + v_new_sum)::numeric / v_total_count, 1);
  end if;
  v_avg := least(5.0, greatest(0.0, v_avg));

  update public.products
     set rating = v_avg, rating_count = v_total_count
   where id = p_product_id;

  return jsonb_build_object('success', true, 'rating', v_avg, 'ratingCount', v_total_count);
exception when others then
  return jsonb_build_object('success', false, 'error', 'We could not save your rating. Please try again.');
end;
$$;

revoke all on function public.rate_product(text, text, integer) from public;
grant execute on function public.rate_product(text, text, integer) to anon, authenticated;
