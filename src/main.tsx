import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { supabase } from "@/integrations/supabase/client";

// Dynamic favicon from store settings
Promise.all([
  supabase.from('settings').select('value').eq('key', 'store_favicon').maybeSingle(),
  supabase.from('settings').select('value').eq('key', 'store_logo').maybeSingle(),
]).then(([faviconRes, logoRes]) => {
  const href = faviconRes.data?.value || logoRes.data?.value || '/solutionshub-logo.svg';
  const link = document.getElementById('dynamic-favicon') as HTMLLinkElement | null;
  if (link) {
    link.href = href;
    link.type = href.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
  }
});

createRoot(document.getElementById("root")!).render(<App />);
