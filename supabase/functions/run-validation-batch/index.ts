import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { domain, questionIds, userContextTemplate } = await req.json();

    if (!domain || !questionIds?.length) {
      return new Response(JSON.stringify({ error: "domain and questionIds are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: questions, error: qError } = await supabase
      .from("validation_questions")
      .select("*")
      .in("id", questionIds)
      .eq("is_active", true);

    if (qError || !questions?.length) {
      return new Response(JSON.stringify({ error: "No valid questions found", details: qError?.message }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const domainContextMap: Record<string, object> = {
      fais_financial_conduct: { company: { name: "Test SME", industry: "retail", size: "11-50", region: "Gauteng" }, domainScores: { financial: 55, compliance: 50 } },
      popia: { company: { name: "Test SME", industry: "technology", size: "11-50", region: "Western Cape" }, domainScores: { compliance: 60 } },
      cipc_companies_act: { company: { name: "Test SME", industry: "professional_services", size: "1-10", region: "Gauteng" }, domainScores: { compliance: 50 } },
      labour_bcea: { company: { name: "Test SME", industry: "manufacturing", size: "51-200", region: "KwaZulu-Natal" }, domainScores: { operational: 45 } },
      fais_financial: { company: { name: "Test SME", industry: "finance", size: "11-50", region: "Gauteng" }, domainScores: { financial: 65, compliance: 55 } },
    };

    const testContext = userContextTemplate || domainContextMap[domain] || domainContextMap.fais_financial_conduct;
    const batchId = crypto.randomUUID();
    const responses: { questionId: string; responseId: string }[] = [];
    const DELAY_BETWEEN_CALLS_MS = 4000; // 4s delay to respect rate limits

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      
      // Add delay between calls (not before the first one)
      if (i > 0) {
        await sleep(DELAY_BETWEEN_CALLS_MS);
      }

      try {
        const systemPrompt = `You are SCRF Agent, an expert virtual CFO and compliance advisor for South African SMEs. Answer the following validation question accurately, citing relevant SA legislation.

Context: ${question.question_context || "General SME scenario"}
Expected coverage: ${question.expected_topic_coverage || "Comprehensive answer"}
Relevant SA laws: ${(question.sa_law_references || []).join(", ")}`;

        let aiResponse;
        let retries = 0;
        const maxRetries = 2;

        while (retries <= maxRetries) {
          aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: question.question_text },
              ],
            }),
          });

          if (aiResponse.status === 429 && retries < maxRetries) {
            retries++;
            console.log(`Rate limited on question ${question.id}, retry ${retries} after delay...`);
            await sleep(6000 * retries); // exponential backoff: 6s, 12s
            continue;
          }
          break;
        }

        if (!aiResponse || !aiResponse.ok) {
          console.error(`AI call failed for question ${question.id}: ${aiResponse?.status}`);
          continue;
        }

        const aiData = await aiResponse.json();
        const agentText = aiData.choices?.[0]?.message?.content || "No response generated";

        const { data: inserted, error: insertErr } = await supabase
          .from("validation_responses")
          .insert({
            question_id: question.id,
            agent_response: agentText,
            agent_model_version: "google/gemini-3-flash-preview",
            user_context_used: testContext,
          })
          .select("id")
          .single();

        if (!insertErr && inserted) {
          responses.push({ questionId: question.id, responseId: inserted.id });
        }
      } catch (err) {
        console.error(`Error processing question ${question.id}:`, err);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      batchId,
      responsesGenerated: responses.length,
      totalQuestions: questions.length,
      estimatedReviewTime: `${responses.length * 5} minutes`,
      responses,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("run-validation-batch error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
