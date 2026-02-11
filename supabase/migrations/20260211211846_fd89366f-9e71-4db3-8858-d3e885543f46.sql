
-- Create confirmers table
CREATE TABLE public.confirmers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'private',
  confirmation_price NUMERIC DEFAULT 0,
  cancellation_price NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.confirmers ENABLE ROW LEVEL SECURITY;

-- Admin-only full access
CREATE POLICY "Admin can manage confirmers"
ON public.confirmers
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));
