-- Allow confirmers to update order status
CREATE POLICY "Confirmer can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'confirmer'::app_role))
WITH CHECK (has_role(auth.uid(), 'confirmer'::app_role));