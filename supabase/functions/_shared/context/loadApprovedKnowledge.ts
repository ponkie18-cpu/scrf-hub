import { isRecord, readRows, rows, type DatabaseClient, type Knowledge, type Scope, type Result } from "./schemas.ts";

export function jurisdictionFor(country: unknown): string {
  if (typeof country !== "string") return "unknown";
  const value = country.trim().toLowerCase();
  if (["za", "south africa", "rsa"].includes(value)) return "ZA";
  if (["gb", "uk", "united kingdom"].includes(value)) return "GB";
  return /^[a-z]{2}$/.test(value) ? value.toUpperCase() : "unknown";
}

export function knowledgeApplies(row: Knowledge, scope: Scope, jurisdiction: string, asOf: Date): boolean {
  const now = asOf.getTime();
  return row.status === "approved" && Number.isInteger(row.revision) && row.revision > 0 &&
    ((row.scope === "global" && row.company_id === null) ||
      (row.scope === "company" && scope.companyId !== null && row.company_id === scope.companyId)) &&
    (row.jurisdiction === "*" || row.jurisdiction === jurisdiction) &&
    Number.isFinite(Date.parse(row.effective_from)) && Date.parse(row.effective_from) <= now &&
    (row.effective_to === null || Date.parse(row.effective_to) > now) &&
    (row.review_due_at === null || Date.parse(row.review_due_at) > now);
}

export async function loadApprovedKnowledge(
  db: DatabaseClient, scope: Scope, jurisdiction: string, asOf: Date,
) {
  let query = db.from("agent_knowledge_base")
    .select("id,domain,corrected_statement,supporting_reference,revision,scope,company_id,jurisdiction,status,effective_from,effective_to,review_due_at")
    .eq("status", "approved").in("jurisdiction", [jurisdiction, "*"])
    .lte("effective_from", asOf.toISOString())
    .order("effective_from", { ascending: false }).order("id", { ascending: false }).limit(100);
  // Filter expiry before LIMIT so expired revisions cannot starve current guidance.
  const valid = `or(effective_to.is.null,effective_to.gt.${asOf.toISOString()}),or(review_due_at.is.null,review_due_at.gt.${asOf.toISOString()})`;
  const branches = [`and(scope.eq.global,company_id.is.null,${valid})`];
  if (scope.companyId) branches.push(`and(scope.eq.company,company_id.eq.${scope.companyId},${valid})`);
  query = query.or(branches.join(","));
  const result = await readRows(query, (value): value is Knowledge => {
    if (!isRecord(value) || typeof value.id !== "string" || typeof value.corrected_statement !== "string" ||
      value.corrected_statement.length > 8000 || typeof value.domain !== "string" ||
      !(value.supporting_reference === null || typeof value.supporting_reference === "string")) return false;
    return typeof value.effective_from === "string" &&
      (value.effective_to === null || typeof value.effective_to === "string") &&
      (value.review_due_at === null || typeof value.review_due_at === "string") &&
      typeof value.revision === "number" && typeof value.jurisdiction === "string";
  });
  if (result.status === "unavailable") return result;
  const data = rows(result).filter((row) => knowledgeApplies(row, scope, jurisdiction, asOf));
  return (data.length ? { status: "available", data } : { status: "missing" }) as Result<Knowledge[]>;
}