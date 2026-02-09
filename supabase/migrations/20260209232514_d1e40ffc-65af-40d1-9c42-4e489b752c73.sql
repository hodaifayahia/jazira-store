
-- Abstract variation options (templates)
CREATE TABLE public.variation_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variation_type text NOT NULL,
  variation_value text NOT NULL,
  color_code text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(variation_type, variation_value)
);

ALTER TABLE variation_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variation options are publicly readable"
  ON variation_options FOR SELECT USING (true);

CREATE POLICY "Admin can manage variation options"
  ON variation_options FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
