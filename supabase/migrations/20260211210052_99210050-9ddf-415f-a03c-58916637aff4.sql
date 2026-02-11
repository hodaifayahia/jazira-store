
-- Create abandoned_orders table
CREATE TABLE public.abandoned_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_wilaya TEXT,
  cart_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  cart_total NUMERIC NOT NULL DEFAULT 0,
  item_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'abandoned',
  recovered_order_id UUID REFERENCES public.orders(id),
  notes TEXT,
  abandoned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_abandoned_orders_phone ON public.abandoned_orders(customer_phone);
CREATE INDEX idx_abandoned_orders_status ON public.abandoned_orders(status);

-- Enable RLS
ALTER TABLE public.abandoned_orders ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (from checkout page)
CREATE POLICY "Anyone can insert abandoned orders"
ON public.abandoned_orders
FOR INSERT
WITH CHECK (true);

-- Anyone can update (for upsert from checkout - matched by phone)
CREATE POLICY "Anyone can update abandoned orders"
ON public.abandoned_orders
FOR UPDATE
USING (true);

-- Admin can do everything
CREATE POLICY "Admin can manage abandoned orders"
ON public.abandoned_orders
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin can read
CREATE POLICY "Admin can read abandoned orders"
ON public.abandoned_orders
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
