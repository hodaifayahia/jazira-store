
-- Fix 1: Settings - remove public read, keep admin-only
DROP POLICY IF EXISTS "Settings are publicly readable" ON public.settings;

-- Fix 2: Orders - remove the "Anyone can read orders" policy, keep "Users can read own orders" and admin policies
DROP POLICY IF EXISTS "Anyone can read orders" ON public.orders;

-- Fix 3: Product costs - remove public read, keep admin-only
DROP POLICY IF EXISTS "Product costs publicly readable" ON public.product_costs;
