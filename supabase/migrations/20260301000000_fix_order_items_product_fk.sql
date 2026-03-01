-- Make product_id nullable in order_items so products can be deleted
-- even when they are referenced in historical orders.
-- The FK is changed to ON DELETE SET NULL to preserve order history
-- while allowing product deletion.

ALTER TABLE public.order_items
  ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
