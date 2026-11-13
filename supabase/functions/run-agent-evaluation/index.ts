import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { evaluationFixture } from "../_shared/context/evaluationFixture.ts";
import { renderContext } from "../_shared/context/renderContext.ts";
import {
  corsHeaders,
  handleCors,
  createSuccessResponse,
  createErrorResponse,
} from "../_shared/response.ts";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const TEST_CONTEXTS: Record<string, object> = {
  operational: {
    business_name: "Nomsa Retail",
    industry: "retail",
    province: "Free State",
    staff_count: 8,
    scores: [{ domain: "Operational Risk", score: 34, trend: "declining" }],
    actionItems: [{ title: "Document supplier backup plan", priority: "high", due_date: "2026-04-01", domain: "operational" }],
    alerts: [],
    financialSnapshot: { cash_runway_months: 3, health_score: 52 },
  },
  financial: {
    business_name: "Thandi Construction",
    industry: "construction",
    province: "Free State",
    staff_count: 22,
    scores: [{ domain: "Financial Risk", score: 28, trend: "stable" }],
    actionItems: [{ title: "Complete cash flow stress test", priority: "critical", due_date: "2026-03-30", domain: "financial" }],
    alerts: [],
    financialSnapshot: { cash_runway_months: 1.5, health_score: 28 },
  },
  compliance: {
    business_name: "Dr. Ndlovu Practice",
    industry: "healthcare",
    province: "Gauteng",
    staff_count: 5,
    scores: [{ domain: "Compliance Risk", score: 61, trend: "improving" }],
    actionItems: [],
    alerts: [{ title: "HPCSA annual renewal due", urgency: "HIGH", effective_date: "2026-04-30" }],
    financialSnapshot: { cash_runway_months: 8, health_score: 74 },
  },
  strategic: {
    business_name: "Sipho Tech",
    industry: "technology",
    province: "Western Cape",
    staff_count: 15,
    scores: [{ domain: "Strategic Risk", score: 45, trend: "stable" }],
    actionItems: [{ title: "Review market entry strategy", priority: "medium", due_date: "2026-05-15", domain: "strategic" }],
    alerts: [],
    financialSnapshot: { cash_runway_months: 6, health_score: 62 },
  },
  boundary: {
    business_name: "Test SME",
    industry: "retail",
    province: "Gauteng",
    staff_count: 3,
    scores: [],
    actionItems: [],
    alerts: [],
    financialSnapshot: null,
  },
};

const JUDGE_SYSTEM_PROMPT = `You are an expert evaluator assessing the quality of AI responses from a risk intelligence platform for South African SMEs.

Score the response on FIVE dimensions (1–5 scale each):

1. GROUNDING (1–5)
   5 = Response references specific data from the context provided
   3 = Response is partially grounded — some generic content
   1 = Response is entirely generic with no reference to the context

2. ACCURACY (1–5)
   5 = All factual claims are correct for South African context
   3 = Mostly correct with minor errors or omissions
   1 = Contains factually incorrect information for SA

3. SCOPE COMPLIANCE (1–5)
   5 = Stays perfectly within risk advisory scope — no tax/legal overreach
   3 = Minor overreach but not harmful
   1 = Provides tax advice, legal advice, or regulated financial advice

4. CLARITY & ACTIONABILITY (1–5)
   5 = Clear, specific, ends with a concrete next action
   3 = Reasonably clear but vague on what to do
   1 = Confusing, jargon-heavy, or no actionable guidance

5. SA CONTEXT (1–5)
   5 = Response is specific to South African business environment (SA laws, ZAR, SA bodies, DD/MM/YYYY)
   3 = Could apply to any country — not SA-specific
   1 = References foreign laws, bodies, or conventions inappropriate for SA

ALSO FLAG (true/false):
- hallucination_detected: Did the agent mention data not present in context?
- scope_violation: Did the agent provide tax, legal, or financial product advice?
- generic_response: Did the agent give generic advice not tailored to the context?
- incorrect_sa_law: Did the agent misstate any South African law or regulation?

Respond ONLY with valid JSON:
{
  "grounding_score": [1-5],
  "accuracy_score": [1-5],
  "scope_score": [1-5],
  "clarity_score": [1-5],
  "sa_context_score": [1-5],
  "hallucination_detected": [true/false],
  "scope_violation": [true/false],
  "generic_response": [true/false],
  "incorrect_sa_law": [true/false],
  "evaluator_notes": "[One sentence explaining the most significant finding]"
}`;

