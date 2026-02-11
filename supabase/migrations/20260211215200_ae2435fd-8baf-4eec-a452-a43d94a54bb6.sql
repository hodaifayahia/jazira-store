
DO $$
DECLARE
  -- Wilaya IDs
  w_alger UUID;
  w_oran UUID;
  w_constantine UUID;
  w_setif UUID;
  w_blida UUID;
  w_batna UUID;
  w_tizi UUID;
  w_bejaia UUID;
  w_annaba UUID;
  w_tlemcen UUID;

  -- Product IDs
  p1 UUID := gen_random_uuid();
  p2 UUID := gen_random_uuid();
  p3 UUID := gen_random_uuid();
  p4 UUID := gen_random_uuid();
  p5 UUID := gen_random_uuid();
  p6 UUID := gen_random_uuid();
  p7 UUID := gen_random_uuid();
  p8 UUID := gen_random_uuid();
  p9 UUID := gen_random_uuid();
  p10 UUID := gen_random_uuid();

  -- Variant IDs (for p1, p2, p3)
  v1a UUID := gen_random_uuid();
  v1b UUID := gen_random_uuid();
  v1c UUID := gen_random_uuid();
  v1d UUID := gen_random_uuid();
  v2a UUID := gen_random_uuid();
  v2b UUID := gen_random_uuid();
  v2c UUID := gen_random_uuid();
  v2d UUID := gen_random_uuid();
  v3a UUID := gen_random_uuid();
  v3b UUID := gen_random_uuid();
  v3c UUID := gen_random_uuid();
  v3d UUID := gen_random_uuid();

  -- Option group IDs
  og1_size UUID := gen_random_uuid();
  og1_color UUID := gen_random_uuid();
  og2_size UUID := gen_random_uuid();
  og3_color UUID := gen_random_uuid();

  -- Option value IDs
  ov_s UUID := gen_random_uuid();
  ov_m UUID := gen_random_uuid();
  ov_l UUID := gen_random_uuid();
  ov_xl UUID := gen_random_uuid();
  ov_black UUID := gen_random_uuid();
  ov_white UUID := gen_random_uuid();
  ov_blue UUID := gen_random_uuid();
  ov_red UUID := gen_random_uuid();
  ov2_s UUID := gen_random_uuid();
  ov2_m UUID := gen_random_uuid();
  ov2_l UUID := gen_random_uuid();
  ov2_xl UUID := gen_random_uuid();
  ov3_silver UUID := gen_random_uuid();
  ov3_gold UUID := gen_random_uuid();
  ov3_black UUID := gen_random_uuid();

  -- Coupon IDs
  c1 UUID := gen_random_uuid();
  c2 UUID := gen_random_uuid();
  c3 UUID := gen_random_uuid();

  -- Confirmer IDs
  conf1 UUID := gen_random_uuid();
  conf2 UUID := gen_random_uuid();
  conf3 UUID := gen_random_uuid();

  -- Order IDs
  o1 UUID := gen_random_uuid();
  o2 UUID := gen_random_uuid();
  o3 UUID := gen_random_uuid();
  o4 UUID := gen_random_uuid();
  o5 UUID := gen_random_uuid();
  o6 UUID := gen_random_uuid();
  o7 UUID := gen_random_uuid();
  o8 UUID := gen_random_uuid();
  o9 UUID := gen_random_uuid();
  o10 UUID := gen_random_uuid();
  o11 UUID := gen_random_uuid();
  o12 UUID := gen_random_uuid();
  o13 UUID := gen_random_uuid();
  o14 UUID := gen_random_uuid();
  o15 UUID := gen_random_uuid();
  o16 UUID := gen_random_uuid();
  o17 UUID := gen_random_uuid();
  o18 UUID := gen_random_uuid();
  o19 UUID := gen_random_uuid();
  o20 UUID := gen_random_uuid();
  o21 UUID := gen_random_uuid();
  o22 UUID := gen_random_uuid();
  o23 UUID := gen_random_uuid();
  o24 UUID := gen_random_uuid();
  o25 UUID := gen_random_uuid();

  -- Order item IDs
  oi UUID;

  -- Return reason IDs
  rr1 UUID := gen_random_uuid();
  rr2 UUID := gen_random_uuid();
  rr3 UUID := gen_random_uuid();
  rr4 UUID := gen_random_uuid();

  -- Return request IDs
  ret1 UUID := gen_random_uuid();
  ret2 UUID := gen_random_uuid();
  ret3 UUID := gen_random_uuid();
  ret4 UUID := gen_random_uuid();

  -- Order item IDs we need to reference for returns
  oi_for_ret1 UUID := gen_random_uuid();
  oi_for_ret2 UUID := gen_random_uuid();
  oi_for_ret3 UUID := gen_random_uuid();
  oi_for_ret4 UUID := gen_random_uuid();

