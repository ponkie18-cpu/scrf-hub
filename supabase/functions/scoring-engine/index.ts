import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.89.0";
import { calculateScores, DEFAULT_DOMAIN_WEIGHTS, isOverdue as dueDateIsOverdue } from "../_shared/scoring/calculateScores.ts";
import { loadAssessments, loadActions } from "../_shared/scoring/loadScoringInputs.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INDUSTRY_MULTIPLIERS: Record<string, Record<string, number>> = {
  manufacturing: { operational: 1.2, financial: 1.0, compliance: 0.9, strategic: 0.9 },
  technology: { operational: 0.9, financial: 1.0, compliance: 1.0, strategic: 1.1 },
  retail: { operational: 1.1, financial: 1.1, compliance: 0.9, strategic: 0.9 },
  healthcare: { operational: 1.0, financial: 0.9, compliance: 1.2, strategic: 0.9 },
  finance: { operational: 0.9, financial: 1.1, compliance: 1.1, strategic: 0.9 },
  general: { operational: 1.0, financial: 1.0, compliance: 1.0, strategic: 1.0 },
};

const CATEGORY_WEIGHTS: Record<string, Record<string, number>> = {
  operational: {
    supply_chain: 0.3,
    processes: 0.25,
    people: 0.25,
    technology: 0.2,
  },
  financial: {
    cash_flow: 0.35,
    tax_compliance: 0.25,
    debt_management: 0.2,
    financial_planning: 0.2,
  },
  compliance: {
    regulatory: 0.35,
    contractual: 0.30,
    data_protection: 0.35,
  },
  strategic: {
    cyber_security: 0.35,
    business_continuity: 0.35,
    market_risk: 0.30,
  },
};

interface CalculateRequest {
  type: "calculate_domain" | "calculate_overall" | "get_dashboard";
  toolId?: string;
  domain?: string;
  answers?: Record<string, unknown>;
  userId?: string;
}

interface ScoringConfig {
  domain_weights: Record<string, number>;
  industry_multipliers: Record<string, number>;
  category_weights: Record<string, Record<string, number>>;
  recency_bias: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: CalculateRequest = await req.json();

