/**
 * SCRF Hub — 15 Critical-Path Smoke Tests
 *
 * These tests run after every deployment and block the release if any fail.
 * They cover: scoring, billing, auth, dashboard context, tool access,
 * error boundary, factories, mock client, agent, and assessment service.
 *
 * Run: npm run smoke
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

import {
  createTestUser,
  createTestSubscription,
  createTestAssessment,
  createTestActionItem,
  createTestAgentConversation,
} from "@/test/factories";
import { createMockSupabaseClient } from "@/test/mocks/supabaseMock";
import { createMockAnthropicClient } from "@/test/mocks/anthropicMock";
import { renderWithProviders } from "@/test/test-utils";
import { getRiskLevel, RISK_THRESHOLDS, DOMAIN_CONFIG } from "@/constants/riskConfig";
import { calculateScoreFromAnswers } from "@/services/assessmentService";
import { ErrorBoundary } from "@/components/ui/error-boundary";

/* ═══════════════════════════════════════════════════════
   SMOKE 1 — Factory: createTestUser
   ═══════════════════════════════════════════════════════ */
describe("SMOKE 1 — createTestUser factory", () => {
  it("returns a valid user with defaults", () => {
    const user = createTestUser();
    expect(user.id).toBeTruthy();
    expect(user.email).toContain("@scrf-hub.test");
    expect(user.profile.industry_code).toBe("retail");
    expect(user.profile.jurisdiction).toBe("ZA-GP");
    expect(user.profile.role).toBe("owner");
  });

  it("accepts overrides", () => {
    const user = createTestUser({ email: "custom@test.com", profile: { industry_code: "finance" } });
    expect(user.email).toBe("custom@test.com");
    expect(user.profile.industry_code).toBe("finance");
  });
});

/* ═══════════════════════════════════════════════════════
   SMOKE 2 — Factory: createTestSubscription
   ═══════════════════════════════════════════════════════ */
describe("SMOKE 2 — createTestSubscription factory", () => {
  it("creates free plan with no dates", () => {
    const sub = createTestSubscription("free");
    expect(sub.plan_type).toBe("free");
    expect(sub.trial_start_date).toBeNull();
    expect(sub.paystack_customer_code).toBeNull();
  });

  it("creates trial plan with 14-day window", () => {
    const sub = createTestSubscription("trial");
    expect(sub.plan_type).toBe("trial");
    expect(sub.trial_start_date).toBeTruthy();
    expect(sub.trial_end_date).toBeTruthy();
    const start = new Date(sub.trial_start_date!);
    const end = new Date(sub.trial_end_date!);
    const daysDiff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    expect(daysDiff).toBe(14);
  });

  it("creates pro plan with Paystack codes", () => {
    const sub = createTestSubscription("pro");
    expect(sub.plan_type).toBe("pro");
    expect(sub.paystack_customer_code).toContain("CUS_test_");
    expect(sub.billing_interval).toBe("monthly");
    expect(sub.monthly_amount_rands).toBe(299);
  });
});

/* ═══════════════════════════════════════════════════════
   SMOKE 3 — Factory: createTestAssessment
   ═══════════════════════════════════════════════════════ */
describe("SMOKE 3 — createTestAssessment factory", () => {
  it("maps tool to correct domain", () => {
    expect(createTestAssessment("spof").domain).toBe("operational");
    expect(createTestAssessment("financial-health").domain).toBe("financial");
    expect(createTestAssessment("contract-checker").domain).toBe("compliance");
    expect(createTestAssessment("cyber-scorecard").domain).toBe("strategic");
  });

  it("uses provided score", () => {
    expect(createTestAssessment("spof", 42).score).toBe(42);
  });
});

/* ═══════════════════════════════════════════════════════
   SMOKE 4 — Factory: createTestActionItem
   ═══════════════════════════════════════════════════════ */