BEGIN

  -- ==========================================
  -- 1. SETTINGS
  -- ==========================================
  INSERT INTO settings (key, value) VALUES
    ('store_name', 'متجر الأناقة'),
    ('store_description', 'متجر إلكتروني متخصص في بيع الملابس والإكسسوارات'),
    ('currency', 'DZD'),
    ('currency_symbol', 'د.ج'),
    ('phone', '0555123456'),
    ('email', 'contact@elegance-store.dz'),
    ('address', 'شارع ديدوش مراد، الجزائر العاصمة'),
    ('facebook_url', 'https://facebook.com/elegance.dz'),
    ('instagram_url', 'https://instagram.com/elegance.dz'),
    ('announcement_text', '🎉 تخفيضات تصل إلى 30% على جميع المنتجات!'),
    ('announcement_active', 'true'),
    ('announcement_bg_color', '#dc2626'),
    ('free_shipping_threshold', '5000'),
    ('categories', '[{"name":"ملابس","icon":"Shirt"},{"name":"إكسسوارات","icon":"Watch"},{"name":"أحذية","icon":"Footprints"},{"name":"إلكترونيات","icon":"Smartphone"},{"name":"منزل","icon":"Home"}]'),
    ('logo_url', '');

  -- ==========================================
  -- 2. PRODUCTS (10 products)
  -- ==========================================
  INSERT INTO products (id, name, slug, description, short_description, category, price, old_price, stock, images, is_active, has_variants, sku, shipping_price, is_free_shipping, created_at) VALUES
    (p1, 'قميص رياضي رجالي', 'qamis-riyadi', 'قميص رياضي عالي الجودة مصنوع من القطن المصري 100%. مريح للارتداء اليومي والتمارين الرياضية. متوفر بعدة مقاسات وألوان.', 'قميص رياضي قطن مصري', ARRAY['ملابس'], 2500, 3200, 150, ARRAY['https://placehold.co/600x600/2563eb/white?text=قميص+رياضي'], true, true, 'TSH-001', 0, true, now() - interval '25 days'),
    (p2, 'بنطلون جينز كلاسيكي', 'jeans-classic', 'بنطلون جينز كلاسيكي بقصة مستقيمة. قماش متين ومريح للارتداء اليومي. متوفر بعدة مقاسات.', 'جينز كلاسيكي مريح', ARRAY['ملابس'], 3800, 4500, 80, ARRAY['https://placehold.co/600x600/1e3a5f/white?text=جينز+كلاسيكي'], true, true, 'JNS-001', 200, false, now() - interval '22 days'),
    (p3, 'ساعة يد أنيقة', 'montre-elegante', 'ساعة يد رجالية أنيقة بتصميم عصري. مقاومة للماء مع سوار من الستانلس ستيل. ضمان سنة كاملة.', 'ساعة يد رجالية عصرية', ARRAY['إكسسوارات'], 8500, 12000, 45, ARRAY['https://placehold.co/600x600/d4af37/white?text=ساعة+يد'], true, true, 'WTC-001', 300, false, now() - interval '20 days'),
    (p4, 'حذاء رياضي خفيف', 'chaussure-sport', 'حذاء رياضي خفيف الوزن بنعل مطاطي مرن. مثالي للجري والمشي اليومي. تصميم عصري ومريح.', 'حذاء رياضي مريح وخفيف', ARRAY['أحذية'], 4200, 5500, 60, ARRAY['https://placehold.co/600x600/16a34a/white?text=حذاء+رياضي'], true, false, 'SHO-001', 250, false, now() - interval '18 days'),
    (p5, 'حقيبة ظهر للحاسوب', 'sac-laptop', 'حقيبة ظهر عملية مع جيب مبطن للحاسوب المحمول حتى 15.6 بوصة. مقاومة للماء مع عدة جيوب للتنظيم.', 'حقيبة ظهر مقاومة للماء', ARRAY['إكسسوارات'], 3500, NULL, 35, ARRAY['https://placehold.co/600x600/6b7280/white?text=حقيبة+ظهر'], true, false, 'BAG-001', 200, false, now() - interval '15 days'),
    (p6, 'سماعات بلوتوث لاسلكية', 'ecouteurs-bluetooth', 'سماعات لاسلكية بتقنية البلوتوث 5.0. صوت نقي وبطارية تدوم 8 ساعات. مع علبة شحن.', 'سماعات لاسلكية بلوتوث 5.0', ARRAY['إلكترونيات'], 5500, 7000, 25, ARRAY['https://placehold.co/600x600/7c3aed/white?text=سماعات+بلوتوث'], true, false, 'EAR-001', 150, false, now() - interval '12 days'),
    (p7, 'نظارات شمسية بولارايزد', 'lunettes-soleil', 'نظارات شمسية بعدسات بولارايزد لحماية العين من الأشعة فوق البنفسجية. إطار خفيف ومتين.', 'نظارات شمسية حماية UV', ARRAY['إكسسوارات'], 2800, 3500, 40, ARRAY['https://placehold.co/600x600/f59e0b/white?text=نظارات+شمسية'], true, false, 'SUN-001', 100, false, now() - interval '10 days'),
    (p8, 'محفظة جلدية رجالية', 'portefeuille-cuir', 'محفظة من الجلد الطبيعي بتصميم أنيق. تحتوي على عدة جيوب للبطاقات والأوراق النقدية.', 'محفظة جلد طبيعي', ARRAY['إكسسوارات'], 1800, 2200, 70, ARRAY['https://placehold.co/600x600/92400e/white?text=محفظة+جلدية'], true, false, 'WAL-001', 100, false, now() - interval '8 days'),
    (p9, 'شاحن لاسلكي سريع', 'chargeur-sans-fil', 'شاحن لاسلكي بقوة 15 واط. متوافق مع جميع الهواتف التي تدعم الشحن اللاسلكي. تصميم مسطح وأنيق.', 'شاحن لاسلكي 15 واط', ARRAY['إلكترونيات'], 2200, NULL, 55, ARRAY['https://placehold.co/600x600/0891b2/white?text=شاحن+لاسلكي'], true, false, 'CHR-001', 100, false, now() - interval '5 days'),
    (p10, 'طقم أدوات مطبخ', 'kit-cuisine', 'طقم أدوات مطبخ من 6 قطع مصنوع من الستانلس ستيل. يشمل سكين، مقص، مبشرة، وأدوات أخرى.', 'طقم مطبخ 6 قطع ستانلس', ARRAY['منزل'], 4800, 6000, 20, ARRAY['https://placehold.co/600x600/dc2626/white?text=أدوات+مطبخ'], true, false, 'KIT-001', 300, false, now() - interval '3 days');

  -- ==========================================
  -- 3. PRODUCT OPTION GROUPS & VALUES (for variants)
  -- ==========================================
  -- P1: Size + Color
  INSERT INTO product_option_groups (id, product_id, name, display_type, position) VALUES
    (og1_size, p1, 'المقاس', 'button', 0),
    (og1_color, p1, 'اللون', 'color', 1);
  INSERT INTO product_option_values (id, option_group_id, label, color_hex, position) VALUES
    (ov_s, og1_size, 'S', NULL, 0),
    (ov_m, og1_size, 'M', NULL, 1),
    (ov_l, og1_size, 'L', NULL, 2),
    (ov_xl, og1_size, 'XL', NULL, 3),
    (ov_black, og1_color, 'أسود', '#000000', 0),
    (ov_white, og1_color, 'أبيض', '#FFFFFF', 1);

  -- P2: Size
  INSERT INTO product_option_groups (id, product_id, name, display_type, position) VALUES
    (og2_size, p2, 'المقاس', 'button', 0);
  INSERT INTO product_option_values (id, option_group_id, label, position) VALUES
    (ov2_s, og2_size, '38', 0),
    (ov2_m, og2_size, '40', 1),
    (ov2_l, og2_size, '42', 2),
    (ov2_xl, og2_size, '44', 3);

  -- P3: Color
  INSERT INTO product_option_groups (id, product_id, name, display_type, position) VALUES
    (og3_color, p3, 'اللون', 'color', 0);
  INSERT INTO product_option_values (id, option_group_id, label, color_hex, position) VALUES
    (ov3_silver, og3_color, 'فضي', '#C0C0C0', 0),
    (ov3_gold, og3_color, 'ذهبي', '#FFD700', 1),
    (ov3_black, og3_color, 'أسود', '#000000', 2);

  -- ==========================================
  -- 3b. PRODUCT VARIANTS
  -- ==========================================
  INSERT INTO product_variants (id, product_id, price, quantity, sku, option_values, is_active) VALUES
    (v1a, p1, 2500, 40, 'TSH-001-S-BLK', '{"المقاس":"S","اللون":"أسود"}', true),
    (v1b, p1, 2500, 35, 'TSH-001-M-BLK', '{"المقاس":"M","اللون":"أسود"}', true),
    (v1c, p1, 2700, 30, 'TSH-001-L-WHT', '{"المقاس":"L","اللون":"أبيض"}', true),
    (v1d, p1, 2700, 25, 'TSH-001-XL-WHT', '{"المقاس":"XL","اللون":"أبيض"}', true),
    (v2a, p2, 3800, 25, 'JNS-001-38', '{"المقاس":"38"}', true),
    (v2b, p2, 3800, 20, 'JNS-001-40', '{"المقاس":"40"}', true),
    (v2c, p2, 3800, 20, 'JNS-001-42', '{"المقاس":"42"}', true),
    (v2d, p2, 4000, 15, 'JNS-001-44', '{"المقاس":"44"}', true),
    (v3a, p3, 8500, 15, 'WTC-001-SLV', '{"اللون":"فضي"}', true),
    (v3b, p3, 9000, 15, 'WTC-001-GLD', '{"اللون":"ذهبي"}', true),
    (v3c, p3, 8500, 15, 'WTC-001-BLK', '{"اللون":"أسود"}', true);

  -- Link variants to option values
  INSERT INTO product_variant_options (variant_id, option_value_id) VALUES
    (v1a, ov_s), (v1a, ov_black),
    (v1b, ov_m), (v1b, ov_black),
    (v1c, ov_l), (v1c, ov_white),
    (v1d, ov_xl), (v1d, ov_white),
    (v2a, ov2_s), (v2b, ov2_m), (v2c, ov2_l), (v2d, ov2_xl),
    (v3a, ov3_silver), (v3b, ov3_gold), (v3c, ov3_black);

  -- ==========================================
  -- 4. PRODUCT COSTS (all 10 products)
  -- ==========================================
  INSERT INTO product_costs (product_id, variant_id, purchase_cost, packaging_cost, storage_cost, other_cost, other_cost_label) VALUES
    (p1, NULL, 1200, 50, 0, 30, 'ملصقات'),
    (p2, NULL, 1800, 60, 0, 0, NULL),
    (p3, NULL, 3500, 100, 50, 200, 'علبة فاخرة'),
    (p4, NULL, 2000, 80, 0, 50, 'أربطة إضافية'),
    (p5, NULL, 1500, 40, 0, 0, NULL),
    (p6, NULL, 2200, 30, 0, 100, 'علبة شحن'),
    (p7, NULL, 1000, 30, 0, 0, NULL),
    (p8, NULL, 700, 20, 0, 0, NULL),
    (p9, NULL, 900, 20, 0, 0, NULL),
    (p10, NULL, 2200, 100, 30, 0, NULL);

  -- Variant-specific cost overrides for p3 (gold watch costs more)
  INSERT INTO product_costs (product_id, variant_id, purchase_cost, packaging_cost, storage_cost, other_cost, other_cost_label) VALUES
    (p3, v3b, 4000, 100, 50, 200, 'علبة فاخرة ذهبية');

  -- ==========================================
  -- 5. COUPONS
  -- ==========================================
  INSERT INTO coupons (id, code, discount_type, discount_value, is_active, expiry_date) VALUES
    (c1, 'WELCOME10', 'percentage', 10, true, now() + interval '60 days'),
    (c2, 'FLAT500', 'fixed', 500, true, now() + interval '30 days'),
    (c3, 'SUMMER20', 'percentage', 20, false, now() - interval '10 days');

  -- Link coupon to specific products
  INSERT INTO coupon_products (coupon_id, product_id) VALUES
    (c1, p1), (c1, p2), (c1, p3);

  -- ==========================================
  -- 6. CONFIRMERS
  -- ==========================================
  INSERT INTO confirmers (id, name, phone, email, type, payment_mode, confirmation_price, cancellation_price, monthly_salary, status, notes) VALUES
    (conf1, 'أمينة بوعلام', '0551234567', 'amina@confirmer.dz', 'private', 'per_order', 50, 20, 0, 'active', 'مؤكدة ممتازة - نسبة تأكيد عالية'),
    (conf2, 'كريم حداد', '0661234567', 'karim@confirmer.dz', 'private', 'per_order', 60, 25, 0, 'active', NULL),
    (conf3, 'سارة مزياني', '0771234567', 'sara@confirmer.dz', 'private', 'monthly', 0, 0, 25000, 'active', 'موظفة بدوام كامل');

  -- ==========================================
  -- 7. WILAYAS - Get existing IDs
  -- ==========================================
  SELECT id INTO w_alger FROM wilayas WHERE name = 'الجزائر' LIMIT 1;
  SELECT id INTO w_oran FROM wilayas WHERE name = 'وهران' LIMIT 1;
  SELECT id INTO w_constantine FROM wilayas WHERE name = 'قسنطينة' LIMIT 1;
  SELECT id INTO w_setif FROM wilayas WHERE name = 'سطيف' LIMIT 1;
  SELECT id INTO w_blida FROM wilayas WHERE name = 'البليدة' LIMIT 1;
  SELECT id INTO w_batna FROM wilayas WHERE name = 'باتنة' LIMIT 1;
  SELECT id INTO w_tizi FROM wilayas WHERE name = 'تيزي وزو' LIMIT 1;
  SELECT id INTO w_bejaia FROM wilayas WHERE name = 'بجاية' LIMIT 1;
  SELECT id INTO w_annaba FROM wilayas WHERE name = 'عنابة' LIMIT 1;
  SELECT id INTO w_tlemcen FROM wilayas WHERE name = 'تلمسان' LIMIT 1;

  -- If wilayas don't exist yet, create some
  IF w_alger IS NULL THEN
    w_alger := gen_random_uuid();
    w_oran := gen_random_uuid();
    w_constantine := gen_random_uuid();
    w_setif := gen_random_uuid();
    w_blida := gen_random_uuid();
    w_batna := gen_random_uuid();
    w_tizi := gen_random_uuid();
    w_bejaia := gen_random_uuid();
    w_annaba := gen_random_uuid();
    w_tlemcen := gen_random_uuid();

    INSERT INTO wilayas (id, name, shipping_price, shipping_price_home, is_active) VALUES
      (w_alger, 'الجزائر', 400, 600, true),
      (w_oran, 'وهران', 500, 700, true),
      (w_constantine, 'قسنطينة', 500, 700, true),
      (w_setif, 'سطيف', 450, 650, true),
      (w_blida, 'البليدة', 350, 550, true),
      (w_batna, 'باتنة', 550, 750, true),
      (w_tizi, 'تيزي وزو', 450, 650, true),
      (w_bejaia, 'بجاية', 500, 700, true),
      (w_annaba, 'عنابة', 550, 750, true),
      (w_tlemcen, 'تلمسان', 600, 800, true);
  END IF;

  -- ==========================================
  -- 8. ORDERS (25 orders) + ORDER ITEMS
  -- ==========================================
  -- Order 1: Delivered, Alger
  INSERT INTO orders (id, order_number, customer_name, customer_phone, wilaya_id, baladiya, address, delivery_type, status, subtotal, shipping_cost, discount_amount, total_amount, payment_method, created_at) VALUES
    (o1, '', 'محمد بن علي', '0555111222', w_alger, 'بئر مراد رايس', 'حي 200 مسكن، عمارة 5', 'home', 'تم التوصيل', 5000, 600, 0, 5600, 'cod', now() - interval '28 days');
  INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES
    (oi_for_ret1, o1, p1, 2, 2500);

  -- Order 2: Delivered, Oran
  INSERT INTO orders (id, order_number, customer_name, customer_phone, wilaya_id, baladiya, delivery_type, status, subtotal, shipping_cost, discount_amount, total_amount, payment_method, created_at) VALUES
    (o2, '', 'فاطمة الزهراء', '0661222333', w_oran, 'السانية', 'office', 'تم التوصيل', 8500, 500, 0, 9000, 'cod', now() - interval '27 days');
  INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES
    (oi_for_ret2, o2, p3, 1, 8500);

  -- Order 3: Delivered, Constantine
  INSERT INTO orders (id, order_number, customer_name, customer_phone, wilaya_id, baladiya, delivery_type, status, subtotal, shipping_cost, discount_amount, total_amount, payment_method, created_at) VALUES
    (o3, '', 'يوسف حمادي', '0772333444', w_constantine, 'الخروب', 'office', 'تم التوصيل', 4200, 500, 0, 4700, 'cod', now() - interval '25 days');
  INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
    (o3, p4, 1, 4200);

  -- Order 4: Delivered, Setif
  INSERT INTO orders (id, order_number, customer_name, customer_phone, wilaya_id, baladiya, delivery_type, status, subtotal, shipping_cost, discount_amount, total_amount, payment_method, coupon_code, created_at) VALUES
    (o4, '', 'نورالدين عمراني', '0553444555', w_setif, 'العلمة', 'office', 'تم التوصيل', 6300, 450, 630, 6120, 'cod', 'WELCOME10', now() - interval '24 days');
  INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
    (o4, p1, 1, 2500),
    (o4, p2, 1, 3800);

  -- Order 5: Delivered, Blida
  INSERT INTO orders (id, order_number, customer_name, customer_phone, wilaya_id, baladiya, delivery_type, status, subtotal, shipping_cost, discount_amount, total_amount, payment_method, created_at) VALUES
    (o5, '', 'سمية بلقاسم', '0664555666', w_blida, 'بوفاريك', 'home', 'تم التوصيل', 3500, 550, 0, 4050, 'cod', now() - interval '22 days');
  INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
    (o5, p5, 1, 3500);

  -- Order 6: Delivered, Batna
  INSERT INTO orders (id, order_number, customer_name, customer_phone, wilaya_id, baladiya, delivery_type, status, subtotal, shipping_cost, discount_amount, total_amount, payment_method, created_at) VALUES
    (o6, '', 'عبد الرحمان شريف', '0775666777', w_batna, 'باتنة', 'office', 'تم التوصيل', 5500, 550, 0, 6050, 'cod', now() - interval '20 days');
  INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES
    (oi_for_ret3, o6, p6, 1, 5500);

  -- Order 7: Delivered, Tizi
  INSERT INTO orders (id, order_number, customer_name, customer_phone, wilaya_id, baladiya, delivery_type, status, subtotal, shipping_cost, discount_amount, total_amount, payment_method, created_at) VALUES
    (o7, '', 'ليلى عيساني', '0556777888', w_tizi, 'عزازقة', 'office', 'تم التوصيل', 2800, 450, 0, 3250, 'cod', now() - interval '18 days');
  INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
    (o7, p7, 1, 2800);

  -- Order 8: Delivered, Bejaia
  INSERT INTO orders (id, order_number, customer_name, customer_phone, wilaya_id, baladiya, delivery_type, status, subtotal, shipping_cost, discount_amount, total_amount, payment_method, created_at) VALUES
    (o8, '', 'أحمد بوزيد', '0667888999', w_bejaia, 'أقبو', 'home', 'تم التوصيل', 7000, 700, 500, 7200, 'cod', now() - interval '16 days');
  INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
    (o8, p1, 1, 2500),
    (o8, p8, 1, 1800),
    (o8, p9, 1, 2200);
  INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
    (o8, p7, 1, 500); -- extra small item

  -- Order 9: Delivered, Annaba
  INSERT INTO orders (id, order_number, customer_name, customer_phone, wilaya_id, baladiya, delivery_type, status, subtotal, shipping_cost, discount_amount, total_amount, payment_method, created_at) VALUES
    (o9, '', 'خالد مرابط', '0778999000', w_annaba, 'الحجار', 'office', 'تم التوصيل', 4800, 550, 0, 5350, 'cod', now() - interval '14 days');
  INSERT INTO order_items (id, order_id, product_id, quantity, unit_price) VALUES
    (oi_for_ret4, o9, p10, 1, 4800);

  -- Order 10: Delivered, Tlemcen
  INSERT INTO orders (id, order_number, customer_name, customer_phone, wilaya_id, baladiya, delivery_type, status, subtotal, shipping_cost, discount_amount, total_amount, payment_method, created_at) VALUES
    (o10, '', 'مريم بن يحيى', '0559000111', w_tlemcen, 'مغنية', 'office', 'تم التوصيل', 1800, 600, 0, 2400, 'cod', now() - interval '12 days');
  INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
    (o10, p8, 1, 1800);

  -- Order 11-13: مؤكد (confirmed)
  INSERT INTO orders (id, order_number, customer_name, customer_phone, wilaya_id, baladiya, delivery_type, status, subtotal, shipping_cost, total_amount, payment_method, created_at) VALUES
    (o11, '', 'عمر بوخالفة', '0552111222', w_alger, 'الدار البيضاء', 'home', 'مؤكد', 2500, 600, 3100, 'cod', now() - interval '5 days'),
    (o12, '', 'حنان سعيدي', '0663222333', w_oran, 'بئر الجير', 'office', 'مؤكد', 3800, 500, 4300, 'cod', now() - interval '4 days'),
    (o13, '', 'رضا ملياني', '0774333444', w_constantine, 'عين سمارة', 'office', 'مؤكد', 5500, 500, 6000, 'cod', now() - interval '3 days');
  INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
    (o11, p1, 1, 2500),
    (o12, p2, 1, 3800),
    (o13, p6, 1, 5500);

  -- Order 14-16: قيد التوصيل (shipping)
  INSERT INTO orders (id, order_number, customer_name, customer_phone, wilaya_id, baladiya, delivery_type, status, subtotal, shipping_cost, total_amount, payment_method, created_at) VALUES
    (o14, '', 'إسماعيل قاسمي', '0555444555', w_setif, 'سطيف', 'home', 'قيد التوصيل', 8500, 650, 9150, 'cod', now() - interval '3 days'),
    (o15, '', 'دليلة بوعزيز', '0666555666', w_blida, 'الأربعاء', 'office', 'قيد التوصيل', 4200, 350, 4550, 'cod', now() - interval '2 days'),
    (o16, '', 'ياسين مقراني', '0777666777', w_batna, 'عين التوتة', 'home', 'قيد التوصيل', 6300, 750, 7050, 'cod', now() - interval '2 days');
  INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
    (o14, p3, 1, 8500),
    (o15, p4, 1, 4200),
    (o16, p1, 1, 2500),
    (o16, p2, 1, 3800);

  -- Order 17-19: جديد (new)
  INSERT INTO orders (id, order_number, customer_name, customer_phone, wilaya_id, baladiya, delivery_type, status, subtotal, shipping_cost, total_amount, payment_method, created_at) VALUES
    (o17, '', 'صابرينة عمار', '0558777888', w_tizi, 'ذراع الميزان', 'office', 'جديد', 2200, 450, 2650, 'cod', now() - interval '1 day'),
    (o18, '', 'بلال حسيني', '0669888999', w_bejaia, 'سيدي عيش', 'home', 'جديد', 3500, 700, 4200, 'cod', now() - interval '12 hours'),
    (o19, '', 'نادية فرحات', '0770999000', w_annaba, 'عنابة', 'office', 'جديد', 11300, 550, 11850, 'cod', now() - interval '6 hours');
  INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
    (o17, p9, 1, 2200),
    (o18, p5, 1, 3500),
    (o19, p3, 1, 8500),
    (o19, p7, 1, 2800);

  -- Order 20-22: ملغي (cancelled)
  INSERT INTO orders (id, order_number, customer_name, customer_phone, wilaya_id, baladiya, delivery_type, status, subtotal, shipping_cost, total_amount, payment_method, created_at) VALUES
    (o20, '', 'عادل بوطالب', '0551000111', w_alger, 'باب الزوار', 'home', 'ملغي', 2500, 600, 3100, 'cod', now() - interval '20 days'),
    (o21, '', 'وفاء مصطفاي', '0662111222', w_oran, 'حاسي بونيف', 'office', 'ملغي', 8500, 500, 9000, 'cod', now() - interval '15 days'),
    (o22, '', 'رشيد بلحاج', '0773222333', w_constantine, 'ديدوش مراد', 'office', 'ملغي', 4200, 500, 4700, 'cod', now() - interval '10 days');
  INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
    (o20, p1, 1, 2500),
    (o21, p3, 1, 8500),
    (o22, p4, 1, 4200);

  -- Order 23-25: مرتجع (returned)
  INSERT INTO orders (id, order_number, customer_name, customer_phone, wilaya_id, baladiya, delivery_type, status, subtotal, shipping_cost, total_amount, payment_method, created_at) VALUES
    (o23, '', 'سليمان بوعكاز', '0554333444', w_setif, 'عين ولمان', 'office', 'مرتجع', 3800, 450, 4250, 'cod', now() - interval '18 days'),
    (o24, '', 'أسماء خليفة', '0665444555', w_blida, 'موزاية', 'home', 'مرتجع', 5500, 550, 6050, 'cod', now() - interval '13 days'),
    (o25, '', 'توفيق بن ناصر', '0776555666', w_batna, 'مروانة', 'office', 'مرتجع', 2800, 550, 3350, 'cod', now() - interval '8 days');
  INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
    (o23, p2, 1, 3800),
    (o24, p6, 1, 5500),
    (o25, p7, 1, 2800);

  -- ==========================================
  -- 9. LEADS
  -- ==========================================
  INSERT INTO leads (name, phone, status, source, notes, created_at) VALUES
    ('كمال بوزيان', '0557111222', 'جديد', 'فيسبوك', 'مهتم بالساعات', now() - interval '10 days'),
    ('هدى بن سعيد', '0668222333', 'جديد', 'إنستغرام', 'سألت عن الأحذية الرياضية', now() - interval '8 days'),
    ('مراد شعباني', '0779333444', 'تم التواصل', 'موقع', 'تم الاتصال، سيشتري الأسبوع القادم', now() - interval '7 days'),
    ('سعاد بلعيد', '0550444555', 'مهتم', 'فيسبوك', 'تريد طقم المطبخ', now() - interval '5 days'),
    ('فريد مسعودي', '0661555666', 'تم التحويل', 'تيك توك', 'اشترى حقيبة ظهر', now() - interval '4 days'),
    ('نسرين عبدلي', '0772666777', 'جديد', 'إنستغرام', NULL, now() - interval '3 days'),
    ('عزالدين بوحفص', '0553777888', 'غير مهتم', 'فيسبوك', 'قال السعر مرتفع', now() - interval '2 days'),
    ('إيمان قورصو', '0664888999', 'جديد', 'موقع', 'طلبت معلومات عن النظارات', now() - interval '1 day');

  -- ==========================================
  -- 10. REVIEWS
  -- ==========================================
  INSERT INTO reviews (product_id, reviewer_name, rating, comment, created_at) VALUES
    (p1, 'محمد أ.', 5, 'قميص ممتاز والقماش جودة عالية جداً. أنصح به بشدة!', now() - interval '20 days'),
    (p1, 'أحمد ب.', 4, 'جيد لكن المقاس أكبر قليلاً من المتوقع', now() - interval '15 days'),
    (p1, 'كريم ل.', 5, 'رائع! طلبت واحد ثاني بلون مختلف', now() - interval '10 days'),
    (p2, 'يوسف م.', 4, 'جينز مريح وعملي. القماش متين', now() - interval '18 days'),
    (p2, 'عمر ح.', 3, 'عادي، كنت أتوقع جودة أفضل بهذا السعر', now() - interval '12 days'),
    (p3, 'فاطمة ز.', 5, 'ساعة رائعة! هدية مثالية. التغليف كان ممتاز', now() - interval '22 days'),
    (p3, 'سمية ب.', 4, 'جميلة جداً لكن الحزام ضيق قليلاً', now() - interval '14 days'),
    (p4, 'إسماعيل ق.', 5, 'حذاء مريح جداً للجري. خفيف وعملي', now() - interval '16 days'),
    (p5, 'دليلة ع.', 4, 'حقيبة عملية ومقاومة للماء فعلاً', now() - interval '11 days'),
    (p6, 'ياسين م.', 5, 'صوت السماعات نقي والبطارية تدوم طويلاً', now() - interval '13 days'),
    (p6, 'رضا ف.', 2, 'البلوتوث ينقطع أحياناً. غير راضي', now() - interval '8 days'),
    (p7, 'حنان س.', 4, 'نظارات أنيقة وخفيفة. العدسات واضحة', now() - interval '9 days'),
    (p8, 'بلال ح.', 5, 'محفظة جلدية ممتازة. الجلد طبيعي فعلاً', now() - interval '7 days'),
    (p9, 'نادية ف.', 3, 'الشاحن يعمل لكن الشحن بطيء نوعاً ما', now() - interval '4 days'),
    (p10, 'عادل ب.', 4, 'طقم مطبخ جيد. السكين حاد والأدوات متينة', now() - interval '2 days');

  -- ==========================================
  -- 11. ABANDONED ORDERS
  -- ==========================================
  INSERT INTO abandoned_orders (customer_name, customer_phone, customer_wilaya, cart_items, item_count, cart_total, status, abandoned_at, created_at) VALUES
    ('رابح بوقرة', '0558111222', 'الجزائر', '[{"name":"قميص رياضي رجالي","price":2500,"quantity":2},{"name":"محفظة جلدية","price":1800,"quantity":1}]'::jsonb, 3, 6800, 'abandoned', now() - interval '6 days', now() - interval '6 days'),
    ('زينب مراد', '0669222333', 'وهران', '[{"name":"ساعة يد أنيقة","price":8500,"quantity":1}]'::jsonb, 1, 8500, 'abandoned', now() - interval '4 days', now() - interval '4 days'),
    ('حسام بلعباسي', '0770333444', 'البليدة', '[{"name":"حذاء رياضي خفيف","price":4200,"quantity":1},{"name":"شاحن لاسلكي","price":2200,"quantity":1}]'::jsonb, 2, 6400, 'abandoned', now() - interval '3 days', now() - interval '3 days'),
    ('أميرة جبالي', '0551444555', 'تيزي وزو', '[{"name":"سماعات بلوتوث","price":5500,"quantity":1}]'::jsonb, 1, 5500, 'contacted', now() - interval '2 days', now() - interval '2 days'),
    ('منير عيسى', '0662555666', 'سطيف', '[{"name":"طقم أدوات مطبخ","price":4800,"quantity":1},{"name":"نظارات شمسية","price":2800,"quantity":1}]'::jsonb, 2, 7600, 'abandoned', now() - interval '1 day', now() - interval '1 day');

  -- ==========================================
  -- 12. RETURN REASONS
  -- ==========================================
  INSERT INTO return_reasons (id, label_ar, fault_type, requires_photos, position, is_active) VALUES
    (rr1, 'المنتج تالف أو مكسور', 'merchant_fault', true, 1, true),
    (rr2, 'المنتج لا يطابق الوصف', 'merchant_fault', true, 2, true),
    (rr3, 'المقاس غير مناسب', 'customer_fault', false, 3, true),
    (rr4, 'غيرت رأيي', 'customer_fault', false, 4, true);

  -- ==========================================
  -- 13. RETURN REQUESTS + ITEMS + STATUS HISTORY
  -- ==========================================
  -- Return 1: Requested (against order o1)
  INSERT INTO return_requests (id, return_number, order_id, customer_name, customer_phone, reason_id, reason_notes, resolution_type, status, total_refund_amount, return_shipping_cost, shipping_paid_by, net_refund_amount, requested_at, created_at) VALUES
    (ret1, '', o1, 'محمد بن علي', '0555111222', rr3, 'المقاس كبير جداً', 'refund', 'requested', 2500, 400, 'customer', 2100, now() - interval '5 days', now() - interval '5 days');
  INSERT INTO return_items (return_request_id, order_item_id, product_id, product_name, quantity_ordered, quantity_returned, unit_price, item_total) VALUES
    (ret1, oi_for_ret1, p1, 'قميص رياضي رجالي', 2, 1, 2500, 2500);
  INSERT INTO return_status_history (return_request_id, from_status, to_status, change_reason, created_at) VALUES
    (ret1, NULL, 'requested', 'طلب إرجاع جديد', now() - interval '5 days');

  -- Return 2: Approved (against order o2)
  INSERT INTO return_requests (id, return_number, order_id, customer_name, customer_phone, reason_id, reason_notes, resolution_type, status, total_refund_amount, return_shipping_cost, shipping_paid_by, net_refund_amount, requested_at, approved_at, created_at) VALUES
    (ret2, '', o2, 'فاطمة الزهراء', '0661222333', rr1, 'الساعة بها خدش على الزجاج', 'refund', 'approved', 8500, 0, 'merchant', 8500, now() - interval '8 days', now() - interval '6 days', now() - interval '8 days');
  INSERT INTO return_items (return_request_id, order_item_id, product_id, product_name, quantity_ordered, quantity_returned, unit_price, item_total, item_condition) VALUES
    (ret2, oi_for_ret2, p3, 'ساعة يد أنيقة', 1, 1, 8500, 8500, 'damaged');
  INSERT INTO return_status_history (return_request_id, from_status, to_status, change_reason, created_at) VALUES
    (ret2, NULL, 'requested', 'طلب إرجاع جديد', now() - interval '8 days'),
    (ret2, 'requested', 'approved', 'تمت الموافقة - خطأ المتجر', now() - interval '6 days');

  -- Return 3: Completed (against order o6)
  INSERT INTO return_requests (id, return_number, order_id, customer_name, customer_phone, reason_id, reason_notes, resolution_type, status, total_refund_amount, return_shipping_cost, shipping_paid_by, net_refund_amount, requested_at, approved_at, completed_at, refunded_at, refund_method, created_at) VALUES
    (ret3, '', o6, 'عبد الرحمان شريف', '0775666777', rr2, 'اللون مختلف عن الصورة', 'refund', 'completed', 5500, 0, 'merchant', 5500, now() - interval '15 days', now() - interval '13 days', now() - interval '10 days', now() - interval '10 days', 'ccp', now() - interval '15 days');
  INSERT INTO return_items (return_request_id, order_item_id, product_id, product_name, quantity_ordered, quantity_returned, unit_price, item_total, item_condition, restocked) VALUES
    (ret3, oi_for_ret3, p6, 'سماعات بلوتوث لاسلكية', 1, 1, 5500, 5500, 'good', true);
  INSERT INTO return_status_history (return_request_id, from_status, to_status, change_reason, created_at) VALUES
    (ret3, NULL, 'requested', 'طلب إرجاع جديد', now() - interval '15 days'),
    (ret3, 'requested', 'approved', 'تمت الموافقة', now() - interval '13 days'),
    (ret3, 'approved', 'completed', 'تم استلام المنتج وإرجاع المبلغ', now() - interval '10 days');

  -- Return 4: Rejected (against order o9)
  INSERT INTO return_requests (id, return_number, order_id, customer_name, customer_phone, reason_id, reason_notes, resolution_type, status, total_refund_amount, return_shipping_cost, shipping_paid_by, net_refund_amount, rejection_reason, requested_at, created_at) VALUES
    (ret4, '', o9, 'خالد مرابط', '0778999000', rr4, 'لم يعجبني المنتج', 'refund', 'rejected', 4800, 550, 'customer', 4250, 'تجاوز مهلة الإرجاع المسموحة (7 أيام)', now() - interval '3 days', now() - interval '3 days');
  INSERT INTO return_items (return_request_id, order_item_id, product_id, product_name, quantity_ordered, quantity_returned, unit_price, item_total) VALUES
    (ret4, oi_for_ret4, p10, 'طقم أدوات مطبخ', 1, 1, 4800, 4800);
  INSERT INTO return_status_history (return_request_id, from_status, to_status, change_reason, created_at) VALUES
    (ret4, NULL, 'requested', 'طلب إرجاع جديد', now() - interval '3 days'),
    (ret4, 'requested', 'rejected', 'تجاوز مهلة الإرجاع', now() - interval '2 days');

  -- ==========================================
  -- 14. PRODUCT OFFERS (bundle deals)
  -- ==========================================
  INSERT INTO product_offers (product_id, quantity, price, description, position) VALUES
    (p1, 2, 4500, 'اشتري 2 قمصان بـ 4500 د.ج بدل 5000 د.ج', 1),
    (p1, 3, 6000, 'اشتري 3 قمصان بـ 6000 د.ج بدل 7500 د.ج', 2),
    (p8, 2, 3000, 'اشتري 2 محافظ بـ 3000 د.ج بدل 3600 د.ج', 1);

  -- ==========================================
  -- 15. VARIATION OPTIONS (global options library)
  -- ==========================================
  INSERT INTO variation_options (variation_type, variation_value, color_code, is_active) VALUES
    ('اللون', 'أسود', '#000000', true),
    ('اللون', 'أبيض', '#FFFFFF', true),
    ('اللون', 'أزرق', '#2563EB', true),
    ('اللون', 'أحمر', '#DC2626', true),
    ('اللون', 'رمادي', '#6B7280', true),
    ('اللون', 'أخضر', '#16A34A', true),
    ('المقاس', 'S', NULL, true),
    ('المقاس', 'M', NULL, true),
    ('المقاس', 'L', NULL, true),
    ('المقاس', 'XL', NULL, true),
    ('المقاس', 'XXL', NULL, true),
    ('المقاس', '38', NULL, true),
    ('المقاس', '40', NULL, true),
    ('المقاس', '42', NULL, true),
    ('المقاس', '44', NULL, true);

  -- ==========================================
  -- 16. RETURN SETTINGS
  -- ==========================================
  INSERT INTO return_settings (is_returns_enabled, return_window_days, require_return_photos, max_photos_per_return, auto_approve_returns, allow_refund, allow_exchange, allow_store_credit, return_policy_text) VALUES
    (true, 7, true, 5, false, true, true, true, 'يمكنك إرجاع المنتج خلال 7 أيام من تاريخ الاستلام. يجب أن يكون المنتج في حالته الأصلية مع التغليف.');

  -- ==========================================
  -- 17. CONFIRMATION SETTINGS
  -- ==========================================
  INSERT INTO confirmation_settings (assignment_mode, max_call_attempts, auto_timeout_minutes, working_hours_start, working_hours_end, enable_confirm_chat) VALUES
    ('manual', 3, 30, '08:00', '20:00', false);

END $$;
