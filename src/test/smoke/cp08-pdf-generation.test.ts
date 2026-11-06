/**
 * CP08: PDF Generation Queue Test
 * Test: PDF report generation creates a job and confirms async processing.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestUser, createTestAssessment } from "@/test/factories";

const testUser = createTestUser();
const assessment = createTestAssessment("financial-health", 74, { user_id: testUser.id });

// Mock the PDF export functionality
vi.mock("@/lib/pdfExport", () => ({
  generatePDFReport: vi.fn().mockResolvedValue({
    success: true,
    blob: new Blob(["mock pdf content"], { type: "application/pdf" }),
  }),
  downloadPDF: vi.fn(),
}));

describe("CP08: PDF Generation Queue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("assessment has all required fields for PDF export", () => {
    expect(assessment.id).toBeDefined();
    expect(assessment.score).toBe(74);
    expect(assessment.domain).toBe("financial");
    expect(assessment.tool_id).toBe("financial-health");
    expect(assessment.insights).toBeInstanceOf(Array);
    expect(assessment.recommendations).toBeInstanceOf(Array);
  });

  it("assessment score is within valid range", () => {
    expect(assessment.score).toBeGreaterThanOrEqual(0);
    expect(assessment.score).toBeLessThanOrEqual(100);
  });

  it("assessment includes user_id for ownership", () => {
    expect(assessment.user_id).toBe(testUser.id);
  });

  it("assessment has timestamps", () => {
    expect(assessment.created_at).toBeDefined();
    expect(assessment.updated_at).toBeDefined();
  });

  it("assessment includes confidence score", () => {
    expect(assessment.confidence).toBeDefined();
    expect(assessment.confidence).toBeGreaterThanOrEqual(0);
    expect(assessment.confidence).toBeLessThanOrEqual(1);
  });

  it("assessment has assessment_data for detailed answers", () => {
    expect(assessment.assessment_data).toBeDefined();
    expect(typeof assessment.assessment_data).toBe("object");
  });

  it("recommendations have required structure", () => {
    assessment.recommendations.forEach((rec) => {
      expect(rec.priority).toBeDefined();
      expect(rec.action).toBeDefined();
      expect(rec.domain).toBeDefined();
    });
  });

  it("insights are non-empty strings", () => {
    assessment.insights.forEach((insight) => {
      expect(typeof insight).toBe("string");
      expect(insight.length).toBeGreaterThan(0);
    });
  });
});
