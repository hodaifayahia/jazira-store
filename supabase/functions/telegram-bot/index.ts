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

    const update = await req.json();
    const message = update.message || update.callback_query?.message;
    const callbackQuery = update.callback_query;
    const chatId = String(callbackQuery?.from?.id || message?.chat?.id || "");
    const text = message?.text || "";

    // Get settings
    const { data: settingsRows } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["telegram_bot_token", "telegram_chat_id"]);

    const s: Record<string, string> = {};
    settingsRows?.forEach((r: { key: string; value: string }) => {
      s[r.key] = r.value || "";
    });

    const botToken = s.telegram_bot_token;
    if (!botToken) return new Response("OK");

    const adminIds = s.telegram_chat_id?.split(",").map((id: string) => id.trim()).filter(Boolean) || [];

    // Auth check
    if (!adminIds.includes(chatId)) {
      await sendMessage(botToken, chatId, "⛔ غير مصرح لك باستخدام هذا البوت.");
      return new Response("OK");
    }

    // Handle callback queries
    if (callbackQuery) {
      const data = callbackQuery.data || "";
      await answerCallback(botToken, callbackQuery.id);

      if (data.startsWith("orders_page:")) {
        const page = parseInt(data.split(":")[1]);
        await handleOrders(supabase, botToken, chatId, page);
      } else if (data.startsWith("order_detail:")) {
        const orderId = data.split(":")[1];
        await handleOrderDetail(supabase, botToken, chatId, orderId);
      } else if (data.startsWith("order_status:")) {
        const parts = data.split(":");
        const orderId = parts[1];
        const status = parts[2];
        await handleOrderStatusUpdate(supabase, botToken, chatId, orderId, status);
      } else if (data.startsWith("products_page:")) {
        const page = parseInt(data.split(":")[1]);
        await handleProducts(supabase, botToken, chatId, page);
      } else if (data.startsWith("product_detail:")) {
        const productId = data.split(":")[1];
        await handleProductDetail(supabase, botToken, chatId, productId);
      } else if (data.startsWith("product_toggle:")) {
        const productId = data.split(":")[1];
        await handleProductToggle(supabase, botToken, chatId, productId);
      }
      return new Response("OK");
    }

    // Check for stateful flow
    const { data: stateRow } = await supabase
      .from("telegram_bot_state")
      .select("state")
      .eq("chat_id", chatId)
      .single();

    if (stateRow?.state && (stateRow.state as Record<string, unknown>).action) {
      const state = stateRow.state as Record<string, string>;
      if (state.action === "edit_price") {
        const newPrice = parseFloat(text);
        if (isNaN(newPrice) || newPrice <= 0) {
          await sendMessage(botToken, chatId, "❌ أدخل سعراً صحيحاً (رقم موجب).");
        } else {
          await supabase.from("products").update({ price: newPrice }).eq("id", state.product_id);
          await sendMessage(botToken, chatId, `✅ تم تحديث السعر إلى ${newPrice} دج`);
        }
        await supabase.from("telegram_bot_state").upsert({ chat_id: chatId, state: {}, updated_at: new Date().toISOString() });
        return new Response("OK");
      }
    }

    // Handle commands
    const cmd = text.split(" ")[0].toLowerCase();
    switch (cmd) {
      case "/start":
        await sendMessage(botToken, chatId,
          "👋 مرحباً بك في بوت الإدارة!\n\n"
          + "الأوامر المتاحة:\n"
          + "/orders - عرض الطلبات الأخيرة\n"
          + "/products - عرض المنتجات\n"
          + "/categories - عرض الفئات\n"
          + "/stats - إحصائيات المتجر\n"
          + "/help - المساعدة"
        );
        break;
      case "/orders":
        await handleOrders(supabase, botToken, chatId, 0);
        break;
      case "/products":
        await handleProducts(supabase, botToken, chatId, 0);
        break;
      case "/categories":
        await handleCategories(supabase, botToken, chatId);
        break;
      case "/stats":
        await handleStats(supabase, botToken, chatId);
        break;
      case "/help":
        await sendMessage(botToken, chatId,
          "📖 <b>دليل الأوامر:</b>\n\n"
          + "/orders — الطلبات الأخيرة مع التفاصيل وتغيير الحالة\n"
          + "/products — قائمة المنتجات مع تفعيل/تعطيل وتعديل السعر\n"
          + "/categories — عرض جميع الفئات\n"
          + "/stats — إحصائيات الإيرادات والطلبات والمنتجات"
        );
        break;
      default:
        await sendMessage(botToken, chatId, "❓ أمر غير معروف. اكتب /help لعرض الأوامر المتاحة.");
    }

    return new Response("OK");
  } catch (err) {
    console.error("telegram-bot error:", err);
    return new Response("OK");
  }
});

const PAGE_SIZE = 5;

async function sendMessage(token: string, chatId: string, text: string, reply_markup?: unknown) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", reply_markup }),
  });
}

