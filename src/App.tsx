import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminLayout from "@/components/AdminLayout";
import Index from "./pages/Index";
import ProductsPage from "./pages/ProductsPage";
import SingleProductPage from "./pages/SingleProductPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import TrackOrderPage from "./pages/TrackOrderPage";
import AuthPage from "./pages/AuthPage";
import CustomerDashboardPage from "./pages/CustomerDashboardPage";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminWilayasPage from "./pages/admin/AdminWilayasPage";
import AdminCouponsPage from "./pages/admin/AdminCouponsPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminLeadsPage from "./pages/admin/AdminLeadsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<PublicLayout><Index /></PublicLayout>} />
            <Route path="/products" element={<PublicLayout><ProductsPage /></PublicLayout>} />
            <Route path="/product/:id" element={<PublicLayout><SingleProductPage /></PublicLayout>} />
            <Route path="/cart" element={<PublicLayout><CartPage /></PublicLayout>} />
            <Route path="/checkout" element={<PublicLayout><CheckoutPage /></PublicLayout>} />
            <Route path="/order-confirmation/:orderNumber" element={<PublicLayout><OrderConfirmationPage /></PublicLayout>} />
            <Route path="/track" element={<PublicLayout><TrackOrderPage /></PublicLayout>} />
            <Route path="/auth" element={<PublicLayout><AuthPage /></PublicLayout>} />
            <Route path="/dashboard" element={<PublicLayout><CustomerDashboardPage /></PublicLayout>} />

            {/* Admin */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminLayout><AdminDashboardPage /></AdminLayout>} />
            <Route path="/admin/products" element={<AdminLayout><AdminProductsPage /></AdminLayout>} />
            <Route path="/admin/orders" element={<AdminLayout><AdminOrdersPage /></AdminLayout>} />
            <Route path="/admin/wilayas" element={<AdminLayout><AdminWilayasPage /></AdminLayout>} />
            <Route path="/admin/coupons" element={<AdminLayout><AdminCouponsPage /></AdminLayout>} />
            <Route path="/admin/categories" element={<AdminLayout><AdminCategoriesPage /></AdminLayout>} />
            <Route path="/admin/leads" element={<AdminLayout><AdminLeadsPage /></AdminLayout>} />
            <Route path="/admin/settings" element={<AdminLayout><AdminSettingsPage /></AdminLayout>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
