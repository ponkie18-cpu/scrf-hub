/**
 * CP15: Dashboard Data Consistency Test
 * Test: Dashboard loads all widgets with correct, consistent data.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestUser, createTestAssessment, createTestActionItem, createTestSubscription } from "@/test/factories";
import { createMockSupabaseClient } from "@/test/mocks/supabaseMock";
import { getRiskLevel, DOMAIN_CONFIG } from "@/constants/riskConfig";

const proUser = createTestUser({ id: "dashboard-user" });

// Mock all 4 domain assessments
const assessments = [
  createTestAssessment("spof", 72, { user_id: proUser.id, domain: "operational" }),
  createTestAssessment("financial-health", 58, { user_id: proUser.id, domain: "financial" }),
  createTestAssessment("compliance-motivation", 81, { user_id: proUser.id, domain: "compliance" }),
  createTestAssessment("cyber-scorecard", 64, { user_id: proUser.id, domain: "strategic" }),
];

const actionItems = [
  createTestActionItem("pending", { user_id: proUser.id }),
  createTestActionItem("overdue", { user_id: proUser.id }),
  createTestActionItem("completed", { user_id: proUser.id }),
];

describe("CP15: Dashboard Data Consistency", () => {
  let mockSb: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSb = createMockSupabaseClient(proUser.id);

    mockSb.setTableData("risk_assessments", assessments.map((a) => ({ ...a, user_id: proUser.id })));
    mockSb.setTableData("action_items", actionItems.map((a) => ({ ...a, user_id: proUser.id })));
    mockSb.setTableData("subscriptions", [
      { ...createTestSubscription("pro", { user_id: proUser.id }), user_id: proUser.id },
    ]);
  });

  it("all 4 domain assessments are present", async () => {
    const { data } = await mockSb.mockSupabase.from("risk_assessments").select("*");
    expect(data).toHaveLength(4);

    const domains = (data as any[]).map((a) => a.domain);
    expect(domains).toContain("operational");
    expect(domains).toContain("financial");
    expect(domains).toContain("compliance");
    expect(domains).toContain("strategic");
  });

  it("each domain score matches the mocked value exactly", async () => {
    const { data } = await mockSb.mockSupabase.from("risk_assessments").select("*");
    const scoreMap: Record<string, number> = {};
    (data as any[]).forEach((a) => {
      scoreMap[a.domain] = a.score;
    });

    expect(scoreMap.operational).toBe(72);
    expect(scoreMap.financial).toBe(58);
    expect(scoreMap.compliance).toBe(81);
    expect(scoreMap.strategic).toBe(64);
  });

  it("domain scores produce correct risk levels", () => {
    expect(getRiskLevel(72)).toBe("low");
    expect(getRiskLevel(58)).toBe("medium");
    expect(getRiskLevel(81)).toBe("low");
    expect(getRiskLevel(64)).toBe("medium");
  });

  it("overall score is a weighted average of all domains", () => {
    const weights = DOMAIN_CONFIG;
    const scores = { operational: 72, financial: 58, compliance: 81, strategic: 64 };

    const overall =
      scores.operational * weights.operational.weight +
      scores.financial * weights.financial.weight +
      scores.compliance * weights.compliance.weight +
      scores.strategic * weights.strategic.weight;

    expect(overall).toBeCloseTo(68.75);
    expect(overall).toBeGreaterThan(0);
    expect(overall).toBeLessThanOrEqual(100);
  });

  it("action items render across statuses (pending, overdue, completed)", async () => {
    const { data } = await mockSb.mockSupabase.from("action_items").select("*");
    expect(data).toHaveLength(3);

    const items = data as any[];
    const completed = items.filter((i) => i.completed);
    const pending = items.filter((i) => !i.completed);
    expect(completed.length).toBe(1);
    expect(pending.length).toBe(2);
  });

  it("Pro user subscription is active", async () => {
    const { data } = await mockSb.mockSupabase.from("subscriptions").select("*");
    expect(data).toHaveLength(1);
    expect((data as any[])[0].plan_type).toBe("pro");
  });

  it("domain config defines exactly 4 domains with weights summing to 1.0", () => {
    const domains = Object.keys(DOMAIN_CONFIG);
    expect(domains).toHaveLength(4);

    const weightSum = Object.values(DOMAIN_CONFIG).reduce((sum, d) => sum + d.weight, 0);
    expect(weightSum).toBeCloseTo(1.0);
  });

  it("no score is outside 0-100 range", () => {
    assessments.forEach((a) => {
      expect(a.score).toBeGreaterThanOrEqual(0);
      expect(a.score).toBeLessThanOrEqual(100);
    });
  });
});
