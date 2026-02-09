CREATE TABLE public.coupon_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  UNIQUE(coupon_id, product_id)
);

ALTER TABLE public.coupon_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Coupon products publicly readable"
  ON public.coupon_products FOR SELECT USING (true);

CREATE POLICY "Admin can manage coupon products"
  ON public.coupon_products FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));