import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { type, order_id } = await req.json();

    // Fetch telegram settings
    const { data: settingsRows } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["telegram_enabled", "telegram_notify_orders", "telegram_bot_token", "telegram_chat_id"]);

    const s: Record<string, string> = {};
    settingsRows?.forEach((r: { key: string; value: string }) => {
      s[r.key] = r.value || "";
    });

    if (s.telegram_enabled !== "true") {
      return new Response(JSON.stringify({ ok: false, reason: "disabled" }), { headers: corsHeaders });
    }

    const botToken = s.telegram_bot_token;
    const chatIds = s.telegram_chat_id?.split(",").map((id: string) => id.trim()).filter(Boolean) || [];

    if (!botToken || chatIds.length === 0) {
      return new Response(JSON.stringify({ ok: false, reason: "no_config" }), { headers: corsHeaders });
    }

    let message = "";

    if (type === "test") {
      message = "✅ <b>رسالة تجريبية</b>\n\nإشعارات تلغرام تعمل بنجاح!";
    } else if (type === "new_order" && order_id) {
      if (s.telegram_notify_orders !== "true") {
        return new Response(JSON.stringify({ ok: false, reason: "orders_disabled" }), { headers: corsHeaders });
      }

      const { data: order } = await supabase
        .from("orders")
        .select("*")
        .eq("id", order_id)
        .single();

      if (!order) {
        return new Response(JSON.stringify({ ok: false, reason: "order_not_found" }), { headers: corsHeaders });
      }

      const { data: orderItems } = await supabase
        .from("order_items")
        .select("quantity, unit_price, product_id")
        .eq("order_id", order_id);

      // Fetch product names
      const productIds = orderItems?.map((i: { product_id: string }) => i.product_id) || [];
      const { data: products } = await supabase
        .from("products")
        .select("id, name")
        .in("id", productIds);

      const productMap: Record<string, string> = {};
      products?.forEach((p: { id: string; name: string }) => {
        productMap[p.id] = p.name;
      });

      const itemLines = orderItems?.map((i: { product_id: string; quantity: number; unit_price: number }) => {
        const name = productMap[i.product_id] || "منتج";
        return `  • ${name} × ${i.quantity} = ${i.unit_price * i.quantity} دج`;
      }).join("\n") || "";

      const paymentLabel: Record<string, string> = {
        cod: "الدفع عند التسليم",
        baridimob: "بريدي موب",
        flexy: "فليكسي",
      };

      message = `🛒 <b>طلب جديد #${order.order_number}</b>\n\n`
        + `👤 ${order.customer_name}\n`
        + `📱 ${order.customer_phone}\n`
        + `💰 ${order.total_amount} دج\n`
        + `💳 ${paymentLabel[order.payment_method || ""] || order.payment_method}\n\n`
        + `<b>المنتجات:</b>\n${itemLines}\n\n`
        + `📦 الحالة: ${order.status}`;
    } else {
      return new Response(JSON.stringify({ ok: false, reason: "unknown_type" }), { headers: corsHeaders });
    }

    // Send to all chat IDs
    const results = await Promise.all(
      chatIds.map(async (chatId: string) => {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
        });
        return res.json();
      })
    );

    return new Response(JSON.stringify({ ok: true, results }), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
