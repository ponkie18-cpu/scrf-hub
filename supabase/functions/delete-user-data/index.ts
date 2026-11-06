import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.89.0";
import {
  handleCors,
  createSuccessResponse,
  createErrorResponse,
} from "../_shared/response.ts";

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse("Unauthorized", 401, "AUTH_MISSING");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return createErrorResponse("Invalid token", 401, "AUTH_INVALID");
    }

    const { confirm } = await req.json();
    if (!confirm || confirm !== "DELETE_MY_ACCOUNT") {
      return createErrorResponse(
        "Must send { confirm: 'DELETE_MY_ACCOUNT' } to proceed",
        400,
        "CONFIRMATION_REQUIRED",
      );
    }

    const userId = user.id;
    const anonymisedRef = `DEL-${Date.now()}-${userId.slice(0, 8)}`;

    console.log(`Account deletion requested for user ${userId}`);

    const { data: profile } = await supabase
      .from("profiles").select("company_id").eq("id", userId).maybeSingle();

    const deletionResults: Record<string, string> = {};
    const tables = [
      "ai_rate_limits", "audit_log", "audit_trail", "agent_conversations",
      "agent_briefings", "action_items", "risk_assessments", "score_history",
      "partner_interactions", "partners", "notifications", "user_preferences",
      "user_subscriptions", "feedback",
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq("user_id", userId);
      deletionResults[table] = error ? `ERROR: ${error.message}` : "DELETED";
    }

    const { error: profileError } = await supabase.from("profiles").delete().eq("id", userId);
    deletionResults["profiles"] = profileError ? `ERROR: ${profileError.message}` : "DELETED";

    if (profile?.company_id) {
      const { data: otherProfiles } = await supabase
        .from("profiles").select("id").eq("company_id", profile.company_id).neq("id", userId);
      if (!otherProfiles || otherProfiles.length === 0) {
        await supabase.from("scoring_config").delete().eq("company_id", profile.company_id);
        await supabase.from("alerts").delete().eq("company_id", profile.company_id);
        const { error: companyError } = await supabase.from("companies").delete().eq("id", profile.company_id);
        deletionResults["companies"] = companyError ? `ERROR: ${companyError.message}` : "DELETED";
      }
    }

    await supabase.from("compliance_log").insert({
      event_type: "account_deletion",
      anonymised_ref: anonymisedRef,
      metadata: {
        tables_processed: Object.keys(deletionResults),
        results: deletionResults,
        requested_at: new Date().toISOString(),
      },
    });

    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      console.error("Failed to delete auth user:", authDeleteError);
      return createErrorResponse(
        "Data deleted but auth record removal failed. Contact support.",
        500,
        "AUTH_DELETE_FAILED",
      );
    }

    console.log(`Account deletion complete for ${anonymisedRef}`);
    return createSuccessResponse({
      message: "Your account and all associated data have been permanently deleted.",
      anonymisedRef,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("delete-user-data error:", message);
    return createErrorResponse(message, 500, "INTERNAL_ERROR", true);
  }
});
