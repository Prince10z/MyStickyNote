// OPTIONAL, NOT DEPLOYED BY DEFAULT.
//
// Scaffold for a hosted-AI tier: instead of every user pasting their own
// OpenAI/Gemini/DeepSeek key (the "Advanced" BYOK path in Settings), a signed-in
// user could call this Edge Function, which uses a server-side key you control
// and gates usage against `profiles.ai_credits_remaining` / `profiles.is_pro`.
//
// This is NOT wired into the desktop app's UI yet - the app currently only
// calls AI providers directly with a user-supplied key. To turn this into a
// real "Pro" tier you would still need to:
//   1. Deploy this function:  supabase functions deploy ai-proxy
//   2. Set a server-side provider key as a secret (never the anon key):
//        supabase secrets set OPENAI_SERVER_KEY=sk-...
//   3. Add a 4th "MyStickyNote Cloud AI" option to the provider dropdown in
//      renderer/index.html + renderer.js that calls this function's URL with
//      the user's Supabase access token instead of calling OpenAI directly.
//   4. Wire `profiles.is_pro` to real billing (e.g. a Stripe webhook that
//      flips the flag on successful payment) - not included here.
//
// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openAiServerKey = Deno.env.get("OPENAI_SERVER_KEY");

    if (!supabaseUrl || !serviceRoleKey || !openAiServerKey) {
      return new Response(JSON.stringify({ error: "ai-proxy is not configured with required secrets." }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: userData, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Not authenticated." }), { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_pro, ai_credits_remaining")
      .eq("id", userData.user.id)
      .single();

    if (!profile?.is_pro && (profile?.ai_credits_remaining ?? 0) <= 0) {
      return new Response(JSON.stringify({ error: "Out of free AI credits. Upgrade to Pro to continue." }), { status: 402 });
    }

    const { prompt } = await req.json();
    const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAiServerKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: String(prompt || "") }],
      }),
    });
    const result = await openAiRes.json();

    if (!profile?.is_pro) {
      await supabase
        .from("profiles")
        .update({ ai_credits_remaining: Math.max(0, (profile?.ai_credits_remaining ?? 1) - 1) })
        .eq("id", userData.user.id);
    }

    return new Response(JSON.stringify({ text: result.choices?.[0]?.message?.content || "" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
