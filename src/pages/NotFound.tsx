import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";

const NotFound = () => {
  usePageTitle("الصفحة غير موجودة - DZ Store");

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center space-y-4">
        <SearchX className="w-16 h-16 mx-auto text-muted-foreground" />
        <h1 className="font-cairo font-bold text-5xl text-foreground">404</h1>
        <p className="font-cairo text-xl text-muted-foreground">الصفحة غير موجودة</p>
        <Link to="/">
          <Button className="font-cairo font-semibold">العودة إلى الرئيسية</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