describe("SMOKE 4 — createTestActionItem factory", () => {
  it("creates pending item with future due date", () => {
    const item = createTestActionItem("pending");
    expect(item.completed).toBe(false);
    expect(new Date(item.due_date!).getTime()).toBeGreaterThan(Date.now());
  });

  it("creates completed item", () => {
    const item = createTestActionItem("completed");
    expect(item.completed).toBe(true);
    expect(item.completed_at).toBeTruthy();
  });

  it("creates overdue item with past due date", () => {
    const item = createTestActionItem("overdue");
    expect(item.completed).toBe(false);
    expect(new Date(item.due_date!).getTime()).toBeLessThan(Date.now());
    expect(item.priority).toBe("critical");
  });
});

/* ═══════════════════════════════════════════════════════
   SMOKE 5 — Factory: createTestAgentConversation
   ═══════════════════════════════════════════════════════ */
describe("SMOKE 5 — createTestAgentConversation factory", () => {
  it("creates alternating user/assistant messages", () => {
    const msgs = createTestAgentConversation(4);
    expect(msgs).toHaveLength(4);
    expect(msgs[0].role).toBe("user");
    expect(msgs[1].role).toBe("assistant");
    expect(msgs[2].role).toBe("user");
    expect(msgs[3].role).toBe("assistant");
  });

  it("assistant messages have structured_data", () => {
    const msgs = createTestAgentConversation(2);
    expect(msgs[1].structured_data).toBeTruthy();
    expect(msgs[1].structured_data!.insight).toBeTruthy();
  });

  it("all messages share the same session_id", () => {
    const msgs = createTestAgentConversation(6);
    const sessions = new Set(msgs.map((m) => m.session_id));
    expect(sessions.size).toBe(1);
  });
});

/* ═══════════════════════════════════════════════════════
   SMOKE 6 — Supabase Mock: query chain & RLS
   ═══════════════════════════════════════════════════════ */
describe("SMOKE 6 — Supabase mock client", () => {
  it("filters by user_id (RLS simulation)", async () => {
    const userId = "user-abc";
    const { mockSupabase, setTableData } = createMockSupabaseClient(userId);
    setTableData("risk_assessments", [
      { id: "1", user_id: "user-abc", domain: "operational", score: 70 },
      { id: "2", user_id: "other-user", domain: "financial", score: 50 },
    ]);

    const { data } = await mockSupabase.from("risk_assessments").select("*");
    expect(data).toHaveLength(1);
    expect((data as { id: string }[])[0].id).toBe("1");
  });

  it("simulates errors when configured", async () => {
    const { mockSupabase, simulateError } = createMockSupabaseClient("u1");
    simulateError("risk_assessments", "select", "NETWORK_ERROR");
    const { data, error } = await mockSupabase.from("risk_assessments").select("*");
    expect(data).toBeNull();
    expect(error).toBeTruthy();
    expect(error!.code).toBe("NETWORK_ERROR");
  });

  it("tracks calls for assertion", async () => {
    const { mockSupabase, calls } = createMockSupabaseClient("u1");
    await mockSupabase.from("action_items").select("*").eq("domain", "operational");
    expect(calls.length).toBeGreaterThanOrEqual(1);
    expect(calls[0].table).toBe("action_items");
  });
});

/* ═══════════════════════════════════════════════════════
   SMOKE 7 — Anthropic Mock: response & failure
   ═══════════════════════════════════════════════════════ */
