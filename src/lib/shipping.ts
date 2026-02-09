import type { CartItem } from '@/contexts/CartContext';

/**
 * Calculate total shipping for an order.
 *
 * Per-product shipping: each item uses its own shippingPrice if > 0,
 * otherwise falls back to the wilaya base price.
 * Total = sum of (effectivePrice * quantity) for each item.
 */
export function calculateShipping(items: CartItem[], wilayaShippingPrice: number): number {
  if (items.length === 0) return 0;
  return items.reduce((sum, item) => {
    const effectivePrice = item.shippingPrice > 0 ? item.shippingPrice : wilayaShippingPrice;
    return sum + effectivePrice * item.quantity;
  }, 0);
}

/**
 * Get per-item shipping breakdown for display.
 */
export function getShippingBreakdown(items: CartItem[], wilayaShippingPrice: number) {
  if (items.length === 0) return [];
  return items.map(item => {
    const effectivePrice = item.shippingPrice > 0 ? item.shippingPrice : wilayaShippingPrice;
    return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      shipping: effectivePrice * item.quantity,
    };
  });
}
