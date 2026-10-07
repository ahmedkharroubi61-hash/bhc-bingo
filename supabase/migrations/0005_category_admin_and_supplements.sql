-- Admin-managed categories: each category gets a picture, admins can add/rename
-- categories from /admin/categories, and the food supplements move out of
-- "Wellness" into their own "Food Supplements" (Compléments alimentaires) category.

-- 1) Picture for the home tile + category banner (null = built-in image).
alter table public.categories add column if not exists image text;

-- 2) Admins (is_admin()) may add and edit categories; everyone can still read.
drop policy if exists "categories admin insert" on public.categories;
create policy "categories admin insert"
  on public.categories for insert to authenticated with check (public.is_admin());

drop policy if exists "categories admin update" on public.categories;
create policy "categories admin update"
  on public.categories for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Deleting is safe: products.category references categories(slug), so a category
-- that still has products can't be removed (the admin UI explains why).
drop policy if exists "categories admin delete" on public.categories;
create policy "categories admin delete"
  on public.categories for delete to authenticated using (public.is_admin());

-- 3) The new category (FR label comes from the storefront translations).
insert into public.categories (slug, name, sort, image)
values ('complements-alimentaires', 'Food Supplements', 9, '/img/cat-complement.jpg')
on conflict (slug) do update set name = excluded.name, image = excluded.image;

-- 4) Move every pill/capsule supplement (vitamins, iron, magnesium, zinc, ginkgo,
--    Angicalm) into the new category: the 20 from Wellness plus BigFfer 120mg,
--    an iron supplement that had been filed under Skincare.
update public.products set category = 'complements-alimentaires'
where id in (
  'bigffer-120mg-6gdo',
  'vitawin-adulte-vitalite-immunite-ty4z',
  'vitastress-equilibre-emotionnel-a9mz',
  'polyfer-energie-equilibre-vitalite-ojyi',
  'vitawin-adulteplus-energie-endurance-ngrd',
  'vitazinc-vitaminec180mg-zinc-15mg-7ik0',
  'trio-fer-9t4e',
  'angicalm-reglisse-erysimum-sambucu-vitis-5jwt',
  'vitawin-grossesse-allaitement-gs1h',
  'bigferplus-dd5a',
  'trio-magnesium-v8o3',
  'angicalm-kidz-mtx8',
  'biohealth-mare-mag-magnesium-marin-vitb6-hx48',
  'bigfer-60mg-e29y',
  'angicalm-lemone-o-menthol-acerola-zo23',
  'biohealth-tauri-mag-bisglycinate-de-magn-w32d',
  'bigmag-bisglycinate-de-magnesium-kn79',
  'zincplus-v9um',
  'bigmag-plus-relaxation-nervosite-douleur-l8nr',
  'ginoba-ginkgo-biloba-x8bk',
  'fortifer-bisglycinata-de-fer-120mg-flgs'
);
