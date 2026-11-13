import { DOMAINS, DEFAULT_DOMAIN_WEIGHTS, type Assessment, type OpenAction, type ScoringConfig } from "./calculateScores.ts";
import { isRecord, readRows, rows, type DatabaseClient, type Result, type Scope } from "../context/schemas.ts";

function isAssessment(row: unknown): row is Assessment {
  return isRecord(row) && typeof row.id === "string" && DOMAINS.includes(row.domain as typeof DOMAINS[number]) &&
    typeof row.score === "number" && Number.isFinite(row.score) && row.score >= 0 && row.score <= 100 &&
    typeof row.updated_at === "string" && Number.isFinite(Date.parse(row.updated_at)) &&
    (row.assessment_data === null || row.assessment_data === undefined || isRecord(row.assessment_data));
}
function isAction(row: unknown): row is OpenAction {
  return isRecord(row) && typeof row.id === "string" && typeof row.title === "string" &&
    DOMAINS.includes(row.domain as typeof DOMAINS[number]) && ["high", "medium", "low"].includes(String(row.priority)) &&
    (row.due_date === null || (typeof row.due_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(row.due_date)));
}

export async function loadAssessments(db: DatabaseClient, scope: Scope): Promise<Result<Assessment[]>> {
  // One query per domain avoids a busy domain starving another out of a top-N window.
  const results = await Promise.all(DOMAINS.map((domain) => readRows(
    db.from("risk_assessments").select("id,domain,score,updated_at,tool_id,assessment_data")
      .eq("user_id", scope.userId).eq("domain", domain)
      .order("updated_at", { ascending: false }).order("id", { ascending: false }).limit(1),
    isAssessment,
  )));
  if (results.some((r) => r.status === "unavailable")) return { status: "unavailable", errorCode: "ASSESSMENTS_UNAVAILABLE" };
  const data = results.flatMap(rows);
  return data.length ? { status: "available", data } : { status: "missing" };
}

export async function loadActions(db: DatabaseClient, scope: Scope): Promise<Result<OpenAction[]>> {
  const data: OpenAction[] = [];
  const pageSize = 500;
  for (let offset = 0; offset < 10_000; offset += pageSize) {
    const page = await readRows(db.from("action_items")
      .select("id,domain,priority,title,due_date,description").eq("user_id", scope.userId)
      .eq("completed", false).order("id", { ascending: true }).range(offset, offset + pageSize - 1), isAction);
    if (page.status === "unavailable") return page;
    const batch = rows(page);
    data.push(...batch);
    if (batch.length < pageSize) return data.length ? { status: "available", data } : { status: "missing" };
  }
  return { status: "unavailable", errorCode: "ACTION_LIMIT_EXCEEDED" };
}

export async function loadScoringConfig(db: DatabaseClient, scope: Scope): Promise<Result<ScoringConfig>> {
  if (!scope.companyId) return { status: "available", data: { domain_weights: DEFAULT_DOMAIN_WEIGHTS } };
  try {
    const { data, error } = await db.from("scoring_config").select("domain_weights")
      .eq("company_id", scope.companyId).maybeSingle();
    if (error) return { status: "unavailable", errorCode: "SCORING_CONFIG_UNAVAILABLE" };
    if (data === null) return { status: "available", data: { domain_weights: DEFAULT_DOMAIN_WEIGHTS } };
    if (!isRecord(data) || !isRecord(data.domain_weights) ||
      !Object.entries(data.domain_weights).every(([domain, weight]) => DOMAINS.includes(domain as typeof DOMAINS[number]) &&
        typeof weight === "number" && Number.isFinite(weight) && weight >= 0) ||
      !Object.values(data.domain_weights).some((weight) => typeof weight === "number" && weight > 0)) {
      return { status: "unavailable", errorCode: "INVALID_SCORING_CONFIG" };
    }
    return { status: "available", data: data as unknown as ScoringConfig };
  } catch { return { status: "unavailable", errorCode: "SCORING_CONFIG_UNAVAILABLE" }; }
}