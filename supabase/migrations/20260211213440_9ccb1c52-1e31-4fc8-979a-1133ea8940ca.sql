
-- ═══ RMA Phase 1: Return Management Tables ═══

-- 1. return_settings (single row, global config)
CREATE TABLE public.return_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_window_days INTEGER NOT NULL DEFAULT 7,
  allow_refund BOOLEAN NOT NULL DEFAULT true,
  allow_exchange BOOLEAN NOT NULL DEFAULT true,
  allow_store_credit BOOLEAN NOT NULL DEFAULT true,
  auto_approve_returns BOOLEAN NOT NULL DEFAULT false,
  require_return_photos BOOLEAN NOT NULL DEFAULT true,
  max_photos_per_return INTEGER NOT NULL DEFAULT 5,
  return_policy_text TEXT,
  is_returns_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.return_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage return_settings" ON public.return_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Return settings publicly readable" ON public.return_settings FOR SELECT USING (true);

-- Seed default row
INSERT INTO public.return_settings (id) VALUES (gen_random_uuid());

-- 2. return_reasons
CREATE TABLE public.return_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label_ar TEXT NOT NULL,
  fault_type TEXT NOT NULL DEFAULT 'customer_fault',
  requires_photos BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.return_reasons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage return_reasons" ON public.return_reasons FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Return reasons publicly readable" ON public.return_reasons FOR SELECT USING (true);

-- Seed default reasons
INSERT INTO public.return_reasons (label_ar, fault_type, position) VALUES
  ('منتج معيب / تالف', 'merchant_fault', 0),
  ('منتج خاطئ', 'merchant_fault', 1),
  ('لا يطابق الوصف', 'merchant_fault', 2),
  ('مقاس خاطئ', 'merchant_fault', 3),
  ('غير راضٍ عن المنتج', 'customer_fault', 4),
  ('أخرى', 'customer_fault', 5);

-- 3. return_requests
CREATE TABLE public.return_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  return_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  resolution_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested',
  reason_id UUID REFERENCES public.return_reasons(id),
  reason_notes TEXT,
  merchant_notes TEXT,
  rejection_reason TEXT,
  total_refund_amount NUMERIC NOT NULL DEFAULT 0,
  return_shipping_cost NUMERIC NOT NULL DEFAULT 0,
  shipping_paid_by TEXT NOT NULL DEFAULT 'customer',
  net_refund_amount NUMERIC NOT NULL DEFAULT 0,
  refund_method TEXT,
  refund_reference TEXT,
  refunded_at TIMESTAMPTZ,
  pickup_tracking_number TEXT,
  pickup_scheduled_at TIMESTAMPTZ,
  item_received_at TIMESTAMPTZ,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_return_requests_status ON public.return_requests(status);
CREATE INDEX idx_return_requests_order ON public.return_requests(order_id);
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage return_requests" ON public.return_requests FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can insert return_requests" ON public.return_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Return requests publicly readable" ON public.return_requests FOR SELECT USING (true);

-- 4. return_items
CREATE TABLE public.return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_request_id UUID NOT NULL REFERENCES public.return_requests(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES public.order_items(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  variant_id UUID REFERENCES public.product_variants(id),
  product_name TEXT NOT NULL,
  variant_label TEXT,
  quantity_ordered INTEGER NOT NULL,
  quantity_returned INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  item_total NUMERIC NOT NULL,
  item_condition TEXT,
  restock_decision TEXT,
  restocked BOOLEAN NOT NULL DEFAULT false,
  exchange_product_id UUID REFERENCES public.products(id),
  exchange_product_name TEXT,
  exchange_unit_price NUMERIC,
  price_difference NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_return_items_request ON public.return_items(return_request_id);
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage return_items" ON public.return_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Return items publicly readable" ON public.return_items FOR SELECT USING (true);

-- 5. return_photos
CREATE TABLE public.return_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_request_id UUID NOT NULL REFERENCES public.return_requests(id) ON DELETE CASCADE,
  return_item_id UUID REFERENCES public.return_items(id),
  url TEXT NOT NULL,
  caption TEXT,
  uploaded_by TEXT NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.return_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage return_photos" ON public.return_photos FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can insert return_photos" ON public.return_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Return photos publicly readable" ON public.return_photos FOR SELECT USING (true);

-- 6. return_status_history
CREATE TABLE public.return_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_request_id UUID NOT NULL REFERENCES public.return_requests(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID,
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_return_status_history ON public.return_status_history(return_request_id, created_at);
ALTER TABLE public.return_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage return_status_history" ON public.return_status_history FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Return status history publicly readable" ON public.return_status_history FOR SELECT USING (true);

-- Storage bucket for return photos
INSERT INTO storage.buckets (id, name, public) VALUES ('returns', 'returns', true);
CREATE POLICY "Anyone can view return photos" ON storage.objects FOR SELECT USING (bucket_id = 'returns');
CREATE POLICY "Anyone can upload return photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'returns');
CREATE POLICY "Admin can manage return photos" ON storage.objects FOR ALL USING (bucket_id = 'returns' AND has_role(auth.uid(), 'admin'::app_role));

-- Return number generator trigger
CREATE OR REPLACE FUNCTION public.generate_return_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  today_str TEXT;
  seq INTEGER;
BEGIN
  today_str := to_char(NOW(), 'YYYYMMDD');
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(return_number FROM LENGTH('RET-' || today_str || '-') + 1) AS INTEGER)
  ), 0) + 1
  INTO seq
  FROM public.return_requests
  WHERE return_number LIKE 'RET-' || today_str || '-%';
  
  NEW.return_number := 'RET-' || today_str || '-' || LPAD(seq::TEXT, 3, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_return_number
  BEFORE INSERT ON public.return_requests
  FOR EACH ROW
  WHEN (NEW.return_number IS NULL OR NEW.return_number = '')
  EXECUTE FUNCTION public.generate_return_number();
