import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
    if (!caller) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: caller.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { action, email, userId } = await req.json();

    if (action === "add") {
      // Find user by email
      const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
      if (listErr) throw listErr;
      const targetUser = users.find((u: any) => u.email === email);
      if (!targetUser) {
        return new Response(JSON.stringify({ error: "المستخدم غير موجود. يجب أن يكون مسجلاً مسبقاً" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Check if already admin
      const { data: existing } = await supabaseAdmin.from("user_roles").select("id").eq("user_id", targetUser.id).eq("role", "admin").maybeSingle();
      if (existing) {
        return new Response(JSON.stringify({ error: "هذا المستخدم مسؤول بالفعل" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { error: insertErr } = await supabaseAdmin.from("user_roles").insert({ user_id: targetUser.id, role: "admin" });
      if (insertErr) throw insertErr;

      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "remove") {
      // Prevent removing self
      if (userId === caller.id) {
        return new Response(JSON.stringify({ error: "لا يمكنك إزالة صلاحياتك الخاصة" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { error: delErr } = await supabaseAdmin.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
      if (delErr) throw delErr;

      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
