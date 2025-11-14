import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client to fetch jobs
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all active jobs
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (jobsError) {
      console.error("Error fetching jobs:", jobsError);
    }

    // Prepare system prompt based on language
    const systemPrompts = {
      en: `You are a helpful job assistant for Job Portal India. You help job seekers find the perfect job match.
      
Available jobs:
${jobs?.map(job => `
- Title: ${job.title}
- Company: ${job.company_name}
- Role: ${job.role}
- Salary: ${job.salary}
- Location: ${job.location}
- Skills: ${job.skills_required.join(", ")}
- Description: ${job.description || "N/A"}
`).join("\n") || "No jobs available at the moment."}

Help users by:
1. Understanding their skills and preferences
2. Matching them with suitable jobs
3. Providing detailed information about job listings
4. Answering questions about job requirements
5. Being encouraging and professional

Keep responses concise and friendly.`,
      
      hi: `आप जॉब पोर्टल इंडिया के लिए एक सहायक नौकरी सहायक हैं। आप नौकरी चाहने वालों को सही नौकरी खोजने में मदद करते हैं।

उपलब्ध नौकरियां:
${jobs?.map(job => `
- शीर्षक: ${job.title}
- कंपनी: ${job.company_name}
- भूमिका: ${job.role}
- वेतन: ${job.salary}
- स्थान: ${job.location}
- कौशल: ${job.skills_required.join(", ")}
- विवरण: ${job.description || "उपलब्ध नहीं"}
`).join("\n") || "इस समय कोई नौकरी उपलब्ध नहीं है।"}

उपयोगकर्ताओं की मदद करें:
1. उनके कौशल और प्राथमिकताओं को समझकर
2. उन्हें उपयुक्त नौकरियों से मिलाकर
3. नौकरी की सूची के बारे में विस्तृत जानकारी देकर
4. नौकरी की आवश्यकताओं के बारे में सवालों का जवाब देकर
5. प्रोत्साहनपूर्ण और पेशेवर बनकर

संक्षिप्त और मित्रवत उत्तर दें।`,
      
      pa: `ਤੁਸੀਂ ਜੌਬ ਪੋਰਟਲ ਇੰਡੀਆ ਲਈ ਇੱਕ ਮਦਦਗਾਰ ਨੌਕਰੀ ਸਹਾਇਕ ਹੋ। ਤੁਸੀਂ ਨੌਕਰੀ ਲੱਭਣ ਵਾਲਿਆਂ ਨੂੰ ਸਹੀ ਨੌਕਰੀ ਲੱਭਣ ਵਿੱਚ ਮਦਦ ਕਰਦੇ ਹੋ।

ਉਪਲਬਧ ਨੌਕਰੀਆਂ:
${jobs?.map(job => `
- ਸਿਰਲੇਖ: ${job.title}
- ਕੰਪਨੀ: ${job.company_name}
- ਭੂਮਿਕਾ: ${job.role}
- ਤਨਖਾਹ: ${job.salary}
- ਸਥਾਨ: ${job.location}
- ਹੁਨਰ: ${job.skills_required.join(", ")}
- ਵੇਰਵਾ: ${job.description || "ਉਪਲਬਧ ਨਹੀਂ"}
`).join("\n") || "ਇਸ ਸਮੇਂ ਕੋਈ ਨੌਕਰੀ ਉਪਲਬਧ ਨਹੀਂ ਹੈ।"}

ਯੂਜ਼ਰਾਂ ਦੀ ਮਦਦ ਕਰੋ:
1. ਉਹਨਾਂ ਦੇ ਹੁਨਰ ਅਤੇ ਤਰਜੀਹਾਂ ਨੂੰ ਸਮਝ ਕੇ
2. ਉਹਨਾਂ ਨੂੰ ਢੁਕਵੀਆਂ ਨੌਕਰੀਆਂ ਨਾਲ ਮਿਲਾ ਕੇ
3. ਨੌਕਰੀ ਸੂਚੀ ਬਾਰੇ ਵਿਸਥਾਰ ਜਾਣਕਾਰੀ ਦੇ ਕੇ
4. ਨੌਕਰੀ ਦੀਆਂ ਲੋੜਾਂ ਬਾਰੇ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ ਦੇ ਕੇ
5. ਹੌਸਲਾ ਦੇਣ ਵਾਲੇ ਅਤੇ ਪੇਸ਼ੇਵਰ ਬਣ ਕੇ

ਸੰਖੇਪ ਅਤੇ ਦੋਸਤਾਨਾ ਜਵਾਬ ਦਿਓ।`
    };

    const systemPrompt = systemPrompts[language as keyof typeof systemPrompts] || systemPrompts.en;

    // Call Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const message = data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    return new Response(
      JSON.stringify({ message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in chat-assistant:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
