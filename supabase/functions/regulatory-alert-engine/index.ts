import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Get all regulatory updates from last 7 days that haven't been processed
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: updates, error: updatesError } = await supabase
      .from("regulatory_updates")
      .select("*")
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false });

    if (updatesError) throw updatesError;
    if (!updates || updates.length === 0) {
      return new Response(JSON.stringify({ message: "No new updates to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all user profiles with their industry and jurisdiction preferences
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, industry_code, jurisdiction");

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No user profiles found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let notificationsCreated = 0;

    for (const update of updates) {
      // Generate AI summary if not already present
      let aiSummary = update.ai_summary;
      if (!aiSummary) {
        try {
          const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-lite",
              messages: [
                {
                  role: "system",
                  content: "You are a regulatory compliance advisor for South African SMEs. Write a concise 2-3 sentence plain-English summary for a business owner. Structure: (1) What changed, (2) Why it matters to your business, (3) What to do about it. No jargon.",
                },
                {
                  role: "user",
                  content: `Summarise this regulatory update for an SME:\n\nTitle: ${update.title}\nDescription: ${update.description}\nCategory: ${update.category}\nImpact: ${update.impact}\nEffective Date: ${update.effective_date || "Not specified"}`,
                },
              ],
            }),
          });

          if (resp.ok) {
            const aiResult = await resp.json();
            aiSummary = aiResult.choices?.[0]?.message?.content || update.description;

            // Store the summary back on the update
            await supabase
              .from("regulatory_updates")
              .update({ ai_summary: aiSummary })
              .eq("id", update.id);
          } else {
            aiSummary = update.description;
          }
        } catch (e) {
          console.error("AI summary generation failed:", e);
          aiSummary = update.description;
        }
      }

      // Match users by industry + jurisdiction
      for (const profile of profiles) {
        const userIndustry = profile.industry_code || "general";
        const userJurisdiction = profile.jurisdiction || "national";

        // Check industry match
        const industryMatch =
          update.industries.includes("all") ||
          update.industries.includes(userIndustry) ||
          userIndustry === "general";

        // Check jurisdiction match
        const jurisdictionMatch =
          update.jurisdictions.includes("national") ||
          update.jurisdictions.includes(userJurisdiction) ||
          userJurisdiction === "national";

        if (industryMatch && jurisdictionMatch) {
          // Check if notification already exists for this user + update
          const { data: existing } = await supabase
            .from("notifications")
            .select("id")
            .eq("user_id", profile.id)
            .eq("type", "regulatory_alert")
            .like("title", `%${update.title.slice(0, 40)}%`)
            .limit(1);

          if (!existing || existing.length === 0) {
            // Insert notification using the SECURITY DEFINER function
            await supabase.rpc("insert_regulatory_notification", {
              _user_id: profile.id,
              _title: `📋 ${update.title}`,
              _message: aiSummary,
              _urgency: update.impact,
              _action_url: "/compliance-risk",
            });
            notificationsCreated++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        updatesProcessed: updates.length,
        notificationsCreated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("regulatory-alert-engine error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
