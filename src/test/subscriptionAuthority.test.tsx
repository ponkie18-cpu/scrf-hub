import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTierAccess } from "@/hooks/useTierAccess";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), from: vi.fn(), single: vi.fn(), rpc: vi.fn() }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: mocks.auth }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from, rpc: mocks.rpc } }));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockReturnValue({ user: { id: "synthetic-user" }, loading: false });
  const query = { select: () => query, eq: () => query, maybeSingle: mocks.single };
  mocks.from.mockReturnValue(query);
  mocks.single.mockResolvedValue({ data: {
    tier: "free_registered", saves_used: 0, max_saves: 3, trial_started_at: null,
    trial_ends_at: null, subscription_active: false, current_period_end: null,
  }, error: null });
  mocks.rpc.mockResolvedValue({ data: true, error: null });
});
afterEach(cleanup);

describe("subscription frontend honors server authority", () => {
  it("repairs a missing legacy row using an own-account RPC, not a client insert", async () => {
    mocks.single.mockResolvedValue({ data: null, error: null });
    const { result } = renderHook(() => useTierAccess());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mocks.rpc).toHaveBeenCalledWith("ensure_own_subscription");
    expect(result.current.tier).toBe("free_registered");
    expect(result.current.maxSaves).toBe(3);
  });
  it("does not optimistically grant Pro when a trial was not started", async () => {
    const { result } = renderHook(() => useTierAccess());
    await waitFor(() => expect(result.current.loading).toBe(false));
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    let started: boolean | undefined;
    await act(async () => { started = await result.current.startTrial(); });
    expect(started).toBe(false);
    expect(result.current.tier).toBe("free_registered");
  });
  it("reflects a successfully started trial", async () => {
    const { result } = renderHook(() => useTierAccess());
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => { expect(await result.current.startTrial()).toBe(true); });
    expect(result.current.tier).toBe("pro");
  });
  it("does not report a save increment that the server refused", async () => {
    const { result } = renderHook(() => useTierAccess());
    await waitFor(() => expect(result.current.loading).toBe(false));
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    await act(async () => { expect(await result.current.incrementSave()).toBe(false); });
    expect(result.current.savesUsed).toBe(0);
  });
});