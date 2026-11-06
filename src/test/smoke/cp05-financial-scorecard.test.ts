/**
 * CP05: Financial Scorecard Test
 * Test: Financial Health Scorecard saves result and calculates score.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateScoreFromAnswers } from "@/services/assessmentService";
import { getRiskLevel, RISK_THRESHOLDS } from "@/constants/riskConfig";

describe("CP05: Financial Health Scorecard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates financial health score from answers", () => {
    const answers = {
      cashReserves: "good",
      debtToEquity: "medium",
      profitMargin: "fair",
      accountsReceivable: "poor",
      taxCompliance: true,
    };

    const score = calculateScoreFromAnswers(answers);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("maps score to correct risk level", () => {
    // Financial scores and their expected risk levels
    expect(getRiskLevel(25)).toBe("critical");
    expect(getRiskLevel(45)).toBe("high");
    expect(getRiskLevel(65)).toBe("medium");
    expect(getRiskLevel(80)).toBe("low");
  });

  it("handles all financial assessment answer types", () => {
    // Boolean answers
    const boolScore = calculateScoreFromAnswers({ hasEmergencyFund: true });
    expect(boolScore).toBe(80);

    // String scale answers
    const stringScore = calculateScoreFromAnswers({ cashPosition: "excellent" });
    expect(stringScore).toBe(100);

    // Numeric answers
    const numericScore = calculateScoreFromAnswers({ customScore: 75 });
    expect(numericScore).toBe(75);
  });

  it("applies weights to financial categories", () => {
    const answers = {
      liquidityRatio: true, // 80
      profitability: false, // 20
    };
    const weights = {
      liquidityRatio: 2, // More important
      profitability: 1,
    };

    const score = calculateScoreFromAnswers(answers, weights);
    // (80 * 2 + 20 * 1) / 3 = 180 / 3 = 60
    expect(score).toBe(60);
  });

  it("uses correct threshold for medium risk", () => {
    expect(RISK_THRESHOLDS.MEDIUM).toBe(70);
    expect(getRiskLevel(70)).toBe("low");
    expect(getRiskLevel(69)).toBe("medium");
  });

  it("handles empty answers gracefully", () => {
    const score = calculateScoreFromAnswers({});
    expect(score).toBe(50); // Default neutral score
  });

  it("clamps extreme numeric values", () => {
    expect(calculateScoreFromAnswers({ overScore: 150 })).toBe(100);
    expect(calculateScoreFromAnswers({ underScore: -20 })).toBe(0);
  });

  it("recognizes frequency-based answers", () => {
    expect(calculateScoreFromAnswers({ reviewFrequency: "always" })).toBe(100);
    expect(calculateScoreFromAnswers({ reviewFrequency: "often" })).toBe(75);
    expect(calculateScoreFromAnswers({ reviewFrequency: "sometimes" })).toBe(50);
    expect(calculateScoreFromAnswers({ reviewFrequency: "rarely" })).toBe(25);
    expect(calculateScoreFromAnswers({ reviewFrequency: "never" })).toBe(10);
  });
});
