
-- New columns on products
ALTER TABLE products ADD COLUMN IF NOT EXISTS old_price numeric;
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_free_shipping boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug text;
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique 
  ON products(slug) WHERE slug IS NOT NULL AND slug != '';

-- Bundle offers table
CREATE TABLE product_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity integer NOT NULL,
  price numeric NOT NULL,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE product_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product offers publicly readable"
  ON product_offers FOR SELECT USING (true);

CREATE POLICY "Admin can manage product offers"
  ON product_offers FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
