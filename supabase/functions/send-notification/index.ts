import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOSS_API = "https://apps-in-toss-api.toss.im";
const TEMPLATE_SET_CODE = "dj-nativefit-routine";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // Verify caller is an authenticated Supabase user
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
    }
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
    }

    const { tossUserKey, context } = await req.json();
    if (!tossUserKey) throw new Error("tossUserKey is required");

    // Ensure the caller can only push to their own toss account
    const userTossKey = user.user_metadata?.toss_user_key;
    if (!userTossKey || String(userTossKey) !== String(tossUserKey)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: CORS });
    }

    const httpClient = Deno.createHttpClient({
      cert: Deno.env.get("TOSS_MTLS_CERT")!,
      key: Deno.env.get("TOSS_MTLS_KEY")!,
    });

    const res = await fetch(
      `${TOSS_API}/api-partner/v1/apps-in-toss/messenger/send-message`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-toss-user-key": String(tossUserKey),
        },
        body: JSON.stringify({
          templateSetCode: TEMPLATE_SET_CODE,
          context: context ?? {},
        }),
        client: httpClient,
      }
    );
    httpClient.close();

    const json = await res.json();

    return new Response(JSON.stringify(json), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-notification]", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
