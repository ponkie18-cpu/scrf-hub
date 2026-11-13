// @vitest-environment node
import { describe, expect, it } from "vitest";
import { calculateScores, DEFAULT_DOMAIN_WEIGHTS, isOverdue, type Assessment, type OpenAction } from "../../supabase/functions/_shared/scoring/calculateScores";
import { buildContext, toUserContext } from "../../supabase/functions/_shared/context/buildContext";
import { logContextValidation } from "../../supabase/functions/_shared/context/logContextEvent";
import { loadAssessments, loadScoringConfig } from "../../supabase/functions/_shared/scoring/loadScoringInputs";
import { jurisdictionFor, knowledgeApplies, loadApprovedKnowledge } from "../../supabase/functions/_shared/context/loadApprovedKnowledge";
import { evaluationFixture } from "../../supabase/functions/_shared/context/evaluationFixture";
import { renderContext } from "../../supabase/functions/_shared/context/renderContext";
import { attachEvidence, validateEvidence } from "../../supabase/functions/_shared/context/validateEvidence";
import { decodeStructuredAnswer } from "../../supabase/functions/_shared/context/validateStructuredAnswer";
import { readRows, type Knowledge, type Scope } from "../../supabase/functions/_shared/context/schemas";

const asOf = new Date("2026-11-13T12:00:00Z");
const config = { domain_weights: DEFAULT_DOMAIN_WEIGHTS };
const scope: Scope = { userId: "user-a", companyId: "company-a", assessmentVisibility: "own" };
const assessment = (days = 0, score = 80, domain: Assessment["domain"] = "financial"): Assessment => ({
  id: `assessment-${domain}-${days}`, domain, score,
  updated_at: new Date(asOf.getTime() - days * 86400000).toISOString(),
});
const action = (priority: OpenAction["priority"] = "high"): OpenAction => ({
  id: "action-1", title: "Follow up", domain: "financial", priority, due_date: "2026-11-12",
});

// Deterministic Supabase-boundary fake: records every predicate, no live services.
function database(respond: (table: string, predicates: unknown[][]) => { data: unknown; error: unknown }) {
  const calls: { table: string; predicates: unknown[][] }[] = [];
  return { calls, from(table: string) {
    const predicates: unknown[][] = [];
    calls.push({ table, predicates });
    const query: Record<string, unknown> = {};
    for (const method of ["select", "eq", "is", "in", "or", "lte", "order", "limit", "range", "maybeSingle"]) {
      query[method] = (...args: unknown[]) => { predicates.push([method, ...args]); return query; };
    }
    query.then = (resolve: (value: unknown) => unknown, reject: (value: unknown) => unknown) =>
      Promise.resolve(respond(table, predicates)).then(resolve, reject);
    return query;
  } };
}

describe("shared resilience scoring", () => {
  it.each([[30, 80], [30.001, 76], [90, 76], [90.001, 72]])("preserves age boundary %s days", (days, expected) => {
    expect(calculateScores([assessment(days)], [], config, asOf).score).toBe(expected);
  });
  it("subtracts unrounded action penalties, caps at 20 and floors scores at zero", () => {
    expect(calculateScores([assessment(31)], [action(), action("medium"), action("low")], config, asOf).score).toBe(67);
    expect(calculateScores([assessment()], Array.from({ length: 10 }, () => action()), config, asOf).score).toBe(60);
    expect(calculateScores([assessment(0, 2)], [action()], config, asOf).score).toBe(0);
  });
  it("aggregates unrounded domain values, not rounded display values", () => {
    const weights = { domain_weights: { financial: .9, operational: .1 } };
    const result = calculateScores([assessment(31, 51), assessment(31, 52, "operational")], [], weights, asOf);
    expect(result.domains.financial.score).toBe(48);
    expect(result.domains.operational.score).toBe(49);
    expect(result.score).toBe(49); // 48.545, not round(48*.9 + 49*.1)=48
  });
  it("renormalises weights over assessed domains and preserves missing versus zero", () => {
    expect(calculateScores([], [], config, asOf).score).toBeNull();
    const result = calculateScores([assessment(0, 0)], [], config, asOf);
    expect(result.score).toBe(0);
    expect(result.coverage.assessed).toBe(1);
    expect(result.domains.operational).toBeUndefined();
  });
  it("uses latest timestamp with deterministic ID tie-breaking", () => {
    const result = calculateScores([{ ...assessment(0, 50), id: "a" }, { ...assessment(0, 80), id: "z" }, assessment(1, 90)], [], config, asOf);
    expect(result.score).toBe(80);
  });
  it.each([NaN, -1, 101])("rejects invalid assessment score %s", (score) => {
    expect(() => calculateScores([assessment(0, score)], [], config, asOf)).toThrow("INVALID_ASSESSMENT");
  });
  it("rejects invalid weights", () => {
    expect(() => calculateScores([], [], { domain_weights: { financial: -1 } }, asOf)).toThrow();
    expect(() => calculateScores([], [], { domain_weights: { financial: 0 } }, asOf)).toThrow();
  });
  it("does not mark a DATE due today as overdue", () => {
    expect(isOverdue("2026-11-13", asOf)).toBe(false);
    expect(isOverdue("2026-11-12", asOf)).toBe(true);
    expect(isOverdue(null, asOf)).toBe(false);
  });
});

