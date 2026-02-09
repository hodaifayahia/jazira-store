
-- Drop all existing restrictive policies
DROP POLICY IF EXISTS "Admin can manage products" ON public.products;
DROP POLICY IF EXISTS "Products are publicly readable" ON public.products;
DROP POLICY IF EXISTS "Admin can manage coupons" ON public.coupons;
DROP POLICY IF EXISTS "Coupons are publicly readable" ON public.coupons;
DROP POLICY IF EXISTS "Admin can manage settings" ON public.settings;
DROP POLICY IF EXISTS "Settings are publicly readable" ON public.settings;
DROP POLICY IF EXISTS "Admin can manage wilayas" ON public.wilayas;
DROP POLICY IF EXISTS "Wilayas are publicly readable" ON public.wilayas;
DROP POLICY IF EXISTS "Admin can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Admin can update orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can read orders by order_number" ON public.orders;
DROP POLICY IF EXISTS "Admin can manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Anyone can read order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;

-- products
CREATE POLICY "Products are publicly readable" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admin can manage products" ON public.products FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- coupons
CREATE POLICY "Coupons are publicly readable" ON public.coupons FOR SELECT USING (true);
CREATE POLICY "Admin can manage coupons" ON public.coupons FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- settings
CREATE POLICY "Settings are publicly readable" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admin can manage settings" ON public.settings FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- wilayas
CREATE POLICY "Wilayas are publicly readable" ON public.wilayas FOR SELECT USING (true);
CREATE POLICY "Admin can manage wilayas" ON public.wilayas FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- orders
CREATE POLICY "Anyone can read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Anyone can insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can update orders" ON public.orders FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete orders" ON public.orders FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- order_items
CREATE POLICY "Anyone can read order items" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can manage order items" ON public.order_items FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Add unique constraint on settings.key for upsert support
ALTER TABLE public.settings ADD CONSTRAINT settings_key_unique UNIQUE (key);
