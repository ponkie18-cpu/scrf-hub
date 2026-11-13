/** Pure scoring shared by the dashboard and agent. No database or model calls. */
export const DOMAINS = ["operational", "financial", "compliance", "strategic"] as const;
export type Domain = typeof DOMAINS[number];
export const SCORING_VERSION = "resilience-v1";
export const DEFAULT_DOMAIN_WEIGHTS: Record<Domain, number> = {
  operational: 0.25, financial: 0.25, compliance: 0.25, strategic: 0.25,
};
export interface Assessment {
  id: string;
  domain: Domain;
  score: number;
  updated_at: string;
  tool_id?: string | null;
  assessment_data?: Record<string, unknown>;
}
export interface OpenAction {
  id: string;
  domain: Domain;
  priority: "high" | "medium" | "low";
  title: string;
  due_date: string | null;
  description?: string | null;
}
export interface ScoringConfig { domain_weights: Record<string, number> }

export function calculateScores(
  assessments: Assessment[], actions: OpenAction[], config: ScoringConfig, asOf: Date,
) {
  const now = asOf.getTime();
  if (!Number.isFinite(now)) throw new Error("INVALID_SCORING_DATE");
  if (Object.entries(config.domain_weights).some(([key, weight]) =>
    !DOMAINS.includes(key as Domain) || !Number.isFinite(weight) || weight < 0
  ) || !Object.values(config.domain_weights).some((weight) => weight > 0)) {
    throw new Error("INVALID_SCORING_WEIGHTS");
  }
  const latest = new Map<Domain, Assessment>();
  for (const row of [...assessments].sort((a, b) =>
    b.updated_at.localeCompare(a.updated_at) || b.id.localeCompare(a.id)
  )) {
    if (!DOMAINS.includes(row.domain) || !Number.isFinite(row.score) ||
      row.score < 0 || row.score > 100 || !Number.isFinite(Date.parse(row.updated_at))) {
      throw new Error("INVALID_ASSESSMENT");
    }
    if (!latest.has(row.domain)) latest.set(row.domain, row);
  }
  const actionPenalties: Record<string, number> = {};
  for (const action of actions) {
    if (!DOMAINS.includes(action.domain) || !["high", "medium", "low"].includes(action.priority)) {
      throw new Error("INVALID_ACTION");
    }
    actionPenalties[action.domain] = (actionPenalties[action.domain] || 0) +
      (action.priority === "high" ? 5 : action.priority === "medium" ? 3 : 1);
  }
  const domains: Record<string, {
    score: number; rawScore: number; trend: string; lastUpdated: string;
    assessmentId: string; stale: boolean; timeFactor: number; actionPenalty: number;
  }> = {};
  let weightedSum = 0;
  let totalWeight = 0;
  for (const [domain, weight] of Object.entries(config.domain_weights)) {
    const row = latest.get(domain as Domain);
    if (!row) continue;
    const age = (now - Date.parse(row.updated_at)) / 86_400_000;
    // Preserve existing algorithm and strict boundary comparisons.
    const timeFactor = age > 90 ? 0.9 : age > 30 ? 0.95 : 1;
    const actionPenalty = Math.min(20, actionPenalties[domain] || 0);
    const adjusted = Math.max(0, row.score * timeFactor - actionPenalty);
    weightedSum += adjusted * weight;
    totalWeight += weight;
    domains[domain] = {
      score: Math.round(adjusted), rawScore: row.score, trend: "stable",
      lastUpdated: row.updated_at, assessmentId: row.id,
      stale: age > 30, timeFactor, actionPenalty,
    };
  }
  return {
    score: totalWeight > 0 ? Math.round(weightedSum / totalWeight) : null,
    domains, actionPenalties, version: SCORING_VERSION,
    coverage: { assessed: latest.size, total: DOMAINS.length, domains: [...latest.keys()] },
  };
}

/** due_date is a DATE, not a timestamp: today's actions are not overdue. */
export function isOverdue(dueDate: string | null, asOf: Date): boolean {
  return !!dueDate && dueDate < asOf.toISOString().slice(0, 10);
}