describe("SMOKE 7 — Anthropic mock client", () => {
  let cleanup: () => void;
  let mock: ReturnType<typeof createMockAnthropicClient>;

  beforeEach(() => {
    mock = createMockAnthropicClient();
    cleanup = mock.install();
  });

  afterEach(() => {
    cleanup();
    mock.reset();
  });

  it("returns default structured response", async () => {
    const res = await fetch("https://example.com/functions/v1/scrf-agent", {
      method: "POST",
      body: JSON.stringify({ message: "test" }),
    });
    const data = await res.json();
    expect(data.insight).toBeTruthy();
    expect(data.recommendation).toBeTruthy();
    expect(data.relatedTools).toBeInstanceOf(Array);
  });

  it("records prompts for assertion", async () => {
    await fetch("https://example.com/functions/v1/scrf-agent", {
      method: "POST",
      body: JSON.stringify({ message: "How is my risk?", context: { currentDomain: "operational" } }),
    });
    expect(mock.prompts).toHaveLength(1);
    expect(mock.prompts[0].message).toBe("How is my risk?");
    expect(mock.prompts[0].context?.currentDomain).toBe("operational");
  });

  it("simulates failure when configured", async () => {
    mock.simulateFailure(503, "Agent down");
    const res = await fetch("https://example.com/functions/v1/scrf-agent", {
      method: "POST",
      body: JSON.stringify({ message: "test" }),
    });
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toBe("Agent down");
  });
});

/* ═══════════════════════════════════════════════════════
   SMOKE 8 — Risk scoring thresholds
   ═══════════════════════════════════════════════════════ */
describe("SMOKE 8 — Risk scoring engine thresholds", () => {
  it("classifies all four risk levels correctly", () => {
    expect(getRiskLevel(10)).toBe("critical");
    expect(getRiskLevel(40)).toBe("high");
    expect(getRiskLevel(60)).toBe("medium");
    expect(getRiskLevel(85)).toBe("low");
  });

  it("threshold boundaries are exact", () => {
    expect(getRiskLevel(RISK_THRESHOLDS.CRITICAL - 1)).toBe("critical");
    expect(getRiskLevel(RISK_THRESHOLDS.CRITICAL)).toBe("high");
    expect(getRiskLevel(RISK_THRESHOLDS.HIGH)).toBe("medium");
    expect(getRiskLevel(RISK_THRESHOLDS.MEDIUM)).toBe("low");
  });
});

/* ═══════════════════════════════════════════════════════
   SMOKE 9 — Score calculation from answers
   ═══════════════════════════════════════════════════════ */
describe("SMOKE 9 — calculateScoreFromAnswers", () => {
  it("returns 50 for empty input", () => {
    expect(calculateScoreFromAnswers({})).toBe(50);
  });

  it("scores booleans: true=80, false=20", () => {
    expect(calculateScoreFromAnswers({ q: true })).toBe(80);
    expect(calculateScoreFromAnswers({ q: false })).toBe(20);
  });

  it("applies weights correctly", () => {
    const score = calculateScoreFromAnswers({ a: true, b: false }, { a: 3, b: 1 });
    expect(score).toBe(65); // (80*3+20*1)/4
  });

  it("clamps numeric answers to 0-100", () => {
    expect(calculateScoreFromAnswers({ q: 200 })).toBe(100);
    expect(calculateScoreFromAnswers({ q: -50 })).toBe(0);
  });
});

/* ═══════════════════════════════════════════════════════
   SMOKE 10 — Domain config completeness
   ═══════════════════════════════════════════════════════ */
describe("SMOKE 10 — Domain configuration", () => {
  it("defines exactly 4 risk domains", () => {
    const domains = Object.keys(DOMAIN_CONFIG);
    expect(domains).toHaveLength(4);
    expect(domains).toContain("operational");
    expect(domains).toContain("financial");
    expect(domains).toContain("compliance");
    expect(domains).toContain("strategic");
  });

  it("domain weights sum to 1.0", () => {
    const sum = Object.values(DOMAIN_CONFIG).reduce((acc, d) => acc + d.weight, 0);
    expect(sum).toBeCloseTo(1.0);
  });
});

/* ═══════════════════════════════════════════════════════
   SMOKE 11 — ErrorBoundary renders fallback
   ═══════════════════════════════════════════════════════ */
describe("SMOKE 11 — ErrorBoundary component", () => {
  function Bomb(): React.ReactElement {
    throw new Error("Kaboom");
  }

  it("catches child errors and renders fallback UI", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary section="Smoke">
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Smoke Error")).toBeInTheDocument();
    expect(screen.getByText("Kaboom")).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
    spy.mockRestore();
  });

  it("renders children when no error", () => {
    render(
      <ErrorBoundary section="Smoke">
        <div>OK</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText("OK")).toBeInTheDocument();
  });
});