async function editMessage(token: string, chatId: string, messageId: number, text: string, reply_markup?: unknown) {
  await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: "HTML", reply_markup }),
  });
}

async function answerCallback(token: string, callbackId: string) {
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackId }),
  });
}

async function handleOrders(supabase: ReturnType<typeof createClient>, token: string, chatId: string, page: number) {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: orders, count } = await supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_phone, total_amount, status, created_at, payment_method", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (!orders || orders.length === 0) {
    await sendMessage(token, chatId, "📭 لا توجد طلبات.");
    return;
  }

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);
  let msg = `📋 <b>الطلبات</b> (صفحة ${page + 1}/${totalPages})\n\n`;
  
  orders.forEach((o) => {
    const statusEmoji: Record<string, string> = { "جديد": "🆕", "مؤكد": "✅", "قيد التحضير": "📦", "تم الشحن": "🚚", "تم التسليم": "✔️", "ملغي": "❌" };
    msg += `${statusEmoji[o.status] || "📄"} <b>#${o.order_number}</b> — ${o.customer_name}\n`;
    msg += `   💰 ${o.total_amount} دج | ${o.status}\n\n`;
  });

  const buttons: Array<Array<{ text: string; callback_data: string }>> = [];
  const detailRow = orders.map((o) => ({ text: `#${o.order_number}`, callback_data: `order_detail:${o.id}` }));
  // Split into rows of 3
  for (let i = 0; i < detailRow.length; i += 3) {
    buttons.push(detailRow.slice(i, i + 3));
  }

  const navRow: Array<{ text: string; callback_data: string }> = [];
  if (page > 0) navRow.push({ text: "⬅️ السابق", callback_data: `orders_page:${page - 1}` });
  if (page < totalPages - 1) navRow.push({ text: "التالي ➡️", callback_data: `orders_page:${page + 1}` });
  if (navRow.length > 0) buttons.push(navRow);

  await sendMessage(token, chatId, msg, { inline_keyboard: buttons });
}

async function handleOrderDetail(supabase: ReturnType<typeof createClient>, token: string, chatId: string, orderId: string) {
  const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
  if (!order) { await sendMessage(token, chatId, "❌ طلب غير موجود."); return; }

  const { data: items } = await supabase.from("order_items").select("quantity, unit_price, product_id").eq("order_id", orderId);
  const productIds = items?.map((i: { product_id: string }) => i.product_id) || [];
  const { data: products } = await supabase.from("products").select("id, name").in("id", productIds);
  const pMap: Record<string, string> = {};
  products?.forEach((p: { id: string; name: string }) => { pMap[p.id] = p.name; });

  const paymentLabel: Record<string, string> = { cod: "عند التسليم", baridimob: "بريدي موب", flexy: "فليكسي" };

  let msg = `🧾 <b>طلب #${order.order_number}</b>\n\n`
    + `👤 ${order.customer_name}\n📱 ${order.customer_phone}\n`
    + `📍 ${order.address || "—"}\n`
    + `💳 ${paymentLabel[order.payment_method || ""] || order.payment_method || "—"}\n`
    + `📦 الحالة: <b>${order.status}</b>\n\n`
    + `<b>المنتجات:</b>\n`;

  items?.forEach((i: { product_id: string; quantity: number; unit_price: number }) => {
    msg += `  • ${pMap[i.product_id] || "منتج"} × ${i.quantity} = ${i.unit_price * i.quantity} دج\n`;
  });

  msg += `\n💰 المجموع الفرعي: ${order.subtotal} دج\n`;
  if (order.discount_amount) msg += `🏷️ الخصم: -${order.discount_amount} دج\n`;
  msg += `🚚 التوصيل: ${order.shipping_cost} دج\n`;
  msg += `💵 <b>الإجمالي: ${order.total_amount} دج</b>`;

  if (order.payment_receipt_url) {
    msg += `\n\n🧾 <a href="${order.payment_receipt_url}">عرض إيصال الدفع</a>`;
  }

  const statuses = ["جديد", "مؤكد", "قيد التحضير", "تم الشحن", "تم التسليم", "ملغي"];
  const statusButtons = statuses
    .filter((st) => st !== order.status)
    .map((st) => ({ text: st, callback_data: `order_status:${order.id}:${st}` }));

  const keyboard: Array<Array<{ text: string; callback_data: string }>> = [];
  for (let i = 0; i < statusButtons.length; i += 3) {
    keyboard.push(statusButtons.slice(i, i + 3));
  }

  await sendMessage(token, chatId, msg, { inline_keyboard: keyboard });
}

async function handleOrderStatusUpdate(supabase: ReturnType<typeof createClient>, token: string, chatId: string, orderId: string, status: string) {
  await supabase.from("orders").update({ status }).eq("id", orderId);
  await sendMessage(token, chatId, `✅ تم تحديث حالة الطلب إلى: <b>${status}</b>`);
}

