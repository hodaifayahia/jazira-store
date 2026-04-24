-- Seed store selling products (honey/dates) into new database
-- Compatible with current products schema

insert into public.settings (key, value)
values
  ('store_name', 'جزيرة الطبيعة'),
  ('footer_description', 'متجر جزيرة الطبيعة — أجود أنواع التمور والعسل الطبيعي والهدايا الفاخرة. نختار لكم أفضل المنتجات الطبيعية من قلب الجزائر.'),
  ('footer_phone', '0560301083'),
  ('footer_address', 'الجزائر')
on conflict (key) do update set value = excluded.value;

insert into public.products (
  slug,
  sku,
  name,
  short_description,
  description,
  category,
  images,
  price,
  old_price,
  stock,
  is_active,
  is_free_shipping,
  has_variants,
  product_type,
  offer_title
)
values
  ('honey-multiflower', 'HON-001', 'عسل متعدد الازهار', 'عسل طبيعي نقي متعدد الأزهار', 'عسل طبيعي فاخر متعدد الأزهار من مناحل مختارة.', 'عسل', ARRAY['https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=1200&q=80'], 1300, null, 4, true, false, false, 'physical', null),
  ('honey-mountain', 'HON-002', 'عسل الجبلي', 'عسل جبلي طبيعي', 'عسل جبلي نقي بطعم غني وجودة عالية.', 'عسل', ARRAY['https://images.unsplash.com/photo-1471943311424-646960669fbc?auto=format&fit=crop&w=1200&q=80'], 1300, null, 38, true, false, false, 'physical', null),
  ('honey-loubina', 'HON-003', 'عسل اللبينة', 'عسل اللبينة الطبيعي', 'عسل اللبينة الطبيعي بتركيبة متوازنة ومذاق مميز.', 'عسل', ARRAY['https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=1200&q=80'], 1300, null, 38, true, false, false, 'physical', null),
  ('dates-premium', 'DAT-001', 'تمر', 'تمر طبيعي فاخر', 'تمر جزائري فاخر بجودة عالية مناسب للاستهلاك اليومي والضيافة.', 'تمر', ARRAY['https://images.unsplash.com/photo-1603048719539-9ecbcb38b5c4?auto=format&fit=crop&w=1200&q=80'], 950, null, 21, true, false, false, 'physical', null),
  ('honey-thistles', 'HON-004', 'عسل الشوكيات', 'عسل الشوكيات الطبيعي', 'عسل الشوكيات بنكهة غنية وقيمة غذائية ممتازة.', 'عسل', ARRAY['https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?auto=format&fit=crop&w=1200&q=80'], 1300, null, 16, true, false, false, 'physical', null),
  ('honey-eucalyptus', 'HON-005', 'عسل الكاليتوس', 'عسل الكاليتوس الطبيعي', 'عسل الكاليتوس (الأوكالبتوس) الطبيعي بجودة عالية.', 'عسل', ARRAY['https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=1200&q=80'], 1350, null, 106, true, false, false, 'physical', null),
  ('honey-orange', 'HON-006', 'عسل البرتقال', 'عسل البرتقال الطبيعي', 'عسل البرتقال بنكهة لطيفة ومذاق مميز.', 'عسل', ARRAY['https://images.unsplash.com/photo-1471943311424-646960669fbc?auto=format&fit=crop&w=1200&q=80'], 1100, null, 154, true, false, false, 'physical', null),
  ('dates-pack-5', 'DAT-005', '5 تمرات', 'عبوة تمر اقتصادية', 'عبوة صغيرة من التمر مناسبة للتجربة أو التوزيع.', 'تمر', ARRAY['https://images.unsplash.com/photo-1603048719539-9ecbcb38b5c4?auto=format&fit=crop&w=1200&q=80'], 30, null, 20, true, false, false, 'physical', null),
  ('honey-sidr', 'HON-007', 'عسل السدرة', 'عسل السدرة الأصلي', 'عسل السدرة الأصلي بتركيز عالي وجودة ممتازة.', 'عسل', ARRAY['https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=1200&q=80'], 1850, null, 106, true, false, false, 'physical', null),
  ('dates-deglet', 'DAT-002', 'تمر دقلة نور', 'تمر دقلة نور ممتاز', 'تمر دقلة نور جزائري فاخر مناسب للاستهلاك اليومي والهدايا.', 'تمر', ARRAY['https://images.unsplash.com/photo-1603048719539-9ecbcb38b5c4?auto=format&fit=crop&w=1200&q=80'], 1200, null, 45, true, false, false, 'physical', null);
