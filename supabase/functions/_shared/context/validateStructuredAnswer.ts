import { isRecord } from "./schemas.ts";

export const TOOL_IDS = new Set([
  "spof", "process-doc", "bia", "financial-health", "cashflow-stress", "compliance-motivation",
  "contract-checker", "regulatory-tracker", "data-protection", "cyber-scorecard", "horizon-scanner",
  "incident-playbook", "risk-heatmap", "risk-register", "bcp-builder", "vendor-assessment",
]);

/** Model output is untrusted: project only the public contract, never arbitrary fields. */
export function validateStructuredAnswer(value: unknown) {
  if (!isRecord(value) ||
    !["insight", "recommendation", "nextAction"].every((key) => typeof value[key] === "string" &&
      (value[key] as string).length > 0 && (value[key] as string).length <= 8000) ||
    !["red", "amber", "green"].includes(String(value.urgencyLevel)) ||
    !Array.isArray(value.relatedTools) || value.relatedTools.length > 16 ||
    !value.relatedTools.every((id) => typeof id === "string" && TOOL_IDS.has(id))) {
    throw new Error("INVALID_STRUCTURED_ANSWER");
  }
  return {
    insight: value.insight as string, recommendation: value.recommendation as string,
    nextAction: value.nextAction as string, urgencyLevel: value.urgencyLevel as "red" | "amber" | "green",
    relatedTools: value.relatedTools as string[], evidenceIds: value.evidenceIds,
  };
}

export function decodeStructuredAnswer(json: string) {
  try { return validateStructuredAnswer(JSON.parse(json)); }
  catch { return null; }
}