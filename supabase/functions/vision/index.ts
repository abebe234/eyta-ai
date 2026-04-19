// EYTA AI vision — object detection or OCR text reading from a base64 image
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PROMPTS: Record<string, Record<string, string>> = {
  detect: {
    en: "You are helping a visually impaired user. Look at this image and describe what is in front of them in 1-2 short spoken sentences. Prioritize people, vehicles, doors, stairs, and obstacles. Mention safety hazards first. No markdown, no lists, plain spoken English.",
    am: "ዓይነ ስውር ሰው እየረዳህ ነው። በምስሉ ላይ የሚታየውን በ1-2 አጭር ዐ.ነ በአማርኛ ንገር። ሰዎችን፣ ተሽከርካሪዎችን፣ በሮችን፣ ደረጃዎችን እና መሰናክሎችን አስቀድም። ምልክት ወይም ዝርዝር አትጠቀም።",
    om: "Nama agarsiisa hin qabne gargaaraa jirta. Suuraa kana ilaalii waan fuula isaa dura jiru himoota 1-2 gabaabaadhaan Afaan Oromootiin himi. Namoota, konkolaattota, balbalaa, gulantaa fi gufuuwwan dursii. Mallattoo yookin tarree hin fayyadamin.",
  },
  read: {
    en: "Read aloud the text visible in this image. Output only the text content as plain spoken English — no preamble, no markdown, no bullet points. If no readable text, say: I cannot find any readable text.",
    am: "በዚህ ምስል ላይ የሚታየውን ጽሑፍ አንብብ። ጽሑፉን ብቻ መልስ፣ መግቢያ ወይም ምልክት አይደለም። ምንም የሚነበብ ጽሑፍ ከሌለ 'የሚነበብ ጽሑፍ ማግኘት አልቻልኩም' በል።",
    om: "Barreeffama suuraa kana keessa jiru dubbisi. Barreeffamicha qofa deebisi — seensa yookin mallattoo hin dabalin. Yoo barreeffamni hin jiraanne, 'Barreeffama dubbifamu hin argine' jedhi.",
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, mode = "detect", language = "en" } = await req.json();
    if (!imageBase64) throw new Error("imageBase64 required");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const prompt = PROMPTS[mode]?.[language] ?? PROMPTS.detect.en;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageBase64 } },
            ],
          },
        ],
      }),
    });

    if (r.status === 429)
      return new Response(JSON.stringify({ error: "Rate limited." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    if (r.status === 402)
      return new Response(JSON.stringify({ error: "Credits exhausted." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    if (!r.ok) {
      const t = await r.text();
      console.error("vision err", r.status, t);
      return new Response(JSON.stringify({ error: "vision failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await r.json();
    const result = data.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
