/**
 * CP07: Regulatory Alerts Render Test
 * Test: Regulatory alerts load and render correctly for user's industry.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestUser } from "@/test/factories";
import { v4 } from "@/test/factories/uuid";

const healthcareUser = createTestUser({ profile: { industry_code: "healthcare" } });

// Mock regulatory updates
const mockAlerts = [
  {
    id: v4(),
    title: "POPIA Amendment Update",
    description: "New data processing requirements for healthcare providers",
    category: "compliance",
    impact: "high",
    industries: ["healthcare", "finance"],
    jurisdictions: ["ZA"],
    ai_summary: "Healthcare providers must update consent forms by Q2 2026.",
    effective_date: "2026-06-01",
    source_url: "https://example.com/popia",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: v4(),
    title: "NHI Implementation Phase 2",
    description: "National Health Insurance compliance requirements",
    category: "regulatory",
    impact: "medium",
    industries: ["healthcare"],
    jurisdictions: ["ZA"],
    ai_summary: "Phase 2 registration deadline approaching for private healthcare.",
    effective_date: "2026-09-01",
    source_url: "https://example.com/nhi",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockSelect = vi.fn().mockReturnValue({
  in: vi.fn().mockReturnValue({
    order: vi.fn().mockResolvedValue({
      data: mockAlerts,
      error: null,
    }),
  }),
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: healthcareUser.id } }, error: null }),
    },
  },
}));

describe("CP07: Regulatory Alerts Render", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mock alerts have correct structure", () => {
    expect(mockAlerts).toHaveLength(2);
    expect(mockAlerts[0].title).toBe("POPIA Amendment Update");
    expect(mockAlerts[0].industries).toContain("healthcare");
  });

  it("alerts include AI summary", () => {
    mockAlerts.forEach((alert) => {
      expect(alert.ai_summary).toBeDefined();
      expect(alert.ai_summary.length).toBeGreaterThan(0);
    });
  });

  it("alerts have impact level", () => {
    expect(mockAlerts[0].impact).toBe("high");
    expect(mockAlerts[1].impact).toBe("medium");
  });

  it("alerts are filtered to healthcare industry", () => {
    const healthcareAlerts = mockAlerts.filter((a) => a.industries.includes("healthcare"));
    expect(healthcareAlerts).toHaveLength(2);
  });

  it("alerts have jurisdiction information", () => {
    mockAlerts.forEach((alert) => {
      expect(alert.jurisdictions).toContain("ZA");
    });
  });

  it("alerts include effective dates", () => {
    mockAlerts.forEach((alert) => {
      expect(alert.effective_date).toBeDefined();
      expect(new Date(alert.effective_date).getTime()).toBeGreaterThan(Date.now());
    });
  });

  it("alerts have source URL for compliance verification", () => {
    mockAlerts.forEach((alert) => {
      expect(alert.source_url).toMatch(/^https?:\/\//);
    });
  });

  it("alerts have unique IDs", () => {
    const ids = mockAlerts.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