async function handleProducts(supabase: ReturnType<typeof createClient>, token: string, chatId: string, page: number) {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: products, count } = await supabase
    .from("products")
    .select("id, name, price, is_active, stock", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (!products || products.length === 0) {
    await sendMessage(token, chatId, "📭 لا توجد منتجات.");
    return;
  }

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE);
  let msg = `📦 <b>المنتجات</b> (صفحة ${page + 1}/${totalPages})\n\n`;

  products.forEach((p) => {
    const status = p.is_active ? "🟢" : "🔴";
    msg += `${status} <b>${p.name}</b>\n   💰 ${p.price} دج | المخزون: ${p.stock ?? 0}\n\n`;
  });

  const buttons: Array<Array<{ text: string; callback_data: string }>> = [];
  const detailRow = products.map((p) => ({ text: p.name.substring(0, 20), callback_data: `product_detail:${p.id}` }));
  for (let i = 0; i < detailRow.length; i += 2) {
    buttons.push(detailRow.slice(i, i + 2));
  }

  const navRow: Array<{ text: string; callback_data: string }> = [];
  if (page > 0) navRow.push({ text: "⬅️ السابق", callback_data: `products_page:${page - 1}` });
  if (page < totalPages - 1) navRow.push({ text: "التالي ➡️", callback_data: `products_page:${page + 1}` });
  if (navRow.length > 0) buttons.push(navRow);

  await sendMessage(token, chatId, msg, { inline_keyboard: buttons });
}

async function handleProductDetail(supabase: ReturnType<typeof createClient>, token: string, chatId: string, productId: string) {
  const { data: product } = await supabase.from("products").select("*").eq("id", productId).single();
  if (!product) { await sendMessage(token, chatId, "❌ منتج غير موجود."); return; }

  const status = product.is_active ? "🟢 مفعّل" : "🔴 معطّل";
  let msg = `📦 <b>${product.name}</b>\n\n`
    + `💰 السعر: ${product.price} دج\n`
    + `📊 المخزون: ${product.stock ?? 0}\n`
    + `📂 الفئة: ${product.category?.join(", ") || "—"}\n`
    + `${status}\n`;

  if (product.description) msg += `\n📝 ${product.description}`;

  const toggleText = product.is_active ? "🔴 تعطيل" : "🟢 تفعيل";
  const keyboard = [
    [
      { text: toggleText, callback_data: `product_toggle:${product.id}` },
      { text: "✏️ تعديل السعر", callback_data: `product_edit_price:${product.id}` },
    ],
  ];

  await sendMessage(token, chatId, msg, { inline_keyboard: keyboard });
}

async function handleProductToggle(supabase: ReturnType<typeof createClient>, token: string, chatId: string, productId: string) {
  const { data: product } = await supabase.from("products").select("is_active").eq("id", productId).single();
  if (!product) { await sendMessage(token, chatId, "❌ منتج غير موجود."); return; }

  const newStatus = !product.is_active;
  await supabase.from("products").update({ is_active: newStatus }).eq("id", productId);
  await sendMessage(token, chatId, `✅ تم ${newStatus ? "تفعيل" : "تعطيل"} المنتج.`);
}

async function handleCategories(supabase: ReturnType<typeof createClient>, token: string, chatId: string) {
  const { data: products } = await supabase.from("products").select("category");
  const catSet = new Set<string>();
  products?.forEach((p: { category: string[] }) => {
    p.category?.forEach((c: string) => catSet.add(c));
  });

  if (catSet.size === 0) {
    await sendMessage(token, chatId, "📭 لا توجد فئات.");
    return;
  }

  let msg = "📂 <b>الفئات:</b>\n\n";
  catSet.forEach((c) => { msg += `  • ${c}\n`; });
  await sendMessage(token, chatId, msg);
}

async function handleStats(supabase: ReturnType<typeof createClient>, token: string, chatId: string) {
  const { data: orders } = await supabase.from("orders").select("total_amount, status");
  const { count: productCount } = await supabase.from("products").select("id", { count: "exact", head: true });

  const totalOrders = orders?.length || 0;
  const totalRevenue = orders?.reduce((sum: number, o: { total_amount: number | null }) => sum + (o.total_amount || 0), 0) || 0;

  const statusCounts: Record<string, number> = {};
  orders?.forEach((o: { status: string | null }) => {
    const st = o.status || "غير محدد";
    statusCounts[st] = (statusCounts[st] || 0) + 1;
  });

  let msg = "📊 <b>إحصائيات المتجر</b>\n\n"
    + `📦 إجمالي الطلبات: ${totalOrders}\n`
    + `💰 إجمالي الإيرادات: ${totalRevenue} دج\n`
    + `🛍️ عدد المنتجات: ${productCount || 0}\n\n`
    + "<b>توزيع حالات الطلبات:</b>\n";

  Object.entries(statusCounts).forEach(([status, count]) => {
    msg += `  • ${status}: ${count}\n`;
  });

  await sendMessage(token, chatId, msg);
}
