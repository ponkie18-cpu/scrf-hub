/**
 * CP03: Pro Gate Enforcement Test
 * Test: A free-tier user cannot access Pro features, but CAN access free features.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { createTestUser, createTestSubscription } from "@/test/factories";
import { UpgradeGate } from "@/components/tier/UpgradeGate";

const freeUser = createTestUser();
const freeSubscription = createTestSubscription("free", { user_id: freeUser.id });

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: freeUser.id, email: freeUser.email },
    session: { access_token: "mock-token" },
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock tier access for free user
vi.mock("@/hooks/useTierAccess", () => ({
  useTierAccess: () => ({
    tier: "free_registered",
    loading: false,
    savesUsed: 1,
    maxSaves: 3,
    canSaveNow: true,
    trialExpired: false,
    startTrial: vi.fn(),
    incrementSave: vi.fn(),
    refetch: vi.fn(),
  }),
  isFreeTool: (toolId: string) => ["spof-finder", "compliance-motivation", "financial-health-scorecard"].includes(toolId),
  canAccessTool: (tier: string, toolId: string) => {
    const freeTools = ["spof-finder", "compliance-motivation", "financial-health-scorecard"];
    return tier === "pro" || freeTools.includes(toolId);
  },
  TOOL_INFO: {
    "game-theory": { name: "Nash Equilibrium Simulator", domain: "strategic", description: "Game theory analysis" },
    "spof-finder": { name: "SPOF Finder", domain: "operational", description: "Find single points of failure" },
  },
  FREE_TOOLS: ["spof-finder", "compliance-motivation", "financial-health-scorecard"],
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null }) },
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe("CP03: Pro Gate Enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows UpgradeGate for Pro-only tool (game-theory)", () => {
    renderWithProviders(
      <UpgradeGate toolId="game-theory">
        <div data-testid="pro-tool-content">Pro Tool Content</div>
      </UpgradeGate>,
    );

    // UpgradeGate should render, NOT the tool content
    expect(screen.getByText("Nash Equilibrium Simulator")).toBeInTheDocument();
    expect(screen.getByText(/Pro Feature/i)).toBeInTheDocument();
    expect(screen.queryByTestId("pro-tool-content")).not.toBeInTheDocument();
  });

  it("UpgradeGate contains 'Start Free Trial' CTA for logged-in free user", () => {
    renderWithProviders(
      <UpgradeGate toolId="game-theory">
        <div>Pro Content</div>
      </UpgradeGate>,
    );

    expect(screen.getByRole("button", { name: /Start.*Free.*Trial/i })).toBeInTheDocument();
  });

  it("renders child content directly for free tool (spof-finder)", () => {
    renderWithProviders(
      <UpgradeGate toolId="spof-finder">
        <div data-testid="free-tool-content">SPOF Finder Tool</div>
      </UpgradeGate>,
    );

    // Free tool should render content directly, no gate
    expect(screen.getByTestId("free-tool-content")).toBeInTheDocument();
    expect(screen.queryByText(/Pro Feature/i)).not.toBeInTheDocument();
  });

  it("shows social proof stats on Pro tool gate", () => {
    renderWithProviders(
      <UpgradeGate toolId="game-theory">
        <div>Pro Content</div>
      </UpgradeGate>,
    );

    // Social proof should be visible
    expect(screen.getByText("2,400+")).toBeInTheDocument();
    expect(screen.getByText("87%")).toBeInTheDocument();
  });

  it("shows feature list on UpgradeGate", () => {
    renderWithProviders(
      <UpgradeGate toolId="game-theory">
        <div>Pro Content</div>
      </UpgradeGate>,
    );

    expect(screen.getByText(/Unlock your complete resilience journey/i)).toBeInTheDocument();
  });

  it("mentions free tools at the bottom of UpgradeGate", () => {
    renderWithProviders(
      <UpgradeGate toolId="game-theory">
        <div>Pro Content</div>
      </UpgradeGate>,
    );

    expect(screen.getByText(/SPOF Finder/)).toBeInTheDocument();
    expect(screen.getByText(/free diagnostic tools/i)).toBeInTheDocument();
  });
});
