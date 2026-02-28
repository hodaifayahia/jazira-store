
-- Create delivery_companies table
CREATE TABLE public.delivery_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  api_key TEXT,
  api_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_builtin BOOLEAN NOT NULL DEFAULT false,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_companies ENABLE ROW LEVEL SECURITY;

-- Admin-only management
CREATE POLICY "Admin can manage delivery_companies"
  ON public.delivery_companies
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert built-in Algerian delivery companies
INSERT INTO public.delivery_companies (name, api_url, is_builtin) VALUES
  ('Yalidine', 'https://api.yalidine.app', true),
  ('ZR Express', 'https://api.zrexpress.com', true),
  ('Maystro Delivery', 'https://api.maystro-delivery.com', true),
  ('EcoTrack', 'https://api.ecotrack.dz', true),
  ('Procolis', 'https://procolis.com/api', true),
  ('GLS Algeria', NULL, true),
  ('E-Com Delivery', NULL, true),
  ('DHD Logistics', NULL, true),
  ('Guepex', NULL, true),
  ('Rapid Delivery', NULL, true);
