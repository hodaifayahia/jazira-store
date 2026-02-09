import type { CartItem } from '@/contexts/CartContext';

interface ProductShippingInfo {
  id: string;
  shipping_price: number | null;
}

/**
 * Calculate total shipping cost for an order.
 * Each product has its own shipping_price. Total = sum of (shipping_price * quantity) for each item.
 * If a product has no shipping_price (null/0), the wilaya base rate is used for that item.
 */
export function calculateShippingForOrder(
  cartItems: CartItem[],
  productShippingMap: Map<string, number>,
  wilayaBaseRate: number
): number {
  return cartItems.reduce((total, item) => {
    const productShipping = productShippingMap.get(item.id);
    const rate = (productShipping && productShipping > 0) ? productShipping : wilayaBaseRate;
    return total + rate * item.quantity;
  }, 0);
}

/**
 * Get shipping breakdown per item for display purposes.
 */
export function getShippingBreakdown(
  cartItems: CartItem[],
  productShippingMap: Map<string, number>,
  wilayaBaseRate: number
): { itemId: string; name: string; quantity: number; shippingPerUnit: number; total: number }[] {
  return cartItems.map(item => {
    const productShipping = productShippingMap.get(item.id);
    const rate = (productShipping && productShipping > 0) ? productShipping : wilayaBaseRate;
    return {
      itemId: item.id,
      name: item.name,
      quantity: item.quantity,
      shippingPerUnit: rate,
      total: rate * item.quantity,
    };
  });
}
