ALTER TABLE public.products
  ADD COLUMN offer_title text,
  ADD COLUMN offer_ends_at timestamptz;