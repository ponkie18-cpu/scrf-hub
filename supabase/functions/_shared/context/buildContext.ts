import { resolveScope } from "../auth/resolveScope.ts";
import { calculateScores, isOverdue } from "../scoring/calculateScores.ts";
import { loadActions, loadAssessments, loadScoringConfig } from "../scoring/loadScoringInputs.ts";
import { jurisdictionFor, loadApprovedKnowledge } from "./loadApprovedKnowledge.ts";
import { isRecord, readRows, rows, type Alert, type Context, type DatabaseClient } from "./schemas.ts";

export async function buildContext(
  db: DatabaseClient, userId: string, sessionId?: string, asOf = new Date(), includeKnowledge = false,
): Promise<Context> {
  const { scope, profile, company } = await resolveScope(db, userId);
  let alertQuery = db.from("alerts")
    .select("id,title,domain,priority,message,created_at,company_id").eq("dismissed", false)
    .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(5);
  alertQuery = scope.companyId
    ? alertQuery.or(`company_id.eq.${scope.companyId},company_id.is.null`)
    : alertQuery.is("company_id", null);
  const [assessments, actions, scoringConfig, alerts, conversation, knowledge] = await Promise.all([
    loadAssessments(db, scope), loadActions(db, scope), loadScoringConfig(db, scope),
    readRows(alertQuery, (row): row is Alert => isRecord(row) && typeof row.id === "string" &&
      typeof row.title === "string" && typeof row.created_at === "string" &&
      (row.company_id === null || (scope.companyId !== null && row.company_id === scope.companyId))),
    sessionId ? readRows(db.from("agent_conversations").select("role,content,created_at")
      .eq("user_id", scope.userId).eq("session_id", sessionId).eq("server_verified", true)
      .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(12),
    (row): row is { role: "user" | "assistant"; content: string; created_at: string } =>
      isRecord(row) && ["user", "assistant"].includes(String(row.role)) &&
      typeof row.content === "string" && typeof row.created_at === "string")
      : Promise.resolve({ status: "missing" as const }),
    includeKnowledge ? loadApprovedKnowledge(db, scope, jurisdictionFor(company?.country), asOf)
      : Promise.resolve({ status: "missing" as const }),
  ]);
  let scores: Context["scores"];
  if ([assessments, actions, scoringConfig].some((r) => r.status === "unavailable")) {
    scores = { status: "unavailable", errorCode: "SCORING_INPUT_UNAVAILABLE" };
  } else if (assessments.status === "missing") {
    scores = { status: "missing" };
  } else {
    try {
      scores = { status: "available", data: calculateScores(rows(assessments), rows(actions),
        scoringConfig.status === "available" ? scoringConfig.data : { domain_weights: {} }, asOf) };
    } catch { scores = { status: "unavailable", errorCode: "INVALID_SCORING_INPUT" }; }
  }
  const configText = JSON.stringify(scoringConfig.status === "available"
    ? Object.entries(scoringConfig.data.domain_weights).sort(([a], [b]) => a.localeCompare(b)) : null);
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(configText));
  const context: Context = {
    schemaVersion: "1", generatedAt: asOf.toISOString(), scope, profile, company,
    assessments, actions, alerts, conversation, knowledge, scoringConfig, scores,
    configurationHash: Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join(""),
    evidence: [], warnings: [],
  };
  for (const [key, result] of Object.entries({ assessments, actions, alerts, conversation, scoringConfig, scores, knowledge })) {
    if (result.status === "unavailable") context.warnings.push(`${key}: temporarily unavailable; do not infer absence.`);
  }
  if (scores.status === "available") {
    context.warnings.push(`Assessment coverage: ${scores.data.coverage.assessed}/4 domains. Missing domains are not zero.`);
    for (const [domain, score] of Object.entries(scores.data.domains)) {
      if (score.stale) context.warnings.push(`${domain}: assessment is over 30 days old.`);
    }
  }
  return context;
}

/** Compatibility adapter; all authority remains in Context, never client inputs. */
export function toUserContext(context: Context) {
  const assessments = rows(context.assessments);
  const actions = rows(context.actions);
  const asOf = new Date(context.generatedAt);
  const scores = context.scores.status === "available" ? context.scores.data : null;
  const financial = assessments.find((a) => a.domain === "financial");
  const records = (value: unknown[]) => value as Record<string, unknown>[];
  return {
    company: context.company, profile: context.profile,
    domainScores: Object.fromEntries(["operational", "financial", "compliance", "strategic"].map(
      (domain) => [domain, scores?.domains[domain]?.score ?? null],
    )) as Record<string, number | null>,
    overallScore: scores?.score ?? null,
    recentAssessments: records(assessments),
    activeActions: records([...actions].sort((a, b) =>
      Number(isOverdue(b.due_date, asOf)) - Number(isOverdue(a.due_date, asOf)) ||
      ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]) ||
      (a.due_date || "9999").localeCompare(b.due_date || "9999") || a.id.localeCompare(b.id)
    ).slice(0, 10)),
    pendingActions: context.actions.status === "unavailable" ? null : actions.length,
    overdueActions: context.actions.status === "unavailable" ? null : actions.filter((a) => isOverdue(a.due_date, asOf)).length,
    overdueDetails: records(actions.filter((a) => isOverdue(a.due_date, asOf))),
    unreadAlerts: records(rows(context.alerts)),
    financialSnapshot: financial && scores?.domains.financial ? {
      healthScore: scores.domains.financial.score, rawScore: financial.score,
      assessedAt: financial.updated_at, toolId: financial.tool_id,
    } : null,
    conversationMessages: records([...rows(context.conversation)].reverse().map((m) => ({ ...m, content: m.content.slice(0, 4000) }))),
    semanticContext: context,
  };
}
export type UserContext = ReturnType<typeof toUserContext>;