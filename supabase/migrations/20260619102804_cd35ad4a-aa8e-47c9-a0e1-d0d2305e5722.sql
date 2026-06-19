
-- 1) ORDERS: remove permissive public SELECT
DROP POLICY IF EXISTS "Anyone can read orders by order_number" ON public.orders;

CREATE OR REPLACE FUNCTION public.get_order_tracking(p_order_number text)
RETURNS TABLE (
  order_number text,
  status text,
  created_at timestamptz,
  total_amount numeric,
  customer_name text,
  customer_phone text,
  baladiya text,
  delivery_type text,
  payment_method text,
  wilaya_name text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.order_number, o.status, o.created_at, o.total_amount,
         o.customer_name, o.customer_phone, o.baladiya, o.delivery_type,
         o.payment_method, w.name AS wilaya_name
  FROM public.orders o
  LEFT JOIN public.wilayas w ON w.id = o.wilaya_id
  WHERE o.order_number = upper(p_order_number)
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_order_tracking(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_tracking(text) TO anon, authenticated;

-- 2) ABANDONED ORDERS: remove broad anon access; expose via SECURITY DEFINER RPCs
DROP POLICY IF EXISTS "Anyone can update abandoned orders" ON public.abandoned_orders;
DROP POLICY IF EXISTS "Anyone can insert abandoned orders" ON public.abandoned_orders;

CREATE OR REPLACE FUNCTION public.upsert_abandoned_order(
  p_name text,
  p_phone text,
  p_wilaya text,
  p_cart_items jsonb,
  p_cart_total numeric,
  p_item_count int,
  p_notes text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF p_phone IS NULL OR length(trim(p_phone)) < 8 THEN
    RAISE EXCEPTION 'invalid phone';
  END IF;
  SELECT id INTO v_id FROM public.abandoned_orders
    WHERE customer_phone = p_phone AND status = 'abandoned'
    ORDER BY created_at DESC LIMIT 1;
  IF v_id IS NULL THEN
    INSERT INTO public.abandoned_orders
      (customer_name, customer_phone, customer_wilaya, cart_items, cart_total, item_count, notes)
    VALUES (p_name, p_phone, p_wilaya, p_cart_items, p_cart_total, p_item_count, p_notes)
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.abandoned_orders SET
      customer_name = p_name,
      customer_wilaya = p_wilaya,
      cart_items = p_cart_items,
      cart_total = p_cart_total,
      item_count = p_item_count,
      notes = COALESCE(p_notes, notes),
      updated_at = now()
    WHERE id = v_id;
  END IF;
  RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.upsert_abandoned_order(text,text,text,jsonb,numeric,int,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_abandoned_order(text,text,text,jsonb,numeric,int,text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.mark_abandoned_recovered(p_phone text, p_order_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.abandoned_orders
     SET status = 'recovered', recovered_order_id = p_order_id, updated_at = now()
   WHERE customer_phone = p_phone AND status IN ('abandoned','contacted');
$$;
REVOKE ALL ON FUNCTION public.mark_abandoned_recovered(text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_abandoned_recovered(text,uuid) TO anon, authenticated;

-- 3) RETURNS: drop public SELECT policies; admin policies remain
DROP POLICY IF EXISTS "Return requests publicly readable" ON public.return_requests;
DROP POLICY IF EXISTS "Return items publicly readable" ON public.return_items;
DROP POLICY IF EXISTS "Return status history publicly readable" ON public.return_status_history;

-- 4) STORAGE: tighten products and store buckets to admin role only
DROP POLICY IF EXISTS "Admin can delete products" ON storage.objects;
DROP POLICY IF EXISTS "Admin can update products" ON storage.objects;
DROP POLICY IF EXISTS "Admin can upload products" ON storage.objects;
CREATE POLICY "Admin can upload products" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'products' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update products" ON storage.objects FOR UPDATE
  USING (bucket_id = 'products' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete products" ON storage.objects FOR DELETE
  USING (bucket_id = 'products' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin can manage store" ON storage.objects;
CREATE POLICY "Admin can upload store" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'store' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update store" ON storage.objects FOR UPDATE
  USING (bucket_id = 'store' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can delete store" ON storage.objects FOR DELETE
  USING (bucket_id = 'store' AND public.has_role(auth.uid(), 'admin'));
