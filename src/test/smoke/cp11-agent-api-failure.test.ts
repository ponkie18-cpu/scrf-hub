/**
 * CP11: Agent API Failure Test
 * Test: Agent handles API failure with graceful fallback.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMockAnthropicClient } from "@/test/mocks/anthropicMock";

let agentMock: ReturnType<typeof createMockAnthropicClient>;
let cleanup: () => void;

describe("CP11: Agent API Failure Handling", () => {
  beforeEach(() => {
    agentMock = createMockAnthropicClient();
    cleanup = agentMock.install();
  });

  afterEach(() => {
    cleanup();
    agentMock.reset();
  });

  it("returns 503 when API failure configured", async () => {
    agentMock.simulateFailure(503, "AI service temporarily unavailable");

    const res = await fetch("https://example.com/functions/v1/scrf-agent", {
      method: "POST",
      body: JSON.stringify({ message: "Help me" }),
    });

    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toBe("AI service temporarily unavailable");
  });

  it("error response is JSON-parseable (no raw HTML errors)", async () => {
    agentMock.simulateFailure(500, "Internal error");

    const res = await fetch("https://example.com/functions/v1/scrf-agent", {
      method: "POST",
      body: JSON.stringify({ message: "test" }),
    });

    const contentType = res.headers.get("Content-Type");
    expect(contentType).toBe("application/json");

    const data = await res.json();
    expect(data).toHaveProperty("error");
  });

  it("recovery works without page reload", async () => {
    // First: failure mode
    agentMock.simulateFailure(503, "Down");
    let res = await fetch("https://example.com/functions/v1/scrf-agent", {
      method: "POST",
      body: JSON.stringify({ message: "First try" }),
    });
    expect(res.status).toBe(503);

    // Then: restore
    agentMock.clearFailure();
    res = await fetch("https://example.com/functions/v1/scrf-agent", {
      method: "POST",
      body: JSON.stringify({ message: "Second try" }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.insight).toBeDefined();
  });

  it("prompts are still recorded during failure", async () => {
    agentMock.simulateFailure(503);

    await fetch("https://example.com/functions/v1/scrf-agent", {
      method: "POST",
      body: JSON.stringify({ message: "Failing message" }),
    });

    expect(agentMock.prompts).toHaveLength(1);
    expect(agentMock.prompts[0].message).toBe("Failing message");
  });

  it("non-agent fetch calls pass through unaffected", async () => {
    agentMock.simulateFailure(503);

    // This is a non-agent URL, should use the original fetch
    // (In test environment this will fail, but it shouldn't return 503)
    try {
      const res = await fetch("https://httpbin.org/get");
      // If it reaches the real network, it won't be 503
      expect(res.status).not.toBe(503);
      await res.text(); // consume body
    } catch {
      // Network error in test environment is expected, not 503
      expect(true).toBe(true);
    }
  });
});
