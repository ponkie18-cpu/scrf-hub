import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface AssessmentRecommendation {
  title: string;
  priority: "high" | "medium" | "low";
  description?: string;
}

export interface SaveAssessmentParams {
  domain: "operational" | "financial" | "compliance" | "strategic";
  toolId: string;
  answers: Record<string, unknown>;
  score: number;
  confidence?: number;
  insights: string[];
  recommendations: AssessmentRecommendation[];
}

export interface SaveAssessmentResult {
  success: boolean;
  assessmentId?: string;
  error?: string;
  savesRemaining?: number;
}

/**
 * Central service for saving tool assessment results to the database.
 * This function:
 * 1. Checks user tier and save limits
 * 2. Saves the assessment to `risk_assessments`
 * 3. Creates action items from high/medium priority recommendations
 * 4. Records score history for trend tracking
 * 5. Increments saves_used for free tier users
 */
export async function saveAssessmentAndActions(
  params: SaveAssessmentParams
): Promise<SaveAssessmentResult> {
  const { domain, toolId, answers, score, confidence = 1.0, insights, recommendations } = params;

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.warn("User not authenticated - assessment not saved to dashboard");
      return { success: false, error: "Not authenticated" };
    }

    // Check subscription tier and save limits
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("tier, saves_used, max_saves, trial_ends_at")
      .eq("user_id", user.id)
      .maybeSingle();

    const isOnTrial = subscription?.trial_ends_at && new Date(subscription.trial_ends_at) > new Date();
    const isPro = subscription?.tier === 'pro' || isOnTrial;
    
    // For free users, check save limits
    if (!isPro && subscription) {
      if (subscription.saves_used >= subscription.max_saves) {
        return { success: false, error: "Save limit reached. Upgrade to Pro for unlimited saves.", savesRemaining: 0 };
      }
    }

    // Get user's company_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .maybeSingle();

    const companyId = profile?.company_id || null;

    // 1. Save the assessment result
    const { data: assessment, error: assessmentError } = await supabase
      .from("risk_assessments")
      .insert([
        {
          user_id: user.id,
          company_id: companyId,
          domain,
          tool_id: toolId,
          score,
          confidence,
          assessment_data: answers as Json,
          insights: insights as unknown as Json,
          recommendations: recommendations as unknown as Json,
        },
      ])
      .select("id")
      .single();

    if (assessmentError) {
      console.error("Error saving assessment:", assessmentError);
      return { success: false, error: assessmentError.message };
    }

    // 2. Record score history for trend tracking
    await supabase.from("score_history").insert({
      user_id: user.id,
      domain,
      score,
    });

    // 3. Create action items from recommendations (high and medium priority only)
    const actionableRecs = recommendations.filter(
      (rec) => rec.priority === "high" || rec.priority === "medium"
    );

    if (actionableRecs.length > 0) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // Due in 30 days

      const actionsToInsert = actionableRecs.map((rec) => ({
        user_id: user.id,
        company_id: companyId,
        domain,
        title: rec.title,
        description: rec.description || `Generated from ${toolId} assessment`,
        priority: rec.priority,
        due_date: dueDate.toISOString().split("T")[0],
      }));

      const { error: actionsError } = await supabase
        .from("action_items")
        .insert(actionsToInsert);

      if (actionsError) {
        console.error("Error creating action items:", actionsError);
        // Don't fail the whole operation for action items
      }
    }

    // Increment saves_used for free tier users
    if (!isPro && subscription) {
      await supabase.rpc('increment_saves_used', { _user_id: user.id });
    }

    const savesRemaining = isPro ? undefined : (subscription ? subscription.max_saves - subscription.saves_used - 1 : 0);

    return { success: true, assessmentId: assessment.id, savesRemaining };
  } catch (error) {
    console.error("Assessment service error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Helper to calculate a score from boolean/string answers.
 * Useful for tools that have checkbox or yes/no questions.
 */
export function calculateScoreFromAnswers(
  answers: Record<string, unknown>,
  weights?: Record<string, number>
): number {
  const entries = Object.entries(answers);
  if (entries.length === 0) return 50;

  let totalScore = 0;
  let totalWeight = 0;

  for (const [key, value] of entries) {
    const weight = weights?.[key] ?? 1;
    let questionScore = 50;

    if (typeof value === "number") {
      questionScore = Math.min(100, Math.max(0, value));
    } else if (typeof value === "boolean") {
      questionScore = value ? 80 : 20;
    } else if (typeof value === "string") {
      const valueMap: Record<string, number> = {
        yes: 80,
        no: 30,
        partial: 50,
        unsure: 40,
        excellent: 100,
        good: 80,
        fair: 60,
        poor: 40,
        none: 20,
        high: 90,
        medium: 60,
        low: 30,
        always: 100,
        often: 75,
        sometimes: 50,
        rarely: 25,
        never: 10,
      };
      questionScore = valueMap[value.toLowerCase()] ?? 50;
    }

    totalScore += questionScore * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50;
}
