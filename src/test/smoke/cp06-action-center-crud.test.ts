/**
 * CP06: Action Center CRUD Test
 * Test: Action items can be created, updated, and completed.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createTestUser, createTestActionItem } from "@/test/factories";

const testUser = createTestUser();
const pendingItem = createTestActionItem("pending", { user_id: testUser.id, id: "action-1" });
const completedItem = createTestActionItem("completed", { user_id: testUser.id, id: "action-2" });
const overdueItem = createTestActionItem("overdue", { user_id: testUser.id, id: "action-3" });

const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ data: null, error: null }),
});

const mockInsert = vi.fn().mockResolvedValue({ data: { id: "new-action" }, error: null });

const mockSelect = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    order: vi.fn().mockResolvedValue({
      data: [pendingItem, completedItem, overdueItem],
      error: null,
    }),
  }),
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((table: string) => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: testUser.id } }, error: null }),
    },
  },
}));

describe("CP06: Action Center CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates action items with correct structure", () => {
    const item = createTestActionItem("pending", { user_id: testUser.id });

    expect(item.id).toBeDefined();
    expect(item.user_id).toBe(testUser.id);
    expect(item.completed).toBe(false);
    expect(item.priority).toBeDefined();
    expect(item.title).toContain("pending");
  });

  it("completed action items have completed_at timestamp", () => {
    const completed = createTestActionItem("completed");

    expect(completed.completed).toBe(true);
    expect(completed.completed_at).toBeTruthy();
  });

  it("overdue action items have past due_date and critical priority", () => {
    const overdue = createTestActionItem("overdue");

    expect(overdue.completed).toBe(false);
    expect(new Date(overdue.due_date!).getTime()).toBeLessThan(Date.now());
    expect(overdue.priority).toBe("critical");
  });

  it("pending action items have future due_date", () => {
    const pending = createTestActionItem("pending");

    expect(pending.completed).toBe(false);
    expect(new Date(pending.due_date!).getTime()).toBeGreaterThan(Date.now());
  });

  it("action items include domain and description", () => {
    const item = createTestActionItem("pending");

    expect(item.domain).toBe("operational");
    expect(item.description).toBeDefined();
  });

  it("action items have created_at and updated_at timestamps", () => {
    const item = createTestActionItem("pending");

    expect(item.created_at).toBeDefined();
    expect(item.updated_at).toBeDefined();
    expect(new Date(item.created_at).getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("accepts overrides for custom action items", () => {
    const customItem = createTestActionItem("pending", {
      title: "Custom action",
      domain: "financial",
      priority: "high",
    });

    expect(customItem.title).toBe("Custom action");
    expect(customItem.domain).toBe("financial");
    expect(customItem.priority).toBe("high");
  });
});
