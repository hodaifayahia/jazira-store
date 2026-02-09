import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { supabase } from "@/integrations/supabase/client";

// Dynamic favicon from store settings
supabase.from('settings').select('value').eq('key', 'store_logo').maybeSingle().then(({ data }) => {
  if (data?.value) {
    const link = document.getElementById('dynamic-favicon') as HTMLLinkElement;
    if (link) {
      link.href = data.value;
      link.type = 'image/png';
    }
  }
});

createRoot(document.getElementById("root")!).render(<App />);
