ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS fixed_price_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS fixed_unit_price numeric;

COMMENT ON COLUMN public.clients.fixed_price_enabled IS 'When true, client orders can use a fixed sell price override.';
COMMENT ON COLUMN public.clients.fixed_unit_price IS 'Fixed sell price applied per item for this client when fixed_price_enabled=true.';