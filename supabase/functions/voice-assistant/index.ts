// EYTA AI voice assistant — multilingual reply via Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  en: "You are EYTA AI, a warm, calm voice assistant for visually impaired users. Reply in clear, short English (1-3 sentences). Never use markdown, emojis, or special characters — your reply will be spoken aloud. Be reassuring and direct.",
  am: "አንተ EYTA AI ነህ፣ ለዓይነ ስውራን የተዘጋጀ ድምፅ ረዳት። በአማርኛ በአጭሩ (1-3 ዐ.ነ) መልስ ስጥ። ምንም emoji ወይም ምልክት አትጠቀም፤ መልሱ በድምፅ ይነበባል። ሰላማዊ እና ግልፅ ሁን።",
  om: "Ati EYTA AI dha, gargaaraa sagalee namoota agarsiisa hin qabneef. Afaan Oromootiin gabaabsitee (himoota 1-3) deebii kenni. Emoji yookin mallattoo addaa hin fayyadamin — deebiin kee sagaleedhaan dubbatama. Tasgabbaaʼaa fi ifaa taʼi.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message, language = "en", history = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const sys = SYSTEM_PROMPTS[language] ?? SYSTEM_PROMPTS.en;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: sys },
          ...history,
          { role: "user", content: message },
        ],
      }),
    });

    if (r.status === 429)
      return new Response(JSON.stringify({ error: "Rate limit. Try again shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    if (r.status === 402)
      return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    if (!r.ok) {
      const t = await r.text();
      console.error("AI error", r.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("voice-assistant", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
