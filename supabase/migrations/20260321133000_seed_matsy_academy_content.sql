-- Seed Matsy Academy content into new database
-- Safe to run multiple times (idempotent by key/slug checks)

-- 1) Basic storefront/settings content
insert into public.settings (key, value)
values
  ('store_name', 'جزيرة الطبيعة'),
  ('footer_description', 'متجر جزيرة الطبيعة — أجود أنواع التمور والعسل الطبيعي والهدايا الفاخرة. نختار لكم أفضل المنتجات الطبيعية من قلب الجزائر.'),
  ('footer_phone', '0560301083'),
  ('footer_address', 'الجزائر'),
  ('academy_hero_title_ar', 'أكاديمية مايسي للتدريب و التطوير'),
  ('academy_hero_subtitle_ar', 'تكوين مهني معتمد في الأمن والوقاية والإرشاد الديني عن بعد'),
  ('academy_whatsapp', 'https://wa.me/213554275994')
on conflict (key) do update set value = excluded.value;

-- 2) Courses as products
with src as (
  select
    'matsy-agent-securite'::text as slug,
    'COURSE-MATSY-001'::text as sku,
    'عون أمن ووقاية المؤسسات'::text as name,
    'تكوين عن بعد مسجل - مبتدئ'::text as short_description,
    'أمن ووقاية - 🔥 عرض خاص - اتصل بنا للسعر عبر واتساب.'::text as description,
    ARRAY['أمن ووقاية','دورات','تكوين معتمد']::text[] as category,
    ARRAY['https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=1200&q=80']::text[] as images,
    0::numeric as price,
    9999::int as stock,
    'digital'::text as product_type,
    true::boolean as is_free_shipping,
    true::boolean as is_active,
    0::numeric as shipping_price

  union all

  select
    'matsy-inspecteur-securite',
    'COURSE-MATSY-002',
    'مفتش أمن ووقاية المؤسسات',
    'تكوين عن بعد مسجل - متوسط',
    'أمن ووقاية - ⭐ الأكثر طلباً - اتصل بنا للسعر عبر واتساب.',
    ARRAY['أمن ووقاية','دورات','تكوين معتمد']::text[],
    ARRAY['https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1200&q=80']::text[],
    0::numeric,
    9999::int,
    'digital'::text,
    true::boolean,
    true::boolean,
    0::numeric

  union all

  select
    'matsy-hajj-umrah-guide',
    'COURSE-MATSY-003',
    'المرشد المحترف للحج والعمرة',
    'تكوين عن بعد مسجل - جميع المستويات',
    'إرشاد ديني - 🎁 بونص: مشاركة في قرعة عمرة مجانية - اتصل بنا للسعر عبر واتساب.',
    ARRAY['إرشاد ديني','دورات','تكوين معتمد']::text[],
    ARRAY['https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1200&q=80']::text[],
    0::numeric,
    9999::int,
    'digital'::text,
    true::boolean,
    true::boolean,
    0::numeric
)
insert into public.products (
  slug,
  sku,
  name,
  short_description,
  description,
  category,
  images,
  main_image_index,
  price,
  stock,
  product_type,
  is_free_shipping,
  is_active,
  shipping_price
)
select
  s.slug,
  s.sku,
  s.name,
  s.short_description,
  s.description,
  s.category,
  s.images,
  0,
  s.price,
  s.stock,
  s.product_type,
  s.is_free_shipping,
  s.is_active,
  s.shipping_price
from src s
where not exists (
  select 1 from public.products p where p.slug = s.slug
);

-- Keep course records updated if they already exist
update public.products p
set
  sku = s.sku,
  name = s.name,
  short_description = s.short_description,
  description = s.description,
  category = s.category,
  images = s.images,
  main_image_index = 0,
  price = s.price,
  stock = s.stock,
  product_type = s.product_type,
  is_free_shipping = s.is_free_shipping,
  is_active = s.is_active,
  shipping_price = s.shipping_price
from (
  select
    'matsy-agent-securite'::text as slug,
    'COURSE-MATSY-001'::text as sku,
    'عون أمن ووقاية المؤسسات'::text as name,
    'تكوين عن بعد مسجل - مبتدئ'::text as short_description,
    'أمن ووقاية - 🔥 عرض خاص - اتصل بنا للسعر عبر واتساب.'::text as description,
    ARRAY['أمن ووقاية','دورات','تكوين معتمد']::text[] as category,
    ARRAY['https://images.unsplash.com/photo-1581093458791-9f3c3900df4b?auto=format&fit=crop&w=1200&q=80']::text[] as images,
    0::numeric as price,
    9999::int as stock,
    'digital'::text as product_type,
    true::boolean as is_free_shipping,
    true::boolean as is_active,
    0::numeric as shipping_price
  union all
  select
    'matsy-inspecteur-securite','COURSE-MATSY-002','مفتش أمن ووقاية المؤسسات','تكوين عن بعد مسجل - متوسط',
    'أمن ووقاية - ⭐ الأكثر طلباً - اتصل بنا للسعر عبر واتساب.',
    ARRAY['أمن ووقاية','دورات','تكوين معتمد']::text[],
    ARRAY['https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1200&q=80']::text[],
    0::numeric,9999::int,'digital'::text,true::boolean,true::boolean,0::numeric
  union all
  select
    'matsy-hajj-umrah-guide','COURSE-MATSY-003','المرشد المحترف للحج والعمرة','تكوين عن بعد مسجل - جميع المستويات',
    'إرشاد ديني - 🎁 بونص: مشاركة في قرعة عمرة مجانية - اتصل بنا للسعر عبر واتساب.',
    ARRAY['إرشاد ديني','دورات','تكوين معتمد']::text[],
    ARRAY['https://images.unsplash.com/photo-1591604466107-ec97de577aff?auto=format&fit=crop&w=1200&q=80']::text[],
    0::numeric,9999::int,'digital'::text,true::boolean,true::boolean,0::numeric
) s
where p.slug = s.slug;

-- 3) Testimonials as reviews linked to the 3 courses
with r as (
  select
    'matsy-agent-securite'::text as slug,
    'آية بن سالم'::text as reviewer_name,
    5::int as rating,
    'منصة منظمة جداً، والمحتوى واضح وسهل التطبيق.'::text as comment
  union all
  select
    'matsy-inspecteur-securite','محمد الأمين',5,'الدورات المهنية ساعدتني مباشرة في العمل.'
  union all
  select
    'matsy-hajj-umrah-guide','خديجة موساوي',5,'تجربة تعلم رائعة مع متابعة ممتازة.'
)
insert into public.reviews (product_id, reviewer_name, rating, comment)
select p.id, r.reviewer_name, r.rating, r.comment
from r
join public.products p on p.slug = r.slug
where not exists (
  select 1
  from public.reviews rv
  where rv.product_id = p.id
    and rv.reviewer_name = r.reviewer_name
    and coalesce(rv.comment, '') = coalesce(r.comment, '')
);
