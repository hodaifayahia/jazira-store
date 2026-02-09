
-- Create leads table for tracking potential customers
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  source TEXT DEFAULT 'موقع',
  status TEXT DEFAULT 'جديد',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Leads are readable by admin
CREATE POLICY "Admin can manage leads"
  ON public.leads
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Anyone can insert leads (e.g. from contact forms)
CREATE POLICY "Anyone can create leads"
  ON public.leads
  FOR INSERT
  WITH CHECK (true);
