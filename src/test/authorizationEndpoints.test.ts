// @vitest-environment node
import { describe, expect, it } from "vitest";
import ts from "typescript";
import vm from "node:vm";
import { readFile } from "node:fs/promises";
import { webcrypto } from "node:crypto";
import { attachEvidence } from "../../supabase/functions/_shared/context/validateEvidence";
import { decodeStructuredAnswer } from "../../supabase/functions/_shared/context/validateStructuredAnswer";
import * as responseHelpers from "../../supabase/functions/_shared/response";

const user = { id: "00000000-0000-0000-0000-000000000001", email: "synthetic@example.test" };
const sessionId = "00000000-0000-0000-0000-000000000002";
const types = [undefined, "standard", "conversation", "briefing", "spof_mitigation", "cashflow_recommendations",
  "financial_health_analysis", "game_theory_nash", "market_entry", "prisoner_dilemma", "pre_mortem", "resilience_audit"];
type Options = { pro?: boolean; admin?: unknown; roleError?: boolean; invalidAuth?: boolean; quotaData?: unknown; quotaError?: boolean };

// Execute the ACTUAL handler body in an isolated JS context. Only imports are
// replaced: HTTP server, Supabase, and context loading are controlled test seams.
// fetch is always a local fixture, so no model calls, credentials, or hosted writes
// can occur. Pure response/evidence validation uses the repository implementations.
async function harness(name: "scrf-agent" | "run-agent-evaluation", options: Options = {}) {
  const tables: string[] = [];
  const rpcs: { name: string; args: unknown }[] = [];
  const inserts: { table: string; value: unknown }[] = [];
  const errors: unknown[][] = [];
  let modelAttempts = 0;
  let handler: (request: Request) => Promise<Response>;
  const client = {
    auth: { getUser: async () => ({ data: { user: options.invalidAuth ? null : user }, error: options.invalidAuth ? "Invalid" : null }) },
    async rpc(name: string, args: unknown) {
      rpcs.push({ name, args });
      if (name === "has_role") return { data: options.admin ?? false, error: options.roleError ? "Unavailable" : null };
      if (name === "reserve_agent_quota") return {
        data: Object.hasOwn(options, "quotaData") ? options.quotaData : [{ allowed: false, remaining: 0 }],
        error: options.quotaError ? "Unavailable" : null,
      };
      throw new Error(`Unexpected RPC: ${name}`);
    },
    from(table: string) {
      tables.push(table);
      const result = { data: table === "user_subscriptions" ? { tier: options.pro ? "pro" : "free_registered", trial_ends_at: null } : [], error: null };
      const q: object = new Proxy({}, { get(_, key) {
        if (key === "then") return (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) => Promise.resolve(result).then(resolve, reject);
        if (key === "insert") return (value: unknown) => { inserts.push({ table, value }); return q; };
        return () => q;
      } });
      return q;
    },
  };
  const context = {
    company: null, profile: {}, domainScores: { financial: null, operational: null, compliance: null, strategic: null },
    overallScore: null, recentAssessments: [], activeActions: [], pendingActions: 0, overdueActions: 0,
    overdueDetails: [], unreadAlerts: [], financialSnapshot: null, conversationMessages: [],
    semanticContext: { schemaVersion: "1", warnings: [], evidence: [],
      assessments: { status: "missing" }, actions: { status: "missing" }, alerts: { status: "missing" },
      scores: { status: "missing" }, conversation: { status: "missing" }, knowledge: { status: "missing" },
    },
  };
  const sandbox = {
    Request, Response, ReadableStream, TextEncoder, TextDecoder, crypto: webcrypto, Date, URL, setTimeout,
    console: { log() {}, warn() {}, error(...args: unknown[]) { errors.push(args.map(String)); } },
    serve: (fn: typeof handler) => { handler = fn; }, createClient: () => client,
    Deno: { env: { get: (key: string) => key.startsWith("SCRF_") ? "false" : "synthetic-not-a-credential" } },
    buildContext: async () => structuredClone(context), toUserContext: (value: unknown) => value,
    renderContext: () => "", logContextEvent: async () => null, logContextValidation: async () => {},
    attachEvidence, decodeStructuredAnswer, evaluationFixture: () => ({}), ...responseHelpers,
    fetch: async () => {
      modelAttempts++;
      return Response.json({ choices: [{ message: { tool_calls: [{ function: { arguments: JSON.stringify({
        insight: "Review your assessments.", recommendation: "Review your current assessments.", urgencyLevel: "green",
        relatedTools: [], nextAction: "Open your dashboard.", evidenceIds: [],
      }) } }] } }] });
    },
  };
  let source = await readFile(`supabase/functions/${name}/index.ts`, "utf8");
  const ast = ts.createSourceFile("handler.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  for (const declaration of ast.statements.filter(ts.isImportDeclaration).reverse()) {
    source = source.slice(0, declaration.getFullStart()) + source.slice(declaration.end);
  }
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
  vm.runInNewContext(code, sandbox);
  return {
    tables, rpcs, inserts, errors, get modelAttempts() { return modelAttempts; },
    run: (body: unknown, authorization: string | null = "Bearer synthetic") => handler(new Request("https://local.invalid", {
      method: "POST", headers: authorization ? { Authorization: authorization } : {}, body: JSON.stringify(body),
    })),
  };
}

