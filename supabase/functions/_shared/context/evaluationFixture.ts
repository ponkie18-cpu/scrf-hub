import { calculateScores, DEFAULT_DOMAIN_WEIGHTS, DOMAINS, type Assessment, type OpenAction, type Domain } from "../scoring/calculateScores.ts";
import type { Context } from "./schemas.ts";

/** Synthetic adapter only. Evaluation must not query a real customer's context. */
export function evaluationFixture(fixture: {
  business_name?: string; industry?: string; province?: string;
  scores?: { domain: string; score: number }[];
  actionItems?: { title: string; priority: string; due_date: string; domain: string }[];
  alerts?: { title: string }[];
}, asOf = new Date("2026-04-01T12:00:00Z")): Context {
  const assessments: Assessment[] = (fixture.scores || []).map((row, i) => {
    const domain = row.domain.split(" ")[0].toLowerCase() as Domain;
    if (!DOMAINS.includes(domain)) throw new Error("INVALID_FIXTURE_DOMAIN");
    return { id: `fixture-assessment-${i}`, domain, score: row.score, updated_at: asOf.toISOString() };
  });
  const actions: OpenAction[] = (fixture.actionItems || []).map((row, i) => ({
    id: `fixture-action-${i}`, title: row.title, domain: row.domain as Domain,
    priority: row.priority === "critical" ? "high" : row.priority as OpenAction["priority"],
    due_date: row.due_date,
  }));
  const config = { domain_weights: DEFAULT_DOMAIN_WEIGHTS };
  return {
    schemaVersion: "1", generatedAt: asOf.toISOString(), configurationHash: "synthetic-default-weights",
    scope: { userId: "synthetic-user", companyId: null, assessmentVisibility: "own" },
    profile: {}, company: { name: fixture.business_name, industry: fixture.industry, region: fixture.province, country: "South Africa" },
    assessments: assessments.length ? { status: "available", data: assessments } : { status: "missing" },
    actions: actions.length ? { status: "available", data: actions } : { status: "missing" },
    alerts: fixture.alerts?.length ? { status: "available", data: fixture.alerts.map((row, i) => ({
      id: `fixture-alert-${i}`, title: row.title, domain: null, priority: null, message: null,
      created_at: asOf.toISOString(), company_id: null,
    })) } : { status: "missing" },
    knowledge: { status: "missing" }, conversation: { status: "missing" },
    scoringConfig: { status: "available", data: config },
    scores: assessments.length ? { status: "available", data: calculateScores(assessments, actions, config, asOf) } : { status: "missing" },
    evidence: [], warnings: ["Synthetic evaluation fixture; not a live customer context."],
  };
}