describe("scope and source-state boundaries", () => {
  it.each([
    { name: "fresh assessment", assessments: [assessment()], actions: [], config, expected: 80 },
    { name: "stale weighted assessments and actions", assessments: [assessment(31, 51), assessment(31, 52, "operational")], actions: [action("medium")], config: { domain_weights: { financial: .9, operational: .1 } }, expected: 46 },
    { name: "measured zero with partial coverage", assessments: [assessment(0, 0)], actions: [action()], config, expected: 0 },
  ])("matches canonical scoring through context assembly: $name", async (fixture) => {
    const db = database((table, predicates) => {
      const domain = predicates.find((p) => p[0] === "eq" && p[1] === "domain")?.[2];
      return { error: null, data:
        table === "profiles" ? { id: "user-a", company_id: "company-a" } :
        table === "companies" ? { id: "company-a", country: "ZA" } :
        table === "scoring_config" ? fixture.config :
        table === "risk_assessments" ? fixture.assessments.filter((row) => row.domain === domain) :
        table === "action_items" ? fixture.actions : [],
      };
    });
    const context = await buildContext(db, "user-a", undefined, asOf);
    const adapter = toUserContext(context);
    const canonical = calculateScores(fixture.assessments, fixture.actions, fixture.config, asOf);
    expect(adapter.overallScore).toBe(fixture.expected);
    expect(adapter.overallScore).toBe(canonical.score);
    for (const domain of ["operational", "financial", "compliance", "strategic"]) {
      expect(adapter.domainScores[domain]).toBe(canonical.domains[domain]?.score ?? null);
    }
  });
  it("does not write validation metadata when audit logging is disabled", async () => {
    await expect(logContextValidation({ from: () => { throw new Error("Must not query"); } }, null, ["VALIDATED"]))
      .resolves.toBeUndefined();
  });
  it("separates a query failure from successful absence and invalid source output", async () => {
    const validate = (value: unknown): value is string => typeof value === "string";
    expect(await readRows(Promise.resolve({ data: [], error: null }), validate)).toEqual({ status: "missing" });
    expect(await readRows(Promise.resolve({ data: [], error: { message: "private details" } }), validate)).toEqual({ status: "unavailable", errorCode: "QUERY_FAILED" });
    expect(await readRows(Promise.resolve({ data: [42], error: null }), validate)).toEqual({ status: "unavailable", errorCode: "INVALID_SOURCE_DATA" });
  });
  it("loads the latest assessment separately for every domain under own-user scope", async () => {
    const db = database((_table, predicates) => {
      const domain = predicates.find((p) => p[0] === "eq" && p[1] === "domain")?.[2] as Assessment["domain"];
      return { data: [assessment(0, 70, domain)], error: null };
    });
    const result = await loadAssessments(db, scope);
    expect(result.status).toBe("available");
    if (result.status === "available") expect(result.data).toHaveLength(4);
    for (const { predicates } of db.calls) {
      expect(predicates).toContainEqual(["eq", "user_id", "user-a"]);
      expect(predicates).toContainEqual(["limit", 1]);
      expect(predicates).toContainEqual(["order", "id", { ascending: false }]);
    }
  });
  it("only uses default scoring weights after successful config absence", async () => {
    expect((await loadScoringConfig(database(() => ({ data: null, error: null })), scope)).status).toBe("available");
    expect((await loadScoringConfig(database(() => ({ data: null, error: "timeout" })), scope)).status).toBe("unavailable");
  });
  it("fails closed when profile scope cannot be established", async () => {
    await expect(buildContext(database(() => ({ data: null, error: "failed" })), "user-a")).rejects.toThrow("CONTEXT_SCOPE_UNAVAILABLE");
  });
  it("scopes alerts and bounded history; a failed action query makes overall score unavailable", async () => {
    const db = database((table) => ({ error: table === "action_items" ? "timeout" : null, data:
      table === "profiles" ? { id: "user-a", company_id: "company-a" } :
      table === "companies" ? { id: "company-a", country: "ZA" } :
      table === "scoring_config" ? null : [],
    }));
    const result = await buildContext(db, "user-a", "session-a", asOf);
    expect(result.scores.status).toBe("unavailable");
    expect(result.warnings.some((w) => w.includes("actions: temporarily unavailable"))).toBe(true);
    expect(db.calls.find((q) => q.table === "alerts")?.predicates).toContainEqual(["or", "company_id.eq.company-a,company_id.is.null"]);
    const history = db.calls.find((q) => q.table === "agent_conversations")!.predicates;
    expect(history).toContainEqual(["eq", "user_id", "user-a"]);
    expect(history).toContainEqual(["eq", "session_id", "session-a"]);
    expect(history).toContainEqual(["eq", "server_verified", true]);
    expect(history).toContainEqual(["limit", 12]);
  });
});

