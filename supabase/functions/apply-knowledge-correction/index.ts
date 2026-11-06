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

    const { correctionId, appliedBy } = await req.json();

    if (!correctionId) {
      return new Response(JSON.stringify({ error: "correctionId is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the correction
    const { data: correction, error: cErr } = await supabase
      .from("knowledge_corrections")
      .select("*, expert_reviews(response_id, reviewer_name)")
      .eq("id", correctionId)
      .single();

    if (cErr || !correction) {
      return new Response(JSON.stringify({ error: "Correction not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (correction.applied_to_system_prompt) {
      return new Response(JSON.stringify({ error: "Correction already applied" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Add to agent knowledge base
    const { error: kbErr } = await supabase
      .from("agent_knowledge_base")
      .insert({
        correction_id: correctionId,
        domain: correction.domain,
        corrected_statement: correction.corrected_statement,
        supporting_reference: correction.supporting_reference,
        applied_by: appliedBy || user.email || "admin",
      });

    if (kbErr) {
      return new Response(JSON.stringify({ error: "Failed to add to knowledge base", details: kbErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark correction as applied
    await supabase
      .from("knowledge_corrections")
      .update({
        applied_to_system_prompt: true,
        applied_at: new Date().toISOString(),
        applied_by: appliedBy || user.email || "admin",
      })
      .eq("id", correctionId);

    // Update the review status
    await supabase
      .from("expert_reviews")
      .update({ review_status: "correction_applied" })
      .eq("id", correction.review_id);

    // Generate diff
    const diff = {
      domain: correction.domain,
      type: correction.correction_type,
      severity: correction.severity,
      before: correction.original_agent_statement,
      after: correction.corrected_statement,
      reference: correction.supporting_reference,
      requiresSystemPromptUpdate: correction.severity === "critical" || correction.severity === "high",
    };

    // Audit log
    try {
      await supabase.from("audit_log").insert({
        user_id: user.id,
        action: "knowledge_correction_applied",
        resource_type: "knowledge_corrections",
        resource_id: correctionId,
        metadata: { domain: correction.domain, severity: correction.severity, correction_type: correction.correction_type },
      });
    } catch (_) { /* Non-blocking */ }

    return new Response(JSON.stringify({
      success: true,
      diff,
      message: diff.requiresSystemPromptUpdate
        ? "Critical/high correction applied. System prompt update recommended."
        : "Correction applied to knowledge base.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("apply-knowledge-correction error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
