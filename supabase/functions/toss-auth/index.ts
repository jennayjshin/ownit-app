import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOSS_API = "https://apps-in-toss-api.toss.im";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const { authorizationCode, referrer } = await req.json();

    const httpClient = Deno.createHttpClient({
      cert: Deno.env.get("TOSS_MTLS_CERT")!,
      key: Deno.env.get("TOSS_MTLS_KEY")!,
    });

    // 1. 인가 코드 → 액세스 토큰 교환
    const tokenRes = await fetch(
      `${TOSS_API}/api-partner/v1/apps-in-toss/user/oauth2/generate-token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorizationCode, referrer }),
        client: httpClient,
      }
    );
    const tokenJson = await tokenRes.json();
    if (!tokenJson.success?.accessToken) {
      throw new Error(`Token exchange failed: ${JSON.stringify(tokenJson)}`);
    }
    const { accessToken } = tokenJson.success;

    // 2. 사용자 식별키(userKey) 조회
    const userRes = await fetch(
      `${TOSS_API}/api-partner/v1/apps-in-toss/user/oauth2/login-me`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        client: httpClient,
      }
    );
    const userJson = await userRes.json();
    if (!userJson.success?.userKey) {
      throw new Error(`User fetch failed: ${JSON.stringify(userJson)}`);
    }
    const { userKey } = userJson.success;
    httpClient.close();

    // 3. Supabase 유저 생성 or 기존 유저 조회
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const email = `toss_${userKey}@ownit.toss`;
    const { error: createErr } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { toss_user_key: userKey },
    });
    // "already registered"는 정상 — 기존 유저면 그냥 진행
    if (createErr && !createErr.message.toLowerCase().includes("already registered")) {
      throw createErr;
    }

    // 4. 1회용 로그인 토큰 생성 (이메일 미전송)
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (linkErr) throw linkErr;

    return new Response(
      JSON.stringify({ token_hash: linkData.properties.hashed_token, userKey }),
      { headers: { ...CORS, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[toss-auth]", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
