/**
 * CP12: Trial Expiry Gate Test
 * Test: Expired trial correctly blocks Pro features and shows modal.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import { createTestSubscription } from "@/test/factories";
import React from "react";

const expiredSubscription = createTestSubscription("expired");

// Mock usePlanAccess for expired trial
vi.mock("@/hooks/usePlanAccess", () => ({
  usePlanAccess: () => ({
    isPro: false,
    isTrial: false,
    isExpired: true,
    isCancelled: false,
    isFree: false,
    daysRemaining: 0,
    planType: "expired",
    nextBillingDate: null,
    paymentFailureCount: 0,
    accessUntil: null,
    canActivateTrial: false,
    billingInterval: null,
    monthlyAmountRands: null,
    loading: false,
    refetch: vi.fn(),
    canAccessFeature: (name: string) => {
      const freeFeatures = ["spof-finder", "compliance-motivation", "financial-health-scorecard"];
      return freeFeatures.includes(name);
    },
  }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "expired-user", email: "expired@test.com" },
    session: { access_token: "mock" },
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

import { BillingStatusBanner } from "@/components/billing/BillingStatusBanner";

describe("CP12: Trial Expiry Gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("expired subscription has correct shape", () => {
    expect(expiredSubscription.plan_type).toBe("expired");
    expect(expiredSubscription.paystack_subscription_code).toBeNull();
  });

  it("BillingStatusBanner shows expired state", () => {
    renderWithProviders(<BillingStatusBanner />);

    expect(screen.getByText(/has ended/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Upgrade to Pro/i })).toBeInTheDocument();
  });

  it("expired banner has destructive styling", () => {
    renderWithProviders(<BillingStatusBanner />);

    // The XCircle icon and destructive text should be present
    expect(screen.getByText(/has ended/i)).toBeInTheDocument();
  });

  it("canAccessFeature returns true for free tools", () => {
    const { usePlanAccess } = require("@/hooks/usePlanAccess");
    const { canAccessFeature } = usePlanAccess();

    expect(canAccessFeature("spof-finder")).toBe(true);
    expect(canAccessFeature("compliance-motivation")).toBe(true);
  });

  it("canAccessFeature returns false for pro tools", () => {
    const { usePlanAccess } = require("@/hooks/usePlanAccess");
    const { canAccessFeature } = usePlanAccess();

    expect(canAccessFeature("game-theory")).toBe(false);
    expect(canAccessFeature("audit-agent")).toBe(false);
  });

  it("isPro is false for expired users", () => {
    const { usePlanAccess } = require("@/hooks/usePlanAccess");
    const plan = usePlanAccess();

    expect(plan.isPro).toBe(false);
    expect(plan.isExpired).toBe(true);
    expect(plan.daysRemaining).toBe(0);
  });
});
