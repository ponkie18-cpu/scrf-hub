/**
 * CP14: Cross-User Isolation Test
 * Test: User A's data is never returned when User B makes queries.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestUser, createTestAssessment, createTestActionItem, createTestAgentConversation } from "@/test/factories";
import { createMockSupabaseClient } from "@/test/mocks/supabaseMock";

const userA = createTestUser({ id: "user-a-pro" });
const userB = createTestUser({ id: "user-b-free" });

// User A's data
const userAAssessment = createTestAssessment("spof", 72, { user_id: userA.id, id: "assess-a" });
const userAAction = createTestActionItem("pending", { user_id: userA.id, id: "action-a" });
const userAConversation = createTestAgentConversation(2, { user_id: userA.id });

describe("CP14: Cross-User Isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("User B sees no assessment data from User A", async () => {
    const { mockSupabase, setTableData } = createMockSupabaseClient(userB.id);

    setTableData("risk_assessments", [
      { ...userAAssessment, user_id: userA.id },
    ]);

    const { data } = await mockSupabase.from("risk_assessments").select("*");
    expect(data).toHaveLength(0);
  });

  it("User B sees no action items from User A", async () => {
    const { mockSupabase, setTableData } = createMockSupabaseClient(userB.id);

    setTableData("action_items", [
      { ...userAAction, user_id: userA.id },
    ]);

    const { data } = await mockSupabase.from("action_items").select("*");
    expect(data).toHaveLength(0);
  });

  it("User B sees no agent conversations from User A", async () => {
    const { mockSupabase, setTableData } = createMockSupabaseClient(userB.id);

    setTableData("agent_conversations", userAConversation.map((m) => ({ ...m, user_id: userA.id })));

    const { data } = await mockSupabase.from("agent_conversations").select("*");
    expect(data).toHaveLength(0);
  });

  it("User A sees their own assessment data", async () => {
    const { mockSupabase, setTableData } = createMockSupabaseClient(userA.id);

    setTableData("risk_assessments", [
      { ...userAAssessment, user_id: userA.id },
    ]);

    const { data } = await mockSupabase.from("risk_assessments").select("*");
    expect(data).toHaveLength(1);
    expect((data as any[])[0].user_id).toBe(userA.id);
  });

  it("User A sees their own action items", async () => {
    const { mockSupabase, setTableData } = createMockSupabaseClient(userA.id);

    setTableData("action_items", [
      { ...userAAction, user_id: userA.id },
    ]);

    const { data } = await mockSupabase.from("action_items").select("*");
    expect(data).toHaveLength(1);
  });

  it("User A sees their own conversations", async () => {
    const { mockSupabase, setTableData } = createMockSupabaseClient(userA.id);

    setTableData("agent_conversations", userAConversation.map((m) => ({ ...m, user_id: userA.id })));

    const { data } = await mockSupabase.from("agent_conversations").select("*");
    expect(data).toHaveLength(2);
  });

  it("mixed user data is correctly filtered", async () => {
    const userBAction = createTestActionItem("pending", { user_id: userB.id, id: "action-b" });

    // Query as User B — should only see User B's data
    const { mockSupabase, setTableData } = createMockSupabaseClient(userB.id);
    setTableData("action_items", [
      { ...userAAction, user_id: userA.id },
      { ...userBAction, user_id: userB.id },
    ]);

    const { data } = await mockSupabase.from("action_items").select("*");
    expect(data).toHaveLength(1);
    expect((data as any[])[0].user_id).toBe(userB.id);
  });
});
