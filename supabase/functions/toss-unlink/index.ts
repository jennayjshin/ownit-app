import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Basic Auth 검증: Authorization: Basic base64("toss:PASSWORD")
function verifyBasicAuth(req: Request): boolean {
  const secret = Deno.env.get("TOSS_CALLBACK_SECRET");
  const expected = btoa(`toss:${secret}`);
  const authHeader = req.headers.get("Authorization") ?? "";
  return authHeader === `Basic ${expected}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // Basic Auth 검증
  if (!verifyBasicAuth(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...CORS, "Content-Type": "application/json", "WWW-Authenticate": 'Basic realm="toss-unlink"' },
    });
  }

  try {
    let userKey: number | undefined;

    if (req.method === "GET") {
      const url = new URL(req.url);
      userKey = Number(url.searchParams.get("userKey")) || undefined;
    } else {
      const body = await req.json().catch(() => ({}));
      userKey = body.userKey ? Number(body.userKey) : undefined;
    }

    // userKey 없으면 콘솔 테스트 핑 — 200 그냥 반환
    if (!userKey || isNaN(userKey)) {
      return new Response(JSON.stringify({ success: true, message: "ping ok" }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const email = `toss_${userKey}@ownit.toss`;

    const { data: { users }, error: listErr } = await admin.auth.admin.listUsers();
    if (listErr) throw listErr;

    const target = users.find((u) => u.email === email);

    if (target) {
      await admin.from("users").delete().eq("id", target.id);
      const { error: deleteErr } = await admin.auth.admin.deleteUser(target.id);
      if (deleteErr) throw deleteErr;
    }

    console.log(`[toss-unlink] userKey=${userKey} deleted (found=${!!target})`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[toss-unlink]", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
