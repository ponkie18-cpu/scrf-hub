import { describe, it, expect } from "vitest";
import { getRiskLevel, RISK_THRESHOLDS } from "@/constants/riskConfig";
import { calculateScoreFromAnswers } from "@/services/assessmentService";

describe("getRiskLevel", () => {
  it("returns 'critical' for scores below CRITICAL threshold", () => {
    expect(getRiskLevel(0)).toBe("critical");
    expect(getRiskLevel(29)).toBe("critical");
  });

  it("returns 'high' for scores between CRITICAL and HIGH thresholds", () => {
    expect(getRiskLevel(30)).toBe("high");
    expect(getRiskLevel(49)).toBe("high");
  });

  it("returns 'medium' for scores between HIGH and MEDIUM thresholds", () => {
    expect(getRiskLevel(50)).toBe("medium");
    expect(getRiskLevel(69)).toBe("medium");
  });

  it("returns 'low' for scores at or above MEDIUM threshold", () => {
    expect(getRiskLevel(70)).toBe("low");
    expect(getRiskLevel(100)).toBe("low");
  });

  it("uses correct threshold values", () => {
    expect(RISK_THRESHOLDS.CRITICAL).toBe(30);
    expect(RISK_THRESHOLDS.HIGH).toBe(50);
    expect(RISK_THRESHOLDS.MEDIUM).toBe(70);
  });
});

describe("calculateScoreFromAnswers", () => {
  it("returns 50 for empty answers", () => {
    expect(calculateScoreFromAnswers({})).toBe(50);
  });

  it("scores boolean answers correctly", () => {
    const score = calculateScoreFromAnswers({ q1: true, q2: false });
    expect(score).toBe(50); // (80 + 20) / 2
  });

  it("scores string answers correctly", () => {
    const score = calculateScoreFromAnswers({ q1: "yes", q2: "no" });
    expect(score).toBe(55); // (80 + 30) / 2
  });

  it("scores numeric answers directly", () => {
    const score = calculateScoreFromAnswers({ q1: 100, q2: 0 });
    expect(score).toBe(50); // (100 + 0) / 2
  });

  it("clamps numeric answers to 0-100", () => {
    const score = calculateScoreFromAnswers({ q1: 150 });
    expect(score).toBe(100);
  });

  it("applies weights correctly", () => {
    const score = calculateScoreFromAnswers(
      { q1: true, q2: false },
      { q1: 3, q2: 1 }
    );
    // (80*3 + 20*1) / 4 = 260/4 = 65
    expect(score).toBe(65);
  });

  it("handles unknown string values as 50", () => {
    const score = calculateScoreFromAnswers({ q1: "something_unknown" });
    expect(score).toBe(50);
  });
});
