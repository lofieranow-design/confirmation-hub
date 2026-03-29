import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const targetUserId = "1a32d729-017f-41d9-9f89-dcb8c00f919e";

    // Update the auth user email + password
    const { error: authError } = await admin.auth.admin.updateUserById(targetUserId, {
      email: "admin@ecom.ma",
      password: "admin123456",
      email_confirm: true,
      user_metadata: { name: "Admin", suffix_code: "ADMIN" },
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update agent record
    const { error: agentError } = await admin
      .from("agents")
      .update({ name: "Admin", email: "admin@ecom.ma", suffix_code: "ADMIN" })
      .eq("user_id", targetUserId);

    if (agentError) {
      return new Response(JSON.stringify({ error: agentError.message }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ensure admin role exists
    const { data: hasRole } = await admin.rpc("has_role", { _user_id: targetUserId, _role: "admin" });
    if (!hasRole) {
      await admin.from("user_roles").upsert({ user_id: targetUserId, role: "admin" });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