    // Get user profile and company info
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) throw new Error("SCORING_SCOPE_UNAVAILABLE");

    let company = null;
    let scoringConfig: ScoringConfig = {
      domain_weights: DEFAULT_DOMAIN_WEIGHTS,
      industry_multipliers: INDUSTRY_MULTIPLIERS.general,
      category_weights: CATEGORY_WEIGHTS,
      recency_bias: 0.7,
    };

    if (profile?.company_id) {
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("*")
        .eq("id", profile.company_id)
        .single();
      
      if (companyError || !companyData) throw new Error("SCORING_COMPANY_UNAVAILABLE");
      company = companyData;

      // Get custom scoring config
      const { data: configData, error: configError } = await supabase
        .from("scoring_config")
        .select("*")
        .eq("company_id", profile.company_id)
        .maybeSingle();

      if (configError) throw new Error("SCORING_CONFIG_UNAVAILABLE");

      if (configData) {
        scoringConfig.domain_weights = configData.domain_weights as Record<string, number>;
        if (configData.category_weights) {
          scoringConfig.category_weights = configData.category_weights as Record<string, Record<string, number>>;
        }
        scoringConfig.recency_bias = Number(configData.recency_bias) || 0.7;
      }

      // Apply industry multipliers
      if (company?.industry && INDUSTRY_MULTIPLIERS[company.industry]) {
        scoringConfig.industry_multipliers = INDUSTRY_MULTIPLIERS[company.industry];
      }
    }

    switch (body.type) {
      case "calculate_domain": {
        if (!body.domain || !body.answers) {
          return new Response(JSON.stringify({ error: "Missing domain or answers" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const result = calculateDomainScore(body.domain, body.answers, scoringConfig, company);
        
        // Save to risk_assessments
        const { data: assessment, error: saveError } = await supabase
          .from("risk_assessments")
          .insert({
            user_id: user.id,
            company_id: profile?.company_id,
            domain: body.domain,
            tool_id: body.toolId,
            score: result.score,
            assessment_data: body.answers,
            insights: result.insights,
            recommendations: result.recommendations,
            confidence: result.confidence,
          })
          .select()
          .single();

        if (saveError) {
          console.error("Error saving assessment:", saveError);
        }

        // Record score history
        await supabase.from("score_history").insert({
          user_id: user.id,
          domain: body.domain,
          score: result.score,
        });

        // Create action items from recommendations
        const highPriorityRecs = result.recommendations.filter(
          (r: { priority: string }) => r.priority === "high" || r.priority === "critical"
        );
        
        if (highPriorityRecs.length > 0) {
          const actions = highPriorityRecs.map((rec: { action: string; priority: string; estimatedTime?: number }) => ({
            user_id: user.id,
            company_id: profile?.company_id,
            domain: body.domain,
            title: rec.action,
            priority: rec.priority === "critical" ? "high" : rec.priority,
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          }));

          await supabase.from("action_items").insert(actions);
        }

        // Calculate and record overall score
        const overallScore = await calculateOverallScore(user.id, supabase, scoringConfig);
        await supabase.from("score_history").insert({
          user_id: user.id,
          domain: "overall",
          score: overallScore.score,
        });

        return new Response(JSON.stringify({
          ...result,
          overallScore: overallScore.score,
          assessmentId: assessment?.id,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "calculate_overall": {
        const result = await calculateOverallScore(user.id, supabase, scoringConfig);
        
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_dashboard": {
        const dashboardData = await getDashboardData(user.id, profile?.company_id, supabase, scoringConfig);
        
        return new Response(JSON.stringify(dashboardData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid request type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Scoring engine error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function calculateDomainScore(
  domain: string,
  answers: Record<string, unknown>,
  config: ScoringConfig,
  company: { industry?: string; size?: string } | null
) {
  // Calculate raw score based on answers
  let rawScore = 0;
  let answeredQuestions = 0;
  const breakdown: { category: string; score: number; weight: number; reasons: string[] }[] = [];
  const insights: string[] = [];
  const recommendations: { priority: string; action: string; estimatedTime: number; domain: string }[] = [];

  // Process answers - assuming answers are in format { category_questionId: value }
  const categoryScores: Record<string, { total: number; count: number; answers: string[] }> = {};
  
  for (const [key, value] of Object.entries(answers)) {
    const parts = key.split("_");
    const category = parts[0] || "general";
    
    if (!categoryScores[category]) {
      categoryScores[category] = { total: 0, count: 0, answers: [] };
    }

    // Convert answer to score (0-100 scale)
    let questionScore = 0;
    if (typeof value === "number") {
      questionScore = Math.min(100, Math.max(0, value));
    } else if (typeof value === "boolean") {
      questionScore = value ? 80 : 20;
    } else if (typeof value === "string") {
      // Map common string answers to scores
      const valueMap: Record<string, number> = {
        "excellent": 100, "good": 80, "fair": 60, "poor": 40, "none": 20,
        "yes": 80, "no": 30, "partial": 50,
        "high": 90, "medium": 60, "low": 30,
        "always": 100, "often": 75, "sometimes": 50, "rarely": 25, "never": 0,
      };
      questionScore = valueMap[value.toLowerCase()] ?? 50;
    }

    categoryScores[category].total += questionScore;
    categoryScores[category].count++;
    categoryScores[category].answers.push(String(value));
    answeredQuestions++;
  }

  // Calculate weighted category scores
  const categoryWeights = config.category_weights[domain] || {};
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [category, data] of Object.entries(categoryScores)) {
    const categoryScore = data.count > 0 ? data.total / data.count : 0;
    const weight = categoryWeights[category] ?? 1 / Object.keys(categoryScores).length;
    
    weightedSum += categoryScore * weight;
    totalWeight += weight;

    breakdown.push({
      category,
      score: Math.round(categoryScore),
      weight,
      reasons: data.answers,
    });

    // Generate insights based on low scores
    if (categoryScore < 50) {
      insights.push(`Your ${category.replace(/_/g, " ")} needs attention with a score of ${Math.round(categoryScore)}.`);
      recommendations.push({
        priority: categoryScore < 30 ? "critical" : "high",
        action: `Review and improve ${category.replace(/_/g, " ")} practices`,
        estimatedTime: 30,
        domain,
      });
    } else if (categoryScore < 70) {
      insights.push(`${category.replace(/_/g, " ")} shows room for improvement.`);
      recommendations.push({
        priority: "medium",
        action: `Consider strengthening ${category.replace(/_/g, " ")} controls`,
        estimatedTime: 20,
        domain,
      });
    }
  }

  rawScore = totalWeight > 0 ? weightedSum / totalWeight : 50;

  // Apply industry multiplier
  const industryMultiplier = config.industry_multipliers[domain] ?? 1.0;
  rawScore = rawScore * industryMultiplier;

  // Calculate confidence based on completeness
  const expectedQuestions = 10; // Baseline expected questions per domain
  const confidence = Math.min(1, answeredQuestions / expectedQuestions);

  // Apply confidence adjustment (incomplete assessments get slight penalty)
  if (confidence < 0.5) {
    rawScore = rawScore * (0.8 + confidence * 0.4);
    insights.push("Assessment confidence is low due to incomplete data. Consider answering more questions.");
  }

  // Clamp score to 0-100
  const finalScore = Math.round(Math.max(0, Math.min(100, rawScore)));

  // Add overall insight
  if (finalScore >= 80) {
    insights.unshift(`Excellent ${domain} risk management with a score of ${finalScore}.`);
  } else if (finalScore >= 60) {
    insights.unshift(`Good ${domain} position with room for improvement.`);
  } else if (finalScore >= 40) {
    insights.unshift(`${domain.charAt(0).toUpperCase() + domain.slice(1)} risks require attention.`);
  } else {
    insights.unshift(`Critical attention needed for ${domain} risks.`);
  }

  return {
    score: finalScore,
    confidence,
    breakdown,
    insights,
    recommendations,
  };
}

interface AssessmentRow {
  domain: string;
  score: number;
  updated_at: string;
  confidence: number | null;
}

interface ActionRow {
  domain: string;
  priority: string;
  completed: boolean;
  completed_at: string | null;
  due_date: string | null;
}

interface ScoreHistoryRow {
  domain: string;
  score: number;
  recorded_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function calculateOverallScore(
  userId: string,
  supabase: any,
  config: ScoringConfig
) {
  const scope = { userId, companyId: null, assessmentVisibility: "own" as const };
  const [assessments, actions] = await Promise.all([
    loadAssessments(supabase, scope), loadActions(supabase, scope),
  ]);
  if (assessments.status === "unavailable" || actions.status === "unavailable") {
    throw new Error("SCORING_INPUT_UNAVAILABLE");
  }
  const result = calculateScores(
    assessments.status === "available" ? assessments.data : [],
    actions.status === "available" ? actions.data : [], config, new Date(),
  );
  // Preserve legacy numeric API while exposing absence explicitly to newer clients.
  return { ...result, score: result.score ?? 0, scoreStatus: result.score === null ? "missing" : "available" };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getDashboardData(
  userId: string,
  companyId: string | undefined,
  supabase: any,
  config: ScoringConfig
) {
  // Parallel data fetching
  const [overallResult, actionsResult, alertsResult, historyResult, notificationsResult] = await Promise.all([
    calculateOverallScore(userId, supabase, config),
    supabase
      .from("action_items")
      .select("*")
      .eq("user_id", userId)
      .order("due_date", { ascending: true })
      .limit(50),
    companyId
      ? supabase
          .from("alerts")
          .select("*")
          .or(`company_id.eq.${companyId},company_id.is.null`)
          .eq("dismissed", false)
          .order("created_at", { ascending: false })
          .limit(10)
      : Promise.resolve({ data: [] }),
    supabase
      .from("score_history")
      .select("domain, score, recorded_at")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false })
      .limit(100),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("read", false)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const actions = (actionsResult.data || []) as ActionRow[];
  const pendingActions = actions.filter((a) => !a.completed);
  const completedThisWeek = actions.filter((a) => {
    if (!a.completed || !a.completed_at) return false;
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return new Date(a.completed_at).getTime() > weekAgo;
  });

  // Calculate weekly activity
  const historyData = (historyResult.data || []) as ScoreHistoryRow[];
  const weeklyActivity = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split("T")[0];
    
    const assessments = historyData.filter((h) => 
      h.recorded_at.startsWith(dateStr)
    ).length;
    
    const actionsCompleted = completedThisWeek.filter((a) =>
      a.completed_at?.startsWith(dateStr)
    ).length;

    weeklyActivity.push({
      date: dateStr,
      assessments,
      actionsCompleted,
    });
  }

  return {
    overallScore: overallResult.score,
    scoreStatus: overallResult.scoreStatus,
    coverage: overallResult.coverage,
    domains: overallResult.domains,
    trend: calculateTrend(historyData),
    weeklyActivity,
    actions: {
      critical: pendingActions.filter((a) => a.priority === "high" && isOverdue(a.due_date)),
      highPriority: pendingActions.filter((a) => a.priority === "high" && !isOverdue(a.due_date)),
      upcoming: pendingActions.filter((a) => a.priority !== "high"),
      recentlyCompleted: completedThisWeek.slice(0, 5),
      stats: {
        total: pendingActions.length,
        completedThisWeek: completedThisWeek.length,
        overdue: pendingActions.filter((a) => isOverdue(a.due_date)).length,
        completionRate: actions.length > 0 
          ? Math.round((actions.filter((a) => a.completed).length / actions.length) * 100) 
          : 0,
      },
    },
    alerts: alertsResult.data || [],
    unreadNotifications: notificationsResult.data?.length || 0,
    scoreHistory: historyData,
  };
}

function calculateTrend(history: ScoreHistoryRow[]) {
  const overallHistory = history.filter((h) => h.domain === "overall");
  if (overallHistory.length < 2) return { direction: "stable", change: 0 };

  const sorted = overallHistory.sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );

  const recent = sorted[0]?.score || 0;
  const previous = sorted[1]?.score || 0;
  const change = recent - previous;

  return {
    direction: change > 0 ? "up" : change < 0 ? "down" : "stable",
    change: Math.abs(change),
  };
}

function isOverdue(dueDate: string | null): boolean {
  return dueDateIsOverdue(dueDate, new Date());
}