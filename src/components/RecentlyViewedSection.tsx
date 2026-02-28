import { Link } from 'react-router-dom';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { formatPrice } from '@/lib/format';
import { Clock, ChevronLeft } from 'lucide-react';

export default function RecentlyViewedSection() {
  const { items } = useRecentlyViewed();

  if (items.length < 2) return null;

  return (
    <section className="py-10">
      <div className="container">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-cairo font-bold text-xl text-foreground">شاهدت مؤخراً</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2">
          {items.map(item => (
            <Link
              key={item.id}
              to={`/product/${item.id}`}
              className="group flex-shrink-0 w-36 sm:w-44"
            >
              <div className="bg-card rounded-xl border border-border/50 overflow-hidden hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                <div className="aspect-square overflow-hidden bg-muted">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10">
                      <Clock className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-cairo font-semibold text-xs text-foreground line-clamp-2 leading-relaxed min-h-[2.25rem]">
                    {item.name}
                  </h3>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="font-roboto font-bold text-primary text-sm">
                      {formatPrice(item.price)}
                    </span>
                    <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
