/**
 * Typed mock data factories for SCRF Hub regression tests.
 * Each factory returns a complete record matching the DB schema.
 */
import { v4 } from "./uuid";

// Tiny UUID v4 stand-in (no external dep)
export { v4 as uuid } from "./uuid";

/* ─── User ─────────────────────────────────────────── */

export interface TestUser {
  id: string;
  email: string;
  created_at: string;
  profile: {
    id: string;
    name: string;
    role: string;
    company_id: string | null;
    industry_code: string;
    jurisdiction: string;
    risk_maturity_score: number;
    top_concerns: string[];
    created_at: string;
    updated_at: string;
  };
}

export function createTestUser(overrides: Partial<TestUser & { profile: Partial<TestUser["profile"]> }> = {}): TestUser {
  const id = overrides.id ?? v4();
  const now = new Date().toISOString();
  return {
    id,
    email: overrides.email ?? `test-${id.slice(0, 8)}@scrf-hub.test`,
    created_at: overrides.created_at ?? now,
    profile: {
      id,
      name: "Test User",
      role: "owner",
      company_id: null,
      industry_code: "retail",
      jurisdiction: "ZA-GP",
      risk_maturity_score: 0,
      top_concerns: ["cash-flow", "compliance"],
      created_at: now,
      updated_at: now,
      ...overrides.profile,
    },
  };
}

/* ─── Subscription ─────────────────────────────────── */

export interface TestSubscription {
  id: string;
  user_id: string;
  plan_type: "free" | "trial" | "pro" | "cancelled" | "expired";
  trial_start_date: string | null;
  trial_end_date: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  paystack_customer_code: string | null;
  paystack_subscription_code: string | null;
  billing_interval: string | null;
  monthly_amount_rands: number | null;
  last_payment_date: string | null;
  next_billing_date: string | null;
  payment_failure_count: number;
  created_at: string;
  updated_at: string;
}

export function createTestSubscription(
  planType: TestSubscription["plan_type"] = "free",
  overrides: Partial<TestSubscription> = {},
): TestSubscription {
  const now = new Date();
  const userId = overrides.user_id ?? v4();
  const base: TestSubscription = {
    id: v4(),
    user_id: userId,
    plan_type: planType,
    trial_start_date: null,
    trial_end_date: null,
    subscription_start_date: null,
    subscription_end_date: null,
    paystack_customer_code: null,
    paystack_subscription_code: null,
    billing_interval: null,
    monthly_amount_rands: null,
    last_payment_date: null,
    next_billing_date: null,
    payment_failure_count: 0,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  if (planType === "trial") {
    const start = new Date(now);
    const end = new Date(now);
    end.setDate(end.getDate() + 14);
    base.trial_start_date = start.toISOString();
    base.trial_end_date = end.toISOString();
  }

  if (planType === "pro") {
    const start = new Date(now);
    const next = new Date(now);
    next.setDate(next.getDate() + 30);
    base.subscription_start_date = start.toISOString();
    base.next_billing_date = next.toISOString();
    base.billing_interval = "monthly";
    base.monthly_amount_rands = 299;
    base.last_payment_date = start.toISOString();
    base.paystack_customer_code = `CUS_test_${userId.slice(0, 8)}`;
    base.paystack_subscription_code = `SUB_test_${userId.slice(0, 8)}`;
  }

  return { ...base, ...overrides };
}

/* ─── Assessment ───────────────────────────────────── */

export interface TestAssessment {
  id: string;
  user_id: string;
  domain: string;
  tool_id: string;
  score: number;
  confidence: number;
  assessment_data: Record<string, unknown>;
  insights: string[];
  recommendations: { priority: string; action: string; estimatedTime: number; domain: string }[];
  created_at: string;
  updated_at: string;
}

export function createTestAssessment(
  toolName: string = "spof",
  score: number = 65,
  overrides: Partial<TestAssessment> = {},
): TestAssessment {
  const now = new Date().toISOString();
  const domainMap: Record<string, string> = {
    spof: "operational",
    "process-doc": "operational",
    bia: "operational",
    "financial-health": "financial",
    "cashflow-stress": "financial",
    "compliance-motivation": "compliance",
    "contract-checker": "compliance",
    "regulatory-tracker": "compliance",
    "data-protection": "compliance",
    "cyber-scorecard": "strategic",
    "horizon-scanner": "strategic",
    "incident-playbook": "strategic",
  };
  return {
    id: v4(),
    user_id: overrides.user_id ?? v4(),
    domain: domainMap[toolName] ?? "operational",
    tool_id: toolName,
    score,
    confidence: 0.8,
    assessment_data: { q1: true, q2: false },
    insights: ["Sample insight for testing"],
    recommendations: [
      { priority: "high", action: "Fix the identified gap", estimatedTime: 30, domain: domainMap[toolName] ?? "operational" },
    ],
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

/* ─── Action Item ──────────────────────────────────── */

export interface TestActionItem {
  id: string;
  user_id: string;
  domain: string;
  title: string;
  description: string | null;
  priority: string;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function createTestActionItem(
  status: "pending" | "completed" | "overdue" = "pending",
  overrides: Partial<TestActionItem> = {},
): TestActionItem {
  const now = new Date();
  const dueDate = new Date(now);
  if (status === "overdue") dueDate.setDate(dueDate.getDate() - 3);
  else dueDate.setDate(dueDate.getDate() + 7);

  return {
    id: v4(),
    user_id: overrides.user_id ?? v4(),
    domain: "operational",
    title: `Test action item (${status})`,
    description: "Auto-generated test action item",
    priority: status === "overdue" ? "critical" : "medium",
    due_date: dueDate.toISOString(),
    completed: status === "completed",
    completed_at: status === "completed" ? now.toISOString() : null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...overrides,
  };
}

/* ─── Agent Conversation ───────────────────────────── */

export interface TestConversationMessage {
  id: string;
  user_id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  structured_data: Record<string, unknown> | null;
  created_at: string;
}

export function createTestAgentConversation(
  messageCount: number = 4,
  overrides: Partial<{ user_id: string; session_id: string }> = {},
): TestConversationMessage[] {
  const userId = overrides.user_id ?? v4();
  const sessionId = overrides.session_id ?? v4();
  const messages: TestConversationMessage[] = [];

  for (let i = 0; i < messageCount; i++) {
    const isUser = i % 2 === 0;
    const ts = new Date();
    ts.setMinutes(ts.getMinutes() + i);
    messages.push({
      id: v4(),
      user_id: userId,
      session_id: sessionId,
      role: isUser ? "user" : "assistant",
      content: isUser ? `User question ${Math.ceil((i + 1) / 2)}` : `Assistant response ${Math.ceil(i / 2)}`,
      structured_data: isUser
        ? null
        : {
            insight: "Test insight",
            recommendation: "Test recommendation",
            urgencyLevel: "green",
            relatedTools: ["spof"],
            nextAction: "Run SPOF Finder",
          },
      created_at: ts.toISOString(),
    });
  }

  return messages;
}
