import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/AnnouncementBar";
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
import AdminVariationsPage from "./pages/admin/AdminVariationsPage";
import AdminAbandonedPage from "./pages/admin/AdminAbandonedPage";
import AdminInventoryPage from "./pages/admin/AdminInventoryPage";
import AdminConfirmersPage from "./pages/admin/AdminConfirmersPage";
import AdminReturnsPage from "./pages/admin/AdminReturnsPage";
import AdminCostsPage from "./pages/admin/AdminCostsPage";
import AboutPage from "./pages/AboutPage";
import NotFound from "./pages/NotFound";
import { useStoreTheme } from "@/hooks/useStoreTheme";
import { useFavicon } from "@/hooks/useFavicon";
import { useFacebookPixel } from "@/hooks/useFacebookPixel";
import { LanguageProvider } from "@/i18n";

const queryClient = new QueryClient();

function StoreThemeProvider({ children }: { children: React.ReactNode }) {
  useStoreTheme();
  useFavicon();
  useFacebookPixel();
  return <>{children}</>;
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <StoreThemeProvider>
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
            <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />

            {/* Admin */}
            <Route path="/admin/login" element={<LanguageProvider><AdminLoginPage /></LanguageProvider>} />
            <Route path="/admin" element={<LanguageProvider><AdminLayout><AdminDashboardPage /></AdminLayout></LanguageProvider>} />
            <Route path="/admin/products" element={<LanguageProvider><AdminLayout><AdminProductsPage /></AdminLayout></LanguageProvider>} />
            <Route path="/admin/orders" element={<LanguageProvider><AdminLayout><AdminOrdersPage /></AdminLayout></LanguageProvider>} />
            <Route path="/admin/returns" element={<LanguageProvider><AdminLayout><AdminReturnsPage /></AdminLayout></LanguageProvider>} />
            <Route path="/admin/wilayas" element={<LanguageProvider><AdminLayout><AdminWilayasPage /></AdminLayout></LanguageProvider>} />
            <Route path="/admin/coupons" element={<LanguageProvider><AdminLayout><AdminCouponsPage /></AdminLayout></LanguageProvider>} />
            <Route path="/admin/categories" element={<LanguageProvider><AdminLayout><AdminCategoriesPage /></AdminLayout></LanguageProvider>} />
            <Route path="/admin/variations" element={<LanguageProvider><AdminLayout><AdminVariationsPage /></AdminLayout></LanguageProvider>} />
            <Route path="/admin/leads" element={<LanguageProvider><AdminLayout><AdminLeadsPage /></AdminLayout></LanguageProvider>} />
            <Route path="/admin/abandoned" element={<LanguageProvider><AdminLayout><AdminAbandonedPage /></AdminLayout></LanguageProvider>} />
            <Route path="/admin/inventory" element={<LanguageProvider><AdminLayout><AdminInventoryPage /></AdminLayout></LanguageProvider>} />
            <Route path="/admin/confirmers" element={<LanguageProvider><AdminLayout><AdminConfirmersPage /></AdminLayout></LanguageProvider>} />
            <Route path="/admin/costs" element={<LanguageProvider><AdminLayout><AdminCostsPage /></AdminLayout></LanguageProvider>} />
            <Route path="/admin/settings" element={<LanguageProvider><AdminLayout><AdminSettingsPage /></AdminLayout></LanguageProvider>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </StoreThemeProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