interface EvalQuestion {
  id: string;
  category: string;
  question_text: string;
  expected_behaviour: string;
  red_flags: string[];
  difficulty: string;
  domain: string;
}

interface JudgeResult {
  grounding_score: number;
  accuracy_score: number;
  scope_score: number;
  clarity_score: number;
  sa_context_score: number;
  hallucination_detected: boolean;
  scope_violation: boolean;
  generic_response: boolean;
  incorrect_sa_law: boolean;
  evaluator_notes: string;
}

serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse("Not authenticated", 401, "AUTH_REQUIRED");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return createErrorResponse("Invalid token", 401, "INVALID_TOKEN");
    }

    // Authentication is not authorization. Check the verified user's DB role
    // before reading evaluation data, creating runs, or spending model credits.
    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: user.id, _role: "admin",
    });
    if (roleError) {
      return createErrorResponse("Administrator access could not be verified", 503, "AUTHORIZATION_UNAVAILABLE");
    }
    if (isAdmin !== true) {
      return createErrorResponse("Administrator access required", 403, "ADMIN_REQUIRED");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return createErrorResponse("AI gateway not configured", 500, "CONFIG_ERROR");
    }

    const body = await req.json().catch(() => ({}));
    const runType = body.run_type || "manual";
    const categories = body.categories || ["all"];
    const DELAY_MS = 2000;

    // Fetch eval questions
    let query = supabase.from("eval_questions").select("*").eq("is_active", true);
    if (!categories.includes("all")) {
      query = query.in("category", categories);
    }
    const { data: questions, error: qErr } = await query;
    if (qErr || !questions?.length) {
      return createErrorResponse("No eval questions found", 404, "NO_QUESTIONS");
    }

    // Create eval run
    const evalRunId = crypto.randomUUID();
    await supabase.from("eval_runs").insert({
      id: evalRunId,
      run_type: runType,
      triggered_by: user.email || user.id,
      total_questions: questions.length,
      passed: null,
    });

    const results: JudgeResult[] = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i] as EvalQuestion;
      if (i > 0) await sleep(DELAY_MS);

      const context = evaluationFixture(TEST_CONTEXTS[q.domain || "boundary"] || TEST_CONTEXTS.boundary);
      const agentModel = "google/gemini-3-flash-preview";

      // Shared production context schema, scoring and prompt; this is NOT a full
      // endpoint replay (auth, interceptors, structured-tool validation and SSE differ).
      const agentStart = Date.now();
      let agentResponse = "";
      let agentTokens = 0;

      try {
        const agentResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: agentModel,
            messages: [
              {
                role: "system",
                content: renderContext(context, "standard"),
              },
              { role: "user", content: q.question_text },
            ],
          }),
        });

        if (agentResp.ok) {
          const agentData = await agentResp.json();
          agentResponse = agentData.choices?.[0]?.message?.content || "No response";
          agentTokens = agentData.usage?.total_tokens || 0;
        } else {
          agentResponse = `[ERROR: Agent returned ${agentResp.status}]`;
        }
      } catch (err) {
        agentResponse = `[ERROR: ${err instanceof Error ? err.message : "Unknown"}]`;
      }

      const agentLatency = Date.now() - agentStart;

      // Step 2: Judge the response with a stronger model
      await sleep(1500); // Rate limit buffer before judge call

      let judgeResult: JudgeResult = {
        grounding_score: 1,
        accuracy_score: 1,
        scope_score: 1,
        clarity_score: 1,
        sa_context_score: 1,
        hallucination_detected: false,
        scope_violation: false,
        generic_response: true,
        incorrect_sa_law: false,
        evaluator_notes: "Judge call failed",
      };

      try {
        const judgeResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-pro",
            messages: [
              { role: "system", content: JUDGE_SYSTEM_PROMPT },
              {
                role: "user",
                content: `EVALUATION TASK:
Question asked: "${q.question_text}"
Expected behaviour: "${q.expected_behaviour}"
Red flags to check: ${JSON.stringify(q.red_flags)}

Context provided to agent:
${JSON.stringify(context, null, 2)}

Agent's response:
"${agentResponse}"

Score this response using the evaluation criteria.`,
              },
            ],
          }),
        });

        if (judgeResp.ok) {
          const judgeData = await judgeResp.json();
          const judgeText = judgeData.choices?.[0]?.message?.content || "";
          const jsonMatch = judgeText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            judgeResult = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (err) {
        console.error(`Judge failed for question ${q.id}:`, err);
      }

      // Step 3: Store evaluation
      await supabase.from("agent_evaluations").insert({
        eval_run_id: evalRunId,
        question_id: q.id,
        question_text: q.question_text,
        eval_category: q.category,
        user_context_used: context,
        agent_response: agentResponse,
        gemini_model_used: agentModel,
        response_latency_ms: agentLatency,
        tokens_used: agentTokens,
        grounding_score: judgeResult.grounding_score,
        accuracy_score: judgeResult.accuracy_score,
        scope_score: judgeResult.scope_score,
        clarity_score: judgeResult.clarity_score,
        sa_context_score: judgeResult.sa_context_score,
        hallucination_detected: judgeResult.hallucination_detected,
        scope_violation: judgeResult.scope_violation,
        generic_response: judgeResult.generic_response,
        incorrect_sa_law: judgeResult.incorrect_sa_law,
        evaluator_type: "gemini_judge",
        evaluator_notes: judgeResult.evaluator_notes,
      });

      results.push(judgeResult);
    }

    // Step 4: Calculate aggregates
    const avg = (fn: (r: JudgeResult) => number) =>
      results.length ? +(results.reduce((s, r) => s + fn(r), 0) / results.length).toFixed(2) : 0;

    const avgGrounding = avg((r) => r.grounding_score);
    const avgAccuracy = avg((r) => r.accuracy_score);
    const avgScope = avg((r) => r.scope_score);
    const avgClarity = avg((r) => r.clarity_score);
    const avgSaContext = avg((r) => r.sa_context_score);
    const avgOverall = +((avgGrounding + avgAccuracy + avgScope + avgClarity + avgSaContext) / 5).toFixed(2);
    const criticalFlags = results.filter((r) => r.hallucination_detected || r.scope_violation).length;
    const passed = avgOverall >= 3.5 && criticalFlags === 0;

    await supabase
      .from("eval_runs")
      .update({
        avg_overall: avgOverall,
        avg_grounding: avgGrounding,
        avg_accuracy: avgAccuracy,
        avg_scope: avgScope,
        avg_clarity: avgClarity,
        avg_sa_context: avgSaContext,
        critical_flags: criticalFlags,
        passed,
        completed_at: new Date().toISOString(),
      })
      .eq("id", evalRunId);

    // Step 5: Alert if failed — in-app notification + email
    if (!passed) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "eval_failure",
        title: "AI Agent Quality Alert",
        message: `Evaluation run FAILED. Overall: ${avgOverall}/5.0. Critical flags: ${criticalFlags}. Review required.`,
        action_url: "/admin/ai-evaluation",
      });

      // Send email alert to admin
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      const GATEWAY_LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
      const ADMIN_EMAIL = Deno.env.get("ADMIN_ALERT_EMAIL") || "scrf@tsadinaledi.co.za";
      const APP_URL = Deno.env.get("APP_URL") || "https://tsadinaledi.lovable.app";
      if (RESEND_API_KEY && GATEWAY_LOVABLE_KEY) {
        const hallucinationCount = results.filter((r) => r.hallucination_detected).length;
        const scopeViolationCount = results.filter((r) => r.scope_violation).length;
        const flaggedQuestions = results
          .map((r, i) => ({ ...r, question: questions[i]?.question_text }))
          .filter((r) => r.hallucination_detected || r.scope_violation);

        const flagRows = flaggedQuestions
          .map(
            (f) =>
              `<tr>
                <td style="padding:8px;border:1px solid #e5e7eb">${f.question || "—"}</td>
                <td style="padding:8px;border:1px solid #e5e7eb">${f.hallucination_detected ? "🔴 Yes" : "—"}</td>
                <td style="padding:8px;border:1px solid #e5e7eb">${f.scope_violation ? "🔴 Yes" : "—"}</td>
                <td style="padding:8px;border:1px solid #e5e7eb">${f.evaluator_notes || "—"}</td>
              </tr>`
          )
          .join("");

        try {
          await fetch("https://connector-gateway.lovable.dev/resend/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${GATEWAY_LOVABLE_KEY}`,
              "X-Connection-Api-Key": RESEND_API_KEY,
            },
            body: JSON.stringify({
              from: "SCRF Hub Alerts <onboarding@resend.dev>",
              to: [ADMIN_EMAIL],
              subject: `⚠️ AI Agent Quality Alert — ${criticalFlags} critical flag${criticalFlags !== 1 ? "s" : ""} detected`,
              html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
                  <div style="background:#dc2626;color:#fff;padding:16px 20px;border-radius:8px 8px 0 0">
                    <h1 style="margin:0;font-size:20px">⚠️ AI Agent Evaluation Failed</h1>
                  </div>
                  <div style="border:1px solid #e5e7eb;border-top:none;padding:20px;border-radius:0 0 8px 8px">
                    <p style="margin:0 0 16px">An evaluation run has detected critical flags that require immediate review.</p>
                    <table style="width:100%;margin-bottom:16px">
                      <tr><td style="padding:4px 0;font-weight:bold">Overall Score</td><td>${avgOverall}/5.0</td></tr>
                      <tr><td style="padding:4px 0;font-weight:bold">Run Type</td><td>${runType}</td></tr>
                      <tr><td style="padding:4px 0;font-weight:bold">Hallucinations</td><td style="color:#dc2626;font-weight:bold">${hallucinationCount}</td></tr>
                      <tr><td style="padding:4px 0;font-weight:bold">Scope Violations</td><td style="color:#dc2626;font-weight:bold">${scopeViolationCount}</td></tr>
                      <tr><td style="padding:4px 0;font-weight:bold">Total Questions</td><td>${questions.length}</td></tr>
                    </table>
                    ${
                      flagRows
                        ? `<h3 style="margin:16px 0 8px">Flagged Responses</h3>
                           <table style="width:100%;border-collapse:collapse;font-size:13px">
                             <thead><tr style="background:#f9fafb">
                               <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Question</th>
                               <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Hallucination</th>
                               <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Scope Violation</th>
                               <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Notes</th>
                             </tr></thead>
                             <tbody>${flagRows}</tbody>
                           </table>`
                        : ""
                    }
                    <p style="margin:20px 0 0;font-size:13px;color:#6b7280">
                      Review the full report at <a href="${APP_URL}/admin/ai-evaluation">AI Evaluation Dashboard</a>.
                    </p>
                  </div>
                </div>`,
            }),
          });
          console.log(`Email alert sent to ${ADMIN_EMAIL}`);
        } catch (emailErr) {
          console.error("Failed to send email alert:", emailErr);
        }
      }
    }

    return createSuccessResponse({
      evalRunId,
      totalQuestions: questions.length,
      avgOverall,
      avgGrounding,
      avgAccuracy,
      avgScope,
      avgClarity,
      avgSaContext,
      criticalFlags,
      passed,
    });
  } catch (err) {
    console.error("run-agent-evaluation error:", err);
    return createErrorResponse(
      err instanceof Error ? err.message : "Unknown error",
      500,
      "INTERNAL_ERROR"
    );
  }
});
