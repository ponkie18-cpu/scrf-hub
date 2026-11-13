import type { Assessment, OpenAction, ScoringConfig } from "../scoring/calculateScores.ts";
import type { calculateScores } from "../scoring/calculateScores.ts";

// Supabase's fluent query builder is kept at this single external boundary.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface DatabaseClient { from(table: string): any }
export type Result<T> =
  | { status: "available"; data: T }
  | { status: "missing" }
  | { status: "unavailable"; errorCode: string };
export interface Scope { userId: string; companyId: string | null; assessmentVisibility: "own" }
export interface Knowledge {
  id: string; domain: string; corrected_statement: string; supporting_reference: string | null;
  revision: number; scope: "global" | "company"; company_id: string | null;
  jurisdiction: string; status: string; effective_from: string;
  effective_to: string | null; review_due_at: string | null;
}
export interface Evidence {
  id: string; kind: "assessment" | "action" | "alert" | "knowledge";
  recordId: string; observedAt: string; revision?: number;
}
export interface Alert {
  id: string; title: string; domain: string | null; priority: string | null;
  message: string | null; created_at: string; company_id: string | null;
}
export interface Context {
  schemaVersion: "1";
  generatedAt: string;
  /** Optional untrusted topic hint; never used for identity or authorisation. */
  focusDomain?: string;
  scope: Scope;
  profile: Record<string, unknown>;
  company: Record<string, unknown> | null;
  assessments: Result<Assessment[]>;
  actions: Result<OpenAction[]>;
  alerts: Result<Alert[]>;
  knowledge: Result<Knowledge[]>;
  conversation: Result<{ role: "user" | "assistant"; content: string; created_at: string }[]>;
  scoringConfig: Result<ScoringConfig>;
  scores: Result<ReturnType<typeof calculateScores>>;
  configurationHash: string;
  evidence: Evidence[];
  warnings: string[];
}
export function rows<T>(result: Result<T[]>): T[] {
  return result.status === "available" ? result.data : [];
}
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Fail closed on query failure OR invalid database output. Never leak raw errors. */
export async function readRows<T>(
  query: PromiseLike<{ data: unknown; error: unknown }>,
  validate: (row: unknown) => row is T,
): Promise<Result<T[]>> {
  try {
    const { data, error } = await query;
    if (error) return { status: "unavailable", errorCode: "QUERY_FAILED" };
    if (!Array.isArray(data) || !data.every(validate)) {
      return { status: "unavailable", errorCode: "INVALID_SOURCE_DATA" };
    }
    return data.length ? { status: "available", data } : { status: "missing" };
  } catch {
    return { status: "unavailable", errorCode: "QUERY_FAILED" };
  }
}