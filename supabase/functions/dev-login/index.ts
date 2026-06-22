import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEST_EMAIL = "dev@ownit.toss";
const DEV_SECRET = Deno.env.get("DEV_LOGIN_SECRET") ?? "ownit-dev-bypass-2026";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { secret } = await req.json();
    if (secret !== DEV_SECRET) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: CORS });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error: createErr } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      email_confirm: true,
    });
    if (createErr && !createErr.message.toLowerCase().includes("already")) {
      throw createErr;
    }

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: TEST_EMAIL,
    });
    if (linkErr) throw linkErr;

    return new Response(
      JSON.stringify({ token_hash: linkData.properties.hashed_token }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[dev-login]", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
