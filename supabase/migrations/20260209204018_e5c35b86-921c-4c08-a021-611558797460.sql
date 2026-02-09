
-- Add shipping_price column for per-product delivery cost
ALTER TABLE public.products ADD COLUMN shipping_price numeric DEFAULT 0;

-- Add main_image_index to track which image is the primary display image
ALTER TABLE public.products ADD COLUMN main_image_index integer DEFAULT 0;

-- Convert category from text to text[] for multi-category support
ALTER TABLE public.products ALTER COLUMN category TYPE text[] USING ARRAY[category];
