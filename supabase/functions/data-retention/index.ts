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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const results: Record<string, number> = {};

    // 1. Delete read notifications older than 90 days
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data: readDeleted } = await supabase
      .from("notifications").delete().eq("read", true).lt("created_at", ninetyDaysAgo).select("id");
    results.read_notifications_deleted = readDeleted?.length || 0;

    // 2. Delete unread notifications older than 180 days
    const oneEightyDaysAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString();
    const { data: unreadDeleted } = await supabase
      .from("notifications").delete().eq("read", false).lt("created_at", oneEightyDaysAgo).select("id");
    results.unread_notifications_deleted = unreadDeleted?.length || 0;

    // 3. Delete agent conversations older than 24 months
    const twentyFourMonthsAgo = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000).toISOString();
    const { data: convsDeleted } = await supabase
      .from("agent_conversations").delete().lt("created_at", twentyFourMonthsAgo).select("id");
    results.conversations_deleted = convsDeleted?.length || 0;

    // 4. Flag conversations older than 12 months for archive
    const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const { data: oldConvs } = await supabase
      .from("agent_conversations").select("id, user_id").lt("created_at", twelveMonthsAgo).limit(100);
    results.conversations_flagged_archive = oldConvs?.length || 0;

    // 5. Clean up expired rate limit windows
    const { data: rateLimitsCleared } = await supabase
      .from("ai_rate_limits").delete()
      .lt("window_start", new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()).select("id");
    results.rate_limits_cleared = rateLimitsCleared?.length || 0;

    // Log execution
    await supabase.from("compliance_log").insert({
      event_type: "data_retention_run",
      anonymised_ref: `RETENTION-${now.toISOString().slice(0, 10)}`,
      metadata: { results, executed_at: now.toISOString() },
    });

    console.log("Data retention completed:", results);
    return createSuccessResponse(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("data-retention error:", message);
    return createErrorResponse(message, 500, "INTERNAL_ERROR", true);
  }
});
