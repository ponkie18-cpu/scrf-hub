import type { Context } from "./schemas.ts";

export function validateEvidence(value: unknown, context: Context): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 30 || value.some((id) => typeof id !== "string")) {
    throw new Error("INVALID_EVIDENCE_REFERENCES");
  }
  const allowed = new Set(context.evidence.map((item) => item.id));
  if (value.some((id) => !allowed.has(id))) throw new Error("UNAUTHORISED_EVIDENCE_REFERENCE");
  return [...new Set(value)];
}

export function attachEvidence<T extends { insight: string; evidenceIds?: unknown }>(response: T, context: Context) {
  let evidenceIds: string[];
  const warnings = [...context.warnings];
  try { evidenceIds = validateEvidence(response.evidenceIds, context); }
  catch {
    // Reject the complete answer rather than merely removing a suspect citation.
    return {
      insight: "I could not verify the evidence references for that answer.",
      recommendation: "Review your current assessments and try the question again.",
      urgencyLevel: "amber", relatedTools: [], nextAction: "Open your risk dashboard.",
      evidenceIds: [], sources: [], contextVersion: context.schemaVersion,
      dataWarnings: [...warnings, "Answer withheld because evidence validation failed."],
    };
  }
  if (!evidenceIds.length) warnings.push("No source references were returned; this answer has no verified citations.");
  return {
    ...response, evidenceIds, contextVersion: context.schemaVersion, dataWarnings: warnings,
    sources: context.evidence.filter((item) => evidenceIds.includes(item.id)).map((item) => ({
      id: item.id, kind: item.kind, observedAt: item.observedAt, revision: item.revision,
    })),
  };
}