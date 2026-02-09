
-- Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  category TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are publicly readable" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage products" ON public.products
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Wilayas table
CREATE TABLE public.wilayas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  shipping_price NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.wilayas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wilayas are publicly readable" ON public.wilayas
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage wilayas" ON public.wilayas
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  wilaya_id UUID REFERENCES public.wilayas(id),
  address TEXT,
  subtotal NUMERIC,
  shipping_cost NUMERIC,
  total_amount NUMERIC,
  payment_method TEXT,
  payment_receipt_url TEXT,
  status TEXT DEFAULT 'جديد',
  coupon_code TEXT,
  discount_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert orders" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read orders by order_number" ON public.orders
  FOR SELECT USING (true);

CREATE POLICY "Admin can update orders" ON public.orders
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admin can delete orders" ON public.orders
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Order items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert order items" ON public.order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read order items" ON public.order_items
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage order items" ON public.order_items
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Settings table
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings are publicly readable" ON public.settings
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage settings" ON public.settings
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Coupons table
CREATE TABLE public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL,
  discount_value NUMERIC NOT NULL,
  expiry_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coupons are publicly readable" ON public.coupons
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage coupons" ON public.coupons
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Auto-generate order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.orders;
  NEW.order_number := 'ORD-' || LPAD(next_num::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL OR NEW.order_number = '')
  EXECUTE FUNCTION public.generate_order_number();

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('store', 'store', true);

-- Storage policies
CREATE POLICY "Public can read receipts" ON storage.objects FOR SELECT USING (bucket_id = 'receipts');
CREATE POLICY "Anyone can upload receipts" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'receipts');
CREATE POLICY "Public can read products" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Admin can upload products" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'products' AND auth.uid() IS NOT NULL);
CREATE POLICY "Admin can update products" ON storage.objects FOR UPDATE USING (bucket_id = 'products' AND auth.uid() IS NOT NULL);
CREATE POLICY "Admin can delete products" ON storage.objects FOR DELETE USING (bucket_id = 'products' AND auth.uid() IS NOT NULL);
CREATE POLICY "Public can read store" ON storage.objects FOR SELECT USING (bucket_id = 'store');
CREATE POLICY "Admin can manage store" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'store' AND auth.uid() IS NOT NULL);

-- Seed default settings
INSERT INTO public.settings (key, value) VALUES
  ('ccp_number', '00799999 CLE 99'),
  ('ccp_name', 'اسم صاحب الحساب'),
  ('flexy_number', '0555000000'),
  ('flexy_deposit_amount', '500'),
  ('baridimob_enabled', 'true'),
  ('flexy_enabled', 'true'),
  ('store_name', 'DZ Store'),
  ('store_logo_url', ''),
  ('facebook_url', '');

-- Seed wilayas
INSERT INTO public.wilayas (name, shipping_price) VALUES
  ('أدرار', 800), ('الشلف', 500), ('الأغواط', 700), ('أم البواقي', 600),
  ('باتنة', 600), ('بجاية', 500), ('بسكرة', 650), ('بشار', 800),
  ('البليدة', 400), ('البويرة', 450), ('تمنراست', 900), ('تبسة', 650),
  ('تلمسان', 550), ('تيارت', 550), ('تيزي وزو', 450), ('الجزائر', 350),
  ('الجلفة', 600), ('جيجل', 550), ('سطيف', 500), ('سعيدة', 600),
  ('سكيكدة', 550), ('سيدي بلعباس', 550), ('عنابة', 500), ('قالمة', 550),
  ('قسنطينة', 450), ('المدية', 450), ('مستغانم', 500), ('المسيلة', 550),
  ('معسكر', 550), ('ورقلة', 750), ('وهران', 400), ('البيض', 700),
  ('إليزي', 900), ('برج بوعريريج', 550), ('بومرداس', 400), ('الطارف', 550),
  ('تندوف', 900), ('تيسمسيلت', 550), ('الوادي', 700), ('خنشلة', 600),
  ('سوق أهراس', 600), ('تيبازة', 400), ('ميلة', 550), ('عين الدفلى', 500),
  ('النعامة', 700), ('عين تموشنت', 550), ('غرداية', 750), ('غليزان', 550),
  ('المنيعة', 800), ('المغير', 750), ('أولاد جلال', 650), ('برج باجي مختار', 950),
  ('بني عباس', 850), ('تيميمون', 900), ('تقرت', 700), ('جانت', 950),
  ('عين صالح', 900), ('عين قزام', 950);