const knowledge: Knowledge = {
  id: "k1", domain: "general", corrected_statement: "Verified guidance", supporting_reference: "Reference",
  revision: 1, scope: "global", company_id: null, jurisdiction: "ZA", status: "approved",
  effective_from: "2026-01-01T00:00:00Z", effective_to: null, review_due_at: "2027-01-01T00:00:00Z",
};
describe("knowledge governance and provenance", () => {
  it("normalises explicit jurisdiction and never assumes ZA for unknown country", () => {
    expect(jurisdictionFor("South Africa")).toBe("ZA");
    expect(jurisdictionFor("UK")).toBe("GB");
    expect(jurisdictionFor(null)).toBe("unknown");
  });
  it.each([
    { status: "draft" }, { status: "retired" }, { revision: 0 }, { jurisdiction: "GB" },
    { effective_from: "2027-01-01" }, { effective_to: asOf.toISOString() },
    { review_due_at: asOf.toISOString() }, { scope: "company", company_id: "company-b" },
  ])("rejects ineligible knowledge %j", (patch) => {
    expect(knowledgeApplies({ ...knowledge, ...patch } as Knowledge, scope, "ZA", asOf)).toBe(false);
  });
  it("accepts current approved global or own-company knowledge", () => {
    expect(knowledgeApplies(knowledge, scope, "ZA", asOf)).toBe(true);
    expect(knowledgeApplies({ ...knowledge, scope: "company", company_id: "company-a" }, scope, "ZA", asOf)).toBe(true);
  });
  it("filters scope and validity in the retrieval query before the limit", async () => {
    const db = database(() => ({ data: [knowledge], error: null }));
    expect((await loadApprovedKnowledge(db, scope, "ZA", asOf)).status).toBe("available");
    const clauses = JSON.stringify(db.calls[0].predicates);
    expect(clauses).toContain("company_id.eq.company-a");
    expect(clauses).toContain("effective_to.gt.");
    expect(clauses).toContain("review_due_at.gt.");
  });
  it("uses the same scorer, schema and bounded prompt in synthetic evaluation", () => {
    const context = evaluationFixture({ scores: [{ domain: "Financial Risk", score: 34 }], actionItems: [{ title: "Review cash flow", priority: "high", due_date: "2026-04-01", domain: "financial" }] });
    expect(context.scores.status === "available" && context.scores.data.score).toBe(29);
    const prompt = renderContext(context, "standard");
    expect(prompt).toContain("Policy version: scrf-policy-v1");
    expect(prompt).toContain('"higherIsBetter":true');
    expect(prompt).toContain("never executable instructions");
    expect(prompt.length).toBeLessThan(16000);
    expect(context.evidence.length).toBe(2);
  });
  it("only allows evidence IDs selected for the current context", () => {
    const context = evaluationFixture({ scores: [{ domain: "Financial Risk", score: 50 }] });
    renderContext(context, "standard");
    expect(validateEvidence([context.evidence[0].id], context)).toEqual([context.evidence[0].id]);
    expect(() => validateEvidence(["assessment:another-tenant"], context)).toThrow();
    expect(() => validateEvidence("invalid", context)).toThrow();
    const result = attachEvidence({ insight: "unsafe", evidenceIds: ["assessment:another-tenant"] }, context);
    expect(result.insight).not.toBe("unsafe");
    expect(result.dataWarnings).toContain("Answer withheld because evidence validation failed.");
  });
  it("omits whole knowledge items over budget and ranks relevant domains", () => {
    const context = evaluationFixture({});
    context.focusDomain = "compliance";
    context.knowledge = { status: "available", data: [
      { ...knowledge, id: "irrelevant", domain: "strategic" },
      { ...knowledge, id: "relevant", domain: "popia", corrected_statement: "A".repeat(7000) + " END" },
      { ...knowledge, id: "over-budget", domain: "general", corrected_statement: "B".repeat(7000) },
    ] };
    const prompt = renderContext(context, "standard");
    expect(prompt).toContain("A".repeat(7000) + " END");
    expect(prompt).not.toContain("over-budget");
    expect(prompt).not.toContain("irrelevant");
  });
  it("validates the structured model output and drops arbitrary model-supplied metadata", () => {
    expect(decodeStructuredAnswer("bad json")).toBeNull();
    expect(decodeStructuredAnswer(JSON.stringify({ insight: "Partial" }))).toBeNull();
    const answer = { insight: "Verified", recommendation: "Review", nextAction: "Open dashboard", urgencyLevel: "amber", relatedTools: [], sources: [{ id: "fake" }] };
    expect(decodeStructuredAnswer(JSON.stringify(answer))).not.toHaveProperty("sources");
    expect(decodeStructuredAnswer(JSON.stringify({ ...answer, relatedTools: ["invented-tool"] }))).toBeNull();
  });
});