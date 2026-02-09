import type { CartItem } from '@/contexts/CartContext';

/**
 * Extra shipping cost per additional item (after the first).
 * Change this single value to adjust the formula.
 */
const EXTRA_PER_ADDITIONAL_ITEM = 0;

/**
 * Calculate total shipping for an order.
 *
 * Formula: wilayaBasePrice + (totalQty - 1) * EXTRA_PER_ADDITIONAL_ITEM
 * With EXTRA = 0, this equals wilayaBasePrice * totalQty.
 */
export function calculateShipping(items: CartItem[], wilayaShippingPrice: number): number {
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  if (totalQty === 0) return 0;
  return wilayaShippingPrice + (totalQty - 1) * EXTRA_PER_ADDITIONAL_ITEM;
}

/**
 * Get per-item shipping breakdown for display.
 */
export function getShippingBreakdown(items: CartItem[], wilayaShippingPrice: number) {
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
  if (totalQty === 0) return [];

  let index = 0;
  return items.map(item => {
    let itemShipping = 0;
    for (let q = 0; q < item.quantity; q++) {
      itemShipping += index === 0 ? wilayaShippingPrice : EXTRA_PER_ADDITIONAL_ITEM;
      index++;
    }
    return { id: item.id, name: item.name, quantity: item.quantity, shipping: itemShipping };
  });
}
