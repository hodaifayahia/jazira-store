
-- Facebook Pixels table for multiple pixel support
CREATE TABLE public.facebook_pixels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pixel_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.facebook_pixels ENABLE ROW LEVEL SECURITY;

-- Admin can manage
CREATE POLICY "Admin can manage facebook_pixels" ON public.facebook_pixels
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public can read active pixels
CREATE POLICY "Active pixels publicly readable" ON public.facebook_pixels
  FOR SELECT USING (is_active = true);

-- Create trigger for order stock management
CREATE OR REPLACE FUNCTION public.adjust_stock_on_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- When status changes to 'تم التسليم' (delivered), deduct stock
  IF NEW.status = 'تم التسليم' AND (OLD.status IS DISTINCT FROM 'تم التسليم') THEN
    UPDATE products p
    SET stock = GREATEST(0, COALESCE(p.stock, 0) - oi.quantity)
    FROM order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  END IF;

  -- When status changes to 'ملغي' (cancelled) from 'تم التسليم', restore stock
  IF NEW.status = 'ملغي' AND OLD.status = 'تم التسليم' THEN
    UPDATE products p
    SET stock = COALESCE(p.stock, 0) + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  END IF;

  -- When status changes FROM 'ملغي' to 'تم التسليم', deduct again
  IF OLD.status = 'ملغي' AND NEW.status = 'تم التسليم' THEN
    UPDATE products p
    SET stock = GREATEST(0, COALESCE(p.stock, 0) - oi.quantity)
    FROM order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  END IF;

  RETURN NEW;
END;
$function$;

-- Attach trigger to orders table
CREATE TRIGGER trigger_adjust_stock_on_status_change
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.adjust_stock_on_status_change();
