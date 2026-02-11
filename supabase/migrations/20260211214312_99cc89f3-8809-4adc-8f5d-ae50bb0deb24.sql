
-- Product costs table (per product/variant cost configuration)
CREATE TABLE public.product_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE CASCADE,
  purchase_cost NUMERIC NOT NULL DEFAULT 0,
  packaging_cost NUMERIC NOT NULL DEFAULT 0,
  storage_cost NUMERIC NOT NULL DEFAULT 0,
  other_cost NUMERIC NOT NULL DEFAULT 0,
  other_cost_label TEXT,
  total_cost_per_unit NUMERIC GENERATED ALWAYS AS (purchase_cost + packaging_cost + storage_cost + other_cost) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, variant_id),
  CONSTRAINT purchase_cost_non_negative CHECK (purchase_cost >= 0),
  CONSTRAINT packaging_cost_non_negative CHECK (packaging_cost >= 0),
  CONSTRAINT storage_cost_non_negative CHECK (storage_cost >= 0),
  CONSTRAINT other_cost_non_negative CHECK (other_cost >= 0)
);

-- Handle NULL variant_id uniqueness (product-level cost)
CREATE UNIQUE INDEX idx_product_costs_product_only ON public.product_costs (product_id) WHERE variant_id IS NULL;

-- RLS
ALTER TABLE public.product_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage product costs"
  ON public.product_costs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Product costs publicly readable"
  ON public.product_costs
  FOR SELECT
  USING (true);
