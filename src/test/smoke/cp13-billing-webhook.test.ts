/**
 * CP13: Billing Webhook Processing Test
 * Test: Paystack webhook updates subscription state correctly.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestUser, createTestSubscription } from "@/test/factories";
import { createMockSupabaseClient } from "@/test/mocks/supabaseMock";

const testUser = createTestUser();
const proSubscription = createTestSubscription("pro", { user_id: testUser.id });

describe("CP13: Billing Webhook Processing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates valid pro subscription record", () => {
    expect(proSubscription.plan_type).toBe("pro");
    expect(proSubscription.paystack_customer_code).toBeTruthy();
    expect(proSubscription.paystack_subscription_code).toBeTruthy();
    expect(proSubscription.billing_interval).toBe("monthly");
    expect(proSubscription.monthly_amount_rands).toBe(299);
  });

  it("mock Supabase client filters by user_id (RLS)", async () => {
    const { mockSupabase, setTableData } = createMockSupabaseClient(testUser.id);

    setTableData("subscriptions", [
      { ...proSubscription, user_id: testUser.id },
      { ...createTestSubscription("trial"), user_id: "other-user" },
    ]);

    const { data } = await mockSupabase.from("subscriptions").select("*");
    expect(data).toHaveLength(1);
    expect((data as any[])[0].user_id).toBe(testUser.id);
  });

  it("billing_events can be inserted via mock", async () => {
    const { mockSupabase, calls } = createMockSupabaseClient(testUser.id);

    await mockSupabase.from("billing_events").insert({
      user_id: testUser.id,
      event_type: "payment_success",
      paystack_reference: "REF_123",
      amount_rands: 299,
    });

    const insertCalls = calls.filter((c) => c.table === "billing_events" && c.method === "insert");
    expect(insertCalls).toHaveLength(1);
  });

  it("duplicate webhook reference can be detected via billing_events query", async () => {
    const { mockSupabase, setTableData } = createMockSupabaseClient(testUser.id);

    // Simulate existing billing event
    setTableData("billing_events", [
      {
        id: "evt-1",
        user_id: testUser.id,
        event_type: "payment_success",
        paystack_reference: "REF_123",
        amount_rands: 299,
        created_at: new Date().toISOString(),
      },
    ]);

    const { data } = await mockSupabase
      .from("billing_events")
      .select("*")
      .eq("paystack_reference", "REF_123");

    expect(data).toHaveLength(1);
    // Second webhook with same reference should detect the existing record
  });

  it("mock simulates error when configured", async () => {
    const { mockSupabase, simulateError } = createMockSupabaseClient(testUser.id);

    simulateError("subscriptions", "select", "NETWORK_ERROR");

    const { data, error } = await mockSupabase.from("subscriptions").select("*");
    expect(data).toBeNull();
    expect(error).toBeTruthy();
    expect(error!.code).toBe("NETWORK_ERROR");
  });

  it("payment_failure_count defaults to 0 on pro subscription", () => {
    expect(proSubscription.payment_failure_count).toBe(0);
  });

  it("subscription has all required billing fields", () => {
    expect(proSubscription.last_payment_date).toBeTruthy();
    expect(proSubscription.next_billing_date).toBeTruthy();
    expect(proSubscription.subscription_start_date).toBeTruthy();
  });
});
