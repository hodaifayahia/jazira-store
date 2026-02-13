
-- Landing pages table
CREATE TABLE public.landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id),
  title text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'ar',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  selected_image text,
  generated_images text[] DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage landing_pages"
  ON public.landing_pages FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Landing pages publicly readable"
  ON public.landing_pages FOR SELECT
  USING (true);

-- Add landing_page_id to orders
ALTER TABLE public.orders ADD COLUMN landing_page_id uuid REFERENCES public.landing_pages(id);
