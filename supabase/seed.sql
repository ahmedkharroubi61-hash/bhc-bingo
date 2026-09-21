-- BINGO Parapharmacie — seed catalog. Run after 0001_init.sql.
insert into public.categories (slug, name, sort) values
  ('skincare','Skincare',1),('face','Face Care',2),('body','Body Care',3),
  ('hair','Hair Care',4),('makeup','Makeup',5),('sun','Sun Protection',6),
  ('baby','Baby & Mother',7),('wellness','Wellness',8)
on conflict (slug) do update set name = excluded.name, sort = excluded.sort;

insert into public.products
  (id, brand, title, category, price_millimes, old_price_millimes, rating, rating_count, image, alt, tags) values
  ('argan-shampoo-750','Argan Oil','Nourishing Argan Hair Shampoo — 750 ml','hair',28900,36000,4.5,128,'/img/product-05.jpeg','Argan Oil nourishing shampoo, 750 ml pump bottle','{featured,trending}'),
  ('argan-conditioner-350','Argan Oil','Nourishing Argan Hair Conditioner — 350 ml','hair',26500,null,5.0,64,'/img/product-07.jpeg','Argan Oil nourishing conditioner, brown pump bottle','{featured}'),
  ('argan-masque-200','Argan Oil','Repairing Argan Hair Masque — 200 ml','hair',24000,null,4.5,90,'/img/product-08.jpeg','Argan Oil hair masque, 200 ml jar','{featured,trending}'),
  ('marula-mask-300','Marula Oil','Diamond Edge Intensive Repair Mask — 300 ml','hair',33000,39000,4.0,212,'/img/product-09.jpeg','Marula Oil Diamond Edge intensive repair hair mask, 300 ml tube','{featured,trending}'),
  ('argan-sulfate-free-400','Argan Oil','Sulfate-Free Argan Shampoo — 400 ml','hair',22000,null,4.5,340,'/img/product-06.jpeg','Sulfate-free Argan Oil shampoo, 400 ml bottle','{best}'),
  ('isdin-ureadin-podos-75','ISDIN','Ureadin Podos Foot Gel Oil — 75 ml','body',39000,null,5.0,156,'/img/product-03.jpeg','ISDIN Ureadin Podos foot care hydrating gel oil, 75 ml with box','{best}'),
  ('florative-blue-tox-120','Florative','Blue Tox 5-in-1 Hair Cream — 120 ml','hair',34000,null,4.5,88,'/img/product-12.jpeg','Florative Blue Tox 5-in-1 hair cream, 120 ml bottle','{best}'),
  ('florative-w-one-120','Florative','W One Premium Treatment — 120 ml','hair',31000,null,4.0,47,'/img/product-13.jpeg','Florative W One Premium hair treatment cream, 120 ml bottle','{best}'),
  ('isdin-magic-light-50','ISDIN','Fusion Water Magic Light SPF 50 — 50 ml','sun',92000,null,4.5,21,'/img/product-16.jpeg','ISDIN Fotoprotector Fusion Water Magic Light SPF 50, with box','{new}'),
  ('isdin-fotoultra-age-repair-50','ISDIN','FotoUltra Age Repair Fusion Water SPF 50 — 50 ml','sun',98000,null,4.0,12,'/img/product-18.jpeg','ISDIN FotoUltra Age Repair Fusion Water SPF 50, with box','{new,trending}'),
  ('florative-w-two-plex-120','Florative','W Two Plex Nanoplasty — 120 ml','hair',36000,null,5.0,9,'/img/product-04.jpeg','Florative W Two Plex nanoplasty hair treatment, 120 ml blue bottle','{new}'),
  ('isdin-magic-glow-50','ISDIN','Fusion Water Magic Glow SPF 50 — 50 ml','sun',92000,null,4.5,18,'/img/product-11.jpeg','ISDIN Fusion Water Magic Glow SPF 50, with box','{new}'),
  ('sensilis-water-fluid-color','Sensilis','Water Fluid SPF 50+ Color','sun',55500,null,4.5,40,'/img/product-19.jpeg','Sensilis Water Fluid SPF 50+ Color, antiaging light-texture facial sunscreen','{showcase}'),
  ('sensilis-gel-cream','Sensilis','Gel Cream SPF 50+ Moisturising','sun',77700,null,4.5,33,'/img/product-17.jpeg','Sensilis Gel Cream SPF 50+ moisturising and refreshing sunscreen','{showcase}'),
  ('sensilis-dpigment-color','Sensilis','Photocorrection D-Pigment 50+ Color','sun',58900,null,4.5,27,'/img/product-15.jpeg','Sensilis Photocorrection D-Pigment 50+ Color high-protection mousse','{showcase}'),
  ('sensilis-body-spray','Sensilis','Body Spray SPF 50 Invisible','sun',69500,null,4.5,18,'/img/product-14.jpeg','Sensilis Body Spray SPF 50 Invisible and Light','{showcase}'),
  ('sensilis-matt-gel','Sensilis','Matt Gel 50 Invisible','sun',54600,null,4.5,22,'/img/product-10.jpeg','Sensilis Matt Gel 50 Invisible, oil-free antiaging facial sunscreen','{showcase}'),
  ('sensilis-ha-fluid','Sensilis','Photocorrection HA 50+ Fluid','sun',69900,null,4.5,24,'/img/product-02.jpeg','Sensilis Photocorrection HA 50+ high-protection anti-wrinkle hydrating fluid','{showcase}'),
  ('sensilis-water-fluid','Sensilis','Water Fluid SPF 50+','sun',57900,null,4.5,30,'/img/product-01.jpeg','Sensilis Water Fluid SPF 50+ antiaging light-texture facial sunscreen','{showcase}')
on conflict (id) do update set
  brand=excluded.brand, title=excluded.title, category=excluded.category,
  price_millimes=excluded.price_millimes, old_price_millimes=excluded.old_price_millimes,
  rating=excluded.rating, rating_count=excluded.rating_count,
  image=excluded.image, alt=excluded.alt, tags=excluded.tags;
