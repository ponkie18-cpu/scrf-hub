/**
 * Complete Supabase client mock for SCRF Hub regression tests.
 *
 * Usage:
 *   const { mockSupabase, resetMock } = createMockSupabaseClient(mockUserId);
 *   vi.mock("@/integrations/supabase/client", () => ({ supabase: mockSupabase }));
 */
import { vi } from "vitest";

type Row = Record<string, unknown>;

interface SimulatedError {
  table: string;
  method: string;
  code: string;
}

interface QueryCall {
  table: string;
  method: string;
  args: unknown[];
  timestamp: number;
}

export function createMockSupabaseClient(userId: string) {
  const tables: Record<string, Row[]> = {};
  const simulatedErrors: SimulatedError[] = [];
  const calls: QueryCall[] = [];

  function record(table: string, method: string, args: unknown[]) {
    calls.push({ table, method, args, timestamp: Date.now() });
  }

  function getError(table: string, method: string): { error: { message: string; code: string } } | null {
    const match = simulatedErrors.find((e) => e.table === table && e.method === method);
    if (match) return { error: { message: `Simulated ${match.code}`, code: match.code } };
    return null;
  }

  function setTableData(table: string, rows: Row[]) {
    tables[table] = rows;
  }

  function simulateError(table: string, method: string, code: string) {
    simulatedErrors.push({ table, method, code });
  }

  function clearErrors() {
    simulatedErrors.length = 0;
  }

  /** Builds a chainable query builder that resolves with mock data. */
  function buildQueryChain(table: string, method: string) {
    let rows = [...(tables[table] ?? [])];
    let singleMode = false;
    let maybeSingleMode = false;
    const filters: Array<(r: Row) => boolean> = [];

    const chain: Record<string, (...args: unknown[]) => unknown> = {};

    const resolve = () => {
      const err = getError(table, method);
      if (err) return { data: null, ...err };

      // Apply RLS simulation: filter by user_id if column exists
      let result = rows.filter((r) => {
        if ("user_id" in r && r.user_id !== userId) return false;
        return filters.every((f) => f(r));
      });

      if (singleMode) {
        if (result.length === 0) return { data: null, error: { message: "Row not found", code: "PGRST116" } };
        return { data: result[0], error: null };
      }
      if (maybeSingleMode) {
        return { data: result[0] ?? null, error: null };
      }
      return { data: result, error: null };
    };

    // Make chain thenable so `await supabase.from(...).select(...)` works
    chain.then = (onFulfilled: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
      Promise.resolve(resolve()).then(onFulfilled, onRejected);

    chain.select = (...args: unknown[]) => {
      record(table, "select", args);
      return chain;
    };
    chain.insert = (payload: unknown) => {
      record(table, "insert", [payload]);
      const arr = Array.isArray(payload) ? payload : [payload];
      arr.forEach((item) => {
        if (typeof item === "object" && item !== null) {
          tables[table] = [...(tables[table] ?? []), { ...item, user_id: userId } as Row];
        }
      });
      rows = [...(tables[table] ?? [])];
      return chain;
    };
    chain.update = (payload: unknown) => {
      record(table, "update", [payload]);
      return chain;
    };
    chain.delete = () => {
      record(table, "delete", []);
      return chain;
    };
    chain.upsert = (payload: unknown) => {
      record(table, "upsert", [payload]);
      return chain;
    };
    chain.eq = (col: string, val: unknown) => {
      filters.push((r) => r[col] === val);
      return chain;
    };
    chain.neq = (col: string, val: unknown) => {
      filters.push((r) => r[col] !== val);
      return chain;
    };
    chain.gt = (col: string, val: unknown) => {
      filters.push((r) => (r[col] as number) > (val as number));
      return chain;
    };
    chain.lt = (col: string, val: unknown) => {
      filters.push((r) => (r[col] as number) < (val as number));
      return chain;
    };
    chain.gte = (col: string, val: unknown) => {
      filters.push((r) => (r[col] as number) >= (val as number));
      return chain;
    };
    chain.lte = (col: string, val: unknown) => {
      filters.push((r) => (r[col] as number) <= (val as number));
      return chain;
    };
    chain.in = (col: string, vals: unknown[]) => {
      filters.push((r) => vals.includes(r[col]));
      return chain;
    };
    chain.order = () => chain;
    chain.limit = () => chain;
    chain.range = () => chain;
    chain.single = () => {
      singleMode = true;
      return chain;
    };
    chain.maybeSingle = () => {
      maybeSingleMode = true;
      return chain;
    };

    return chain;
  }

  const fromFn = vi.fn((table: string) => buildQueryChain(table, "select"));

  const mockSupabase = {
    from: fromFn,
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            access_token: "mock-token",
            user: { id: userId, email: `test-${userId.slice(0, 8)}@scrf-hub.test` },
          },
        },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: userId, email: `test-${userId.slice(0, 8)}@scrf-hub.test` } },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: { id: userId } }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  };

  function resetMock() {
    Object.keys(tables).forEach((k) => delete tables[k]);
    simulatedErrors.length = 0;
    calls.length = 0;
    vi.clearAllMocks();
  }

  return {
    mockSupabase,
    setTableData,
    simulateError,
    clearErrors,
    calls,
    resetMock,
  };
}
