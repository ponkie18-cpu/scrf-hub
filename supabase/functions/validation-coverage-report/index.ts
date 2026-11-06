import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const DOMAINS = ["fais_financial_conduct", "popia", "cipc_companies_act", "labour_bcea", "fais_financial"];
    const now = new Date();
    const reportMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

    const metrics: any[] = [];

    for (const domain of DOMAINS) {
      // Get reviews for this domain in the current month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { data: reviews, error: reviewsError } = await supabase
        .from("expert_reviews")
        .select(`
          accuracy_score, sa_compliance_score, completeness_score, sme_accessibility_score,
          is_advice_harmful, is_advice_misleading,
          response:validation_responses!inner(
            question:validation_questions!inner(domain)
          )
        `)
        .gte("reviewed_at", startOfMonth)
        .lte("reviewed_at", endOfMonth);

      if (reviewsError) {
        console.error(`Error fetching reviews for ${domain}:`, reviewsError);
        continue;
      }

      // Filter reviews for this domain
      const domainReviews = (reviews || []).filter(
        (r: any) => r.response?.question?.domain === domain
      );

      if (domainReviews.length === 0) {
        metrics.push({
          report_month: reportMonth,
          domain,
          avg_accuracy_score: null,
          avg_compliance_score: null,
          avg_completeness_score: null,
          avg_accessibility_score: null,
          total_reviews: 0,
          harmful_count: 0,
          misleading_count: 0,
          corrections_applied: 0,
          corrections_pending: 0,
        });
        continue;
      }

      // Calculate averages
      const totalReviews = domainReviews.length;
      const avgAccuracy = domainReviews.reduce((sum: number, r: any) => sum + (r.accuracy_score || 0), 0) / totalReviews;
      const avgCompliance = domainReviews.reduce((sum: number, r: any) => sum + (r.sa_compliance_score || 0), 0) / totalReviews;
      const avgCompleteness = domainReviews.reduce((sum: number, r: any) => sum + (r.completeness_score || 0), 0) / totalReviews;
      const avgAccessibility = domainReviews.reduce((sum: number, r: any) => sum + (r.sme_accessibility_score || 0), 0) / totalReviews;

      const harmfulCount = domainReviews.filter((r: any) => r.is_advice_harmful).length;
      const misleadingCount = domainReviews.filter((r: any) => r.is_advice_misleading).length;

      // Get corrections counts for this domain
      const { count: appliedCount } = await supabase
        .from("knowledge_corrections")
        .select("id", { count: "exact", head: true })
        .eq("domain", domain)
        .eq("applied_to_system_prompt", true)
        .gte("applied_at", startOfMonth)
        .lte("applied_at", endOfMonth);

      const { count: pendingCount } = await supabase
        .from("knowledge_corrections")
        .select("id", { count: "exact", head: true })
        .eq("domain", domain)
        .eq("applied_to_system_prompt", false);

      metrics.push({
        report_month: reportMonth,
        domain,
        avg_accuracy_score: avgAccuracy.toFixed(2),
        avg_compliance_score: avgCompliance.toFixed(2),
        avg_completeness_score: avgCompleteness.toFixed(2),
        avg_accessibility_score: avgAccessibility.toFixed(2),
        total_reviews: totalReviews,
        harmful_count: harmfulCount,
        misleading_count: misleadingCount,
        corrections_applied: appliedCount || 0,
        corrections_pending: pendingCount || 0,
      });
    }

    // Upsert metrics (update if exists for this month/domain)
    for (const metric of metrics) {
      const { error: upsertError } = await supabase
        .from("validation_metrics")
        .upsert(metric, { onConflict: "report_month,domain" });

      if (upsertError) {
        console.error(`Error upserting metric for ${metric.domain}:`, upsertError);
      }
    }

    // Find domain with lowest accuracy
    const validMetrics = metrics.filter(m => m.avg_accuracy_score !== null);
    const lowestAccuracyDomain = validMetrics.sort(
      (a, b) => parseFloat(a.avg_accuracy_score) - parseFloat(b.avg_accuracy_score)
    )[0];

    return new Response(
      JSON.stringify({
        success: true,
        reportMonth,
        domainMetrics: metrics,
        priorityDomain: lowestAccuracyDomain?.domain || null,
        summary: {
          totalReviews: metrics.reduce((sum, m) => sum + m.total_reviews, 0),
          totalHarmful: metrics.reduce((sum, m) => sum + m.harmful_count, 0),
          totalMisleading: metrics.reduce((sum, m) => sum + m.misleading_count, 0),
          totalCorrectionsApplied: metrics.reduce((sum, m) => sum + m.corrections_applied, 0),
          totalCorrectionsPending: metrics.reduce((sum, m) => sum + m.corrections_pending, 0),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("validation-coverage-report error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
