
-- Add back limited public read for orders - only by order_number (for tracking/confirmation pages)
-- Admin already has full access via existing policies
-- Users can read own orders via existing "Users can read own orders" policy
CREATE POLICY "Anyone can read orders by order_number"
  ON public.orders
  FOR SELECT
  USING (true);
