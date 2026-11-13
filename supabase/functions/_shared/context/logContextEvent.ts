import { POLICY_VERSION } from "../policy/agentPolicy.ts";
import { SCORING_VERSION } from "../scoring/calculateScores.ts";
import { selectRelevantContext } from "./renderContext.ts";
import type { Context, DatabaseClient } from "./schemas.ts";

/** Best-effort metadata only. Never persist business text or raw prompts here. */
export async function logContextEvent(db: DatabaseClient, context: Context, latencyMs: number, semanticPrompt = true) {
  context.evidence = selectRelevantContext(context).evidence;
  const requestId = crypto.randomUUID();
  try {
    const { error } = await db.from("agent_context_events").insert({
      request_id: requestId, user_id: context.scope.userId,
      company_id: context.scope.companyId, context_schema_version: context.schemaVersion,
      policy_version: semanticPrompt ? POLICY_VERSION : "legacy-inline", scoring_version: SCORING_VERSION,
      prompt_version: semanticPrompt ? "semantic-v1" : "legacy",
      configuration_hash: context.configurationHash,
      selected_evidence_refs: context.evidence,
      source_statuses: Object.fromEntries(["assessments", "actions", "alerts", "knowledge", "scores", "conversation"].map(
        (key) => [key, (context[key as keyof Context] as { status: string }).status],
      )),
      domain_coverage: context.scores.status === "available" ? context.scores.data.coverage : null,
      fetch_latency_ms: latencyMs,
    });
    if (error) console.warn("Context metadata logging unavailable");
  } catch { console.warn("Context metadata logging unavailable"); }
  return requestId;
}

/** Store categorical validation outcomes only, not excerpts or score values. */
export async function logContextValidation(db: DatabaseClient, requestId: string | null, flags: string[]) {
  if (requestId === null) return;
  const allowed = new Set(["HALLUCINATION", "SCOPE_VIOLATION", "LENGTH_WARNING", "GENERIC_RESPONSE",
    "EVIDENCE_INVALID", "EVIDENCE_MISSING", "VALIDATED"]);
  try {
    const { error } = await db.from("agent_context_events")
      .update({ validation_flags: [...new Set(flags.filter((flag) => allowed.has(flag)))] })
      .eq("request_id", requestId);
    if (error) console.warn("Context validation metadata unavailable");
  } catch { console.warn("Context validation metadata unavailable"); }
}