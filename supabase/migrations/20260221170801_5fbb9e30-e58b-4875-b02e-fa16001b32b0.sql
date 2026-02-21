
-- Create supplier_products table
CREATE TABLE public.supplier_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  reference_sku text,
  unit text NOT NULL DEFAULT 'pcs',
  quantity_received numeric NOT NULL DEFAULT 0,
  quantity_returned numeric NOT NULL DEFAULT 0,
  remaining_stock numeric GENERATED ALWAYS AS (quantity_received - quantity_returned) STORED,
  unit_price numeric NOT NULL DEFAULT 0,
  total_price numeric GENERATED ALWAYS AS (unit_price * quantity_received) STORED,
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  document_url text,
  document_name text,
  low_stock_threshold integer NOT NULL DEFAULT 5,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admin can manage supplier_products"
  ON public.supplier_products
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.supplier_products;
