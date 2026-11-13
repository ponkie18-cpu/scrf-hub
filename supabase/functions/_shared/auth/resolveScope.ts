import { isRecord, type DatabaseClient, type Scope } from "../context/schemas.ts";

/** userId MUST come from auth.getUser(), never a request-body identity. */
export async function resolveScope(db: DatabaseClient, userId: string) {
  const { data: profile, error } = await db.from("profiles")
    .select("id,company_id,name,top_concerns").eq("id", userId).maybeSingle();
  if (error || !isRecord(profile) || profile.id !== userId ||
    !(profile.company_id === null || typeof profile.company_id === "string")) {
    throw new Error("CONTEXT_SCOPE_UNAVAILABLE");
  }
  // The accompanying migration prevents self-service company/role changes.
  const scope: Scope = {
    userId, companyId: profile.company_id as string | null, assessmentVisibility: "own",
  };
  let company: Record<string, unknown> | null = null;
  if (scope.companyId) {
    const result = await db.from("companies")
      .select("id,name,industry,size,region,country,revenue_band,years_operating")
      .eq("id", scope.companyId).maybeSingle();
    if (result.error || !isRecord(result.data) || result.data.id !== scope.companyId) {
      throw new Error("CONTEXT_COMPANY_UNAVAILABLE");
    }
    company = result.data;
  }
  return { scope, profile, company };
}