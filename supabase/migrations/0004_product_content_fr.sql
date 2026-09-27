-- French product content: shown when the storefront language is French,
-- with automatic fallback to the base (English) fields when a FR value is null.
-- (The product content itself is populated per-product; these are the columns.)
alter table public.products add column if not exists description_fr text;
alter table public.products add column if not exists how_to_use_fr  text;
alter table public.products add column if not exists ingredients_fr text;
