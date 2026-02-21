
-- Create the update_updated_at_column function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create suppliers table
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text,
  contact_name text,
  contact_phone text,
  contact_email text,
  notes text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage suppliers"
  ON public.suppliers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create supplier_transactions table
CREATE TABLE public.supplier_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  items_received numeric NOT NULL DEFAULT 0,
  items_given numeric NOT NULL DEFAULT 0,
  transaction_type text NOT NULL DEFAULT 'receipt',
  notes text,
  document_url text,
  document_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.supplier_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage supplier_transactions"
  ON public.supplier_transactions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.supplier_transactions;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('supplier-documents', 'supplier-documents', true);

CREATE POLICY "Admin can upload supplier docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'supplier-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update supplier docs"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'supplier-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete supplier docs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'supplier-documents' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Supplier docs publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'supplier-documents');
