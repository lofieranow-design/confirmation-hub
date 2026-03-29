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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: "marouane@ecom.ma",
    password: "LMlm171124",
    email_confirm: true,
    user_metadata: { name: "Marouane Admin", suffix_code: "ADM" },
  });

  if (createError) {
    return new Response(JSON.stringify({ error: createError.message }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Add admin role
  await supabaseAdmin.from("user_roles").insert({ user_id: newUser.user.id, role: "admin" });

  return new Response(JSON.stringify({ success: true, user_id: newUser.user.id }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