describe("evaluation authorization before privileged work", () => {
  it("rejects a missing bearer token", async () => {
    const test = await harness("run-agent-evaluation");
    expect((await test.run({}, null)).status).toBe(401);
    expect(test.tables).toEqual([]);
    expect(test.rpcs).toEqual([]);
  });
  it("rejects an invalid token", async () => {
    const test = await harness("run-agent-evaluation", { invalidAuth: true });
    expect((await test.run({})).status).toBe(401);
    expect(test.rpcs).toEqual([]);
  });
  it.each([false, "true", { role: "admin" }])("rejects non-boolean admin authorization: %j", async (admin) => {
    const test = await harness("run-agent-evaluation", { admin });
    expect((await test.run({ user_id: "forged", role: "admin" })).status).toBe(403);
    expect(test.rpcs).toEqual([{ name: "has_role", args: { _user_id: user.id, _role: "admin" } }]);
    expect(test.tables).toEqual([]);
    expect(test.modelAttempts).toBe(0);
  });
  it("fails closed when the role lookup fails", async () => {
    const test = await harness("run-agent-evaluation", { admin: true, roleError: true });
    expect((await test.run({})).status).toBe(503);
    expect(test.tables).toEqual([]);
    expect(test.modelAttempts).toBe(0);
  });
  it("allows a verified administrator to reach question loading", async () => {
    const test = await harness("run-agent-evaluation", { admin: true });
    expect((await test.run({})).status).toBe(404); // Empty synthetic fixture, not authorization failure.
    expect(test.tables).toEqual(["eval_questions"]);
  });
});

describe("agent request validation and fail-closed quota", () => {
  it.each(["unsupported", "", null, false, 1, {}, []])("rejects unsupported type %j before quota or model work", async (type) => {
    const test = await harness("scrf-agent");
    expect((await test.run({ type, message: "Hello" })).status).toBe(400);
    expect(test.rpcs).toEqual([]);
    expect(test.modelAttempts).toBe(0);
  });
  it.each([null, [], "invalid"])("rejects a non-object request %j", async (body) => {
    const test = await harness("scrf-agent");
    expect((await test.run(body)).status).toBe(400);
    expect(test.rpcs).toEqual([]);
  });
  it.each(types)("enforces quota on supported mode %s", async (type) => {
    const test = await harness("scrf-agent", { pro: true });
    expect((await test.run({ type, message: "Hello", user_id: "forged" })).status).toBe(429);
    expect(test.rpcs).toEqual([{ name: "reserve_agent_quota", args: { _user_id: user.id } }]);
    expect(test.modelAttempts).toBe(0);
    expect(test.tables).not.toContain("agent_conversations");
  });
  it("denies a free-tier Pro mode before model execution", async () => {
    const test = await harness("scrf-agent");
    expect((await test.run({ type: "market_entry" })).status).toBe(403);
    expect(test.modelAttempts).toBe(0);
  });
  it.each([null, [], {}, [{ allowed: true, remaining: -1 }], [{ allowed: "true", remaining: 5 }], [{ allowed: true, remaining: 1.5 }]])("fails closed on malformed quota response %j", async (quotaData) => {
    const test = await harness("scrf-agent", { quotaData });
    expect((await test.run({ message: "Hello" })).status).toBe(503);
    expect(test.modelAttempts).toBe(0);
  });
  it("fails closed on a database reservation error", async () => {
    const test = await harness("scrf-agent", { quotaError: true, quotaData: [{ allowed: true, remaining: 9 }] });
    expect((await test.run({ message: "Hello" })).status).toBe(503);
    expect(test.modelAttempts).toBe(0);
  });
  it("allows standard generation only after a successful reservation", async () => {
    const test = await harness("scrf-agent", { quotaData: [{ allowed: true, remaining: 9 }] });
    expect((await test.run({ type: "standard", message: "Hello" })).status, JSON.stringify(test.errors)).toBe(200);
    expect(test.modelAttempts).toBe(1);
  });
  it.each(["Hello", "Please explain VAT"])("persists both server-verified conversation roles: %s", async (message) => {
    const test = await harness("scrf-agent", { quotaData: [{ allowed: true, remaining: 9 }] });
    const result = await test.run({ type: "conversation", message, sessionId });
    expect(result.status, JSON.stringify(test.errors)).toBe(200);
    await result.text(); // Drain the complete synthetic SSE stream.
    const saved = test.inserts.find((entry) => entry.table === "agent_conversations")?.value;
    expect(saved).toEqual([
      expect.objectContaining({ user_id: user.id, session_id: sessionId, role: "user", server_verified: true }),
      expect.objectContaining({ user_id: user.id, session_id: sessionId, role: "assistant", server_verified: true }),
    ]);
  });
});