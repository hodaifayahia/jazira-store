
-- Option groups per product
CREATE TABLE product_option_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  display_type text NOT NULL DEFAULT 'button',
  position integer DEFAULT 0,
  UNIQUE(product_id, name)
);

-- Option values per group
CREATE TABLE product_option_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_group_id uuid NOT NULL REFERENCES product_option_groups(id) ON DELETE CASCADE,
  label varchar(100) NOT NULL,
  color_hex varchar(7),
  position integer DEFAULT 0,
  UNIQUE(option_group_id, label)
);

-- Combinatorial variants
CREATE TABLE product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku varchar(100),
  price numeric NOT NULL,
  compare_at_price numeric,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  weight_grams integer,
  barcode varchar(100),
  image_url text,
  is_active boolean DEFAULT true,
  option_values jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Join table for relational integrity
CREATE TABLE product_variant_options (
  variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  option_value_id uuid NOT NULL REFERENCES product_option_values(id) ON DELETE CASCADE,
  PRIMARY KEY (variant_id, option_value_id)
);

-- Add has_variants to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants boolean DEFAULT false;

-- Add variant_id to order_items (nullable for backward compat)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_active ON product_variants(product_id, is_active);
CREATE INDEX idx_option_groups_product ON product_option_groups(product_id);

-- RLS for product_option_groups
ALTER TABLE product_option_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Option groups publicly readable" ON product_option_groups FOR SELECT USING (true);
CREATE POLICY "Admin can manage option groups" ON product_option_groups FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS for product_option_values
ALTER TABLE product_option_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Option values publicly readable" ON product_option_values FOR SELECT USING (true);
CREATE POLICY "Admin can manage option values" ON product_option_values FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS for product_variants
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Variants publicly readable" ON product_variants FOR SELECT USING (true);
CREATE POLICY "Admin can manage variants" ON product_variants FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS for product_variant_options
ALTER TABLE product_variant_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Variant options publicly readable" ON product_variant_options FOR SELECT USING (true);
CREATE POLICY "Admin can manage variant options" ON product_variant_options FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