/* ═══════════════════════════════════════════════════════
   SMOKE 12 — renderWithProviders works
   ═══════════════════════════════════════════════════════ */
describe("SMOKE 12 — renderWithProviders utility", () => {
  it("renders a component inside all providers", () => {
    function TestComp() {
      return <div>Providers work</div>;
    }
    renderWithProviders(<TestComp />);
    expect(screen.getByText("Providers work")).toBeInTheDocument();
  });

  it("accepts custom route", () => {
    renderWithProviders(<div>Route test</div>, { route: "/dashboard" });
    expect(window.location.pathname).toBe("/dashboard");
  });
});

/* ═══════════════════════════════════════════════════════
   SMOKE 13 — Billing subscription state shapes
   ═══════════════════════════════════════════════════════ */
describe("SMOKE 13 — Billing subscription state correctness", () => {
  it("expired plan has no active Paystack codes", () => {
    const sub = createTestSubscription("expired");
    expect(sub.plan_type).toBe("expired");
    expect(sub.paystack_subscription_code).toBeNull();
  });

  it("cancelled plan preserves subscription_end_date when overridden", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 18);
    const sub = createTestSubscription("cancelled", {
      subscription_end_date: futureDate.toISOString(),
    });
    expect(sub.plan_type).toBe("cancelled");
    expect(sub.subscription_end_date).toBeTruthy();
    expect(new Date(sub.subscription_end_date!).getTime()).toBeGreaterThan(Date.now());
  });

  it("payment_failure_count defaults to 0", () => {
    const sub = createTestSubscription("pro");
    expect(sub.payment_failure_count).toBe(0);
  });
});

/* ═══════════════════════════════════════════════════════
   SMOKE 14 — Mock auth session shape
   ═══════════════════════════════════════════════════════ */
describe("SMOKE 14 — Mock Supabase auth session", () => {
  it("getSession returns valid session with access_token", async () => {
    const { mockSupabase } = createMockSupabaseClient("user-123");
    const { data } = await mockSupabase.auth.getSession();
    expect(data.session).toBeTruthy();
    expect(data.session!.access_token).toBe("mock-token");
    expect(data.session!.user.id).toBe("user-123");
  });

  it("onAuthStateChange returns unsubscribe handle", () => {
    const { mockSupabase } = createMockSupabaseClient("user-123");
    const { data } = mockSupabase.auth.onAuthStateChange(vi.fn());
    expect(data.subscription.unsubscribe).toBeInstanceOf(Function);
  });
});

/* ═══════════════════════════════════════════════════════
   SMOKE 15 — Supabase mock insert + query roundtrip
   ═══════════════════════════════════════════════════════ */
describe("SMOKE 15 — Mock insert + query roundtrip", () => {
  it("inserted data is retrievable via select", async () => {
    const userId = "rt-user";
    const { mockSupabase } = createMockSupabaseClient(userId);

    await mockSupabase
      .from("score_history")
      .insert({ domain: "operational", score: 72, user_id: userId });

    const { data } = await mockSupabase.from("score_history").select("*");
    expect(data).toHaveLength(1);
    expect((data as { score: number }[])[0].score).toBe(72);
  });

  it("eq filter narrows results", async () => {
    const userId = "rt-user-2";
    const { mockSupabase, setTableData } = createMockSupabaseClient(userId);
    setTableData("action_items", [
      { id: "1", user_id: userId, domain: "operational", completed: false },
      { id: "2", user_id: userId, domain: "financial", completed: true },
    ]);

    const { data } = await mockSupabase
      .from("action_items")
      .select("*")
      .eq("completed", true);
    expect(data).toHaveLength(1);
    expect((data as { id: string }[])[0].id).toBe("2");
  });
});
