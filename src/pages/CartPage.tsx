import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/format';
import { usePageTitle } from '@/hooks/usePageTitle';

export default function CartPage() {
  usePageTitle('سلة التسوق - DZ Store');
  const { items, removeItem, updateQuantity, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="container py-16 text-center">
        <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="font-cairo font-bold text-2xl mb-2">سلة التسوق فارغة</h1>
        <p className="font-cairo text-muted-foreground mb-6">لم تقم بإضافة أي منتجات بعد</p>
        <Link to="/products">
          <Button className="font-cairo font-semibold">تصفح المنتجات</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="font-cairo font-bold text-3xl mb-6">سلة التسوق</h1>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.id} className="flex gap-4 bg-card border rounded-lg p-4 animate-fade-in">
              <div className="w-20 h-20 rounded-md overflow-hidden bg-muted shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><ShoppingCart className="w-6 h-6 text-muted-foreground" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.id}`} className="font-cairo font-semibold text-foreground hover:text-primary line-clamp-1">{item.name}</Link>
                <p className="font-roboto font-bold text-primary mt-1">{formatPrice(item.price)}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border rounded-md">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="w-3 h-3" /></Button>
                    <span className="w-8 text-center font-roboto text-sm font-bold">{item.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="w-3 h-3" /></Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-roboto font-bold text-sm">{formatPrice(item.price * item.quantity)}</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeItem(item.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card border rounded-lg p-6 h-fit sticky top-20">
          <h2 className="font-cairo font-bold text-xl mb-4">ملخص الطلب</h2>
          <div className="flex justify-between mb-4 font-cairo">
            <span className="text-muted-foreground">المجموع الفرعي</span>
            <span className="font-roboto font-bold">{formatPrice(subtotal)}</span>
          </div>
          <Link to="/checkout">
            <Button className="w-full font-cairo font-semibold">إتمام الطلب</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
