
CREATE TABLE public.product_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variation_type text NOT NULL,
  variation_value text NOT NULL,
  price_adjustment numeric DEFAULT 0,
  stock integer DEFAULT 0,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variations are publicly readable"
ON public.product_variations
FOR SELECT
USING (true);

CREATE POLICY "Admin can manage variations"
ON public.product_variations
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
