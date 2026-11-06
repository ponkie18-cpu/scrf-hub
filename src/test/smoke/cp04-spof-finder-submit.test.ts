/**
 * CP04: SPOF Finder Submit Test
 * Test: A completed SPOF Finder assessment saves and generates action items.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockInsert, mockFrom } = vi.hoisted(() => {
  const mockInsert = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { id: "assessment-123" },
        error: null,
      }),
    }),
  });

  const mockFrom = vi.fn((_table: string) => ({
    insert: mockInsert,
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: { tier: "pro", saves_used: 0, max_saves: 999, trial_ends_at: null },
      error: null,
    }),
  }));

  return { mockInsert, mockFrom };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-pro-user" } },
        error: null,
      }),
    },
    from: mockFrom,
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
  },
}));

import { saveAssessmentAndActions, calculateScoreFromAnswers } from "@/services/assessmentService";

describe("CP04: SPOF Finder Submit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates score from SPOF Finder answers", () => {
    const answers = {
      singleOwnerDependency: true,
      backupProcesses: false,
      documentedProcedures: "partial",
      crossTraining: "rarely",
    };
    const score = calculateScoreFromAnswers(answers);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("saveAssessmentAndActions calls Supabase insert", async () => {
    await saveAssessmentAndActions({
      domain: "operational",
      toolId: "spof-finder",
      answers: { q1: true, q2: false },
      score: 65,
      insights: ["Key single point of failure identified"],
      recommendations: [
        { title: "Document backup procedures", priority: "high" },
        { title: "Cross-train team members", priority: "medium" },
      ],
    });

    expect(mockFrom).toHaveBeenCalledWith("risk_assessments");
    expect(mockInsert).toHaveBeenCalled();
  });

  it("creates action items from high/medium priority recommendations", async () => {
    await saveAssessmentAndActions({
      domain: "operational",
      toolId: "spof-finder",
      answers: { q1: true },
      score: 55,
      insights: ["Vulnerability found"],
      recommendations: [
        { title: "Critical action needed", priority: "high" },
        { title: "Secondary improvement", priority: "medium" },
        { title: "Nice to have", priority: "low" },
      ],
    });

    const actionItemsCalls = mockFrom.mock.calls.filter((call: string[]) => call[0] === "action_items");
    expect(actionItemsCalls.length).toBeGreaterThan(0);
  });

  it("returns success with assessmentId", async () => {
    const result = await saveAssessmentAndActions({
      domain: "operational",
      toolId: "spof-finder",
      answers: { q1: true },
      score: 72,
      insights: ["Good resilience baseline"],
      recommendations: [],
    });

    expect(result.success).toBe(true);
    expect(result.assessmentId).toBeDefined();
  });

  it("records score history for trend tracking", async () => {
    await saveAssessmentAndActions({
      domain: "operational",
      toolId: "spof-finder",
      answers: { q1: true },
      score: 68,
      insights: ["Progress made"],
      recommendations: [],
    });

    const scoreHistoryCalls = mockFrom.mock.calls.filter((call: string[]) => call[0] === "score_history");
    expect(scoreHistoryCalls.length).toBeGreaterThan(0);
  });
});
