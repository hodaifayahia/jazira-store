import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, ArrowRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="text-center px-6 relative z-10">
        {/* 404 Number */}
        <div className="relative mb-6">
          <h1 className="font-roboto font-black text-[10rem] sm:text-[14rem] leading-none text-primary/10 select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Search className="w-10 h-10 text-primary" />
            </div>
          </div>
        </div>

        <h2 className="font-cairo font-bold text-2xl sm:text-3xl text-foreground mb-3">
          الصفحة غير موجودة
        </h2>
        <p className="font-cairo text-muted-foreground text-base sm:text-lg mb-2 max-w-md mx-auto">
          عذراً، الصفحة التي تبحث عنها غير متوفرة أو تم نقلها
        </p>
        <p className="font-roboto text-xs text-muted-foreground/60 mb-8 dir-ltr">
          {location.pathname}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/">
            <Button className="font-cairo gap-2 rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
              <Home className="w-4 h-4" />
              العودة للرئيسية
            </Button>
          </Link>
          <Link to="/products">
            <Button variant="outline" className="font-cairo gap-2 rounded-xl h-11 px-6">
              <ShoppingCart className="w-4 h-4" />
              تصفح المنتجات
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
