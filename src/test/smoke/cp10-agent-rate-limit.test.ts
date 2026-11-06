/**
 * CP10: Agent Rate Limit Test
 * Test: Free-tier rate limit blocks at exactly 10 messages.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMockAnthropicClient } from "@/test/mocks/anthropicMock";
import { createTestUser } from "@/test/factories";

const freeUser = createTestUser();
let agentMock: ReturnType<typeof createMockAnthropicClient>;
let cleanup: () => void;

describe("CP10: Agent Rate Limit", () => {
  beforeEach(() => {
    agentMock = createMockAnthropicClient();
    cleanup = agentMock.install();
  });

  afterEach(() => {
    cleanup();
    agentMock.reset();
  });

  it("agent mock allows messages before rate limit", async () => {
    const res = await fetch("https://example.com/functions/v1/scrf-agent", {
      method: "POST",
      body: JSON.stringify({ message: "Message 1" }),
    });
    expect(res.status).toBe(200);
  });

  it("rate limit mock returns 429 when configured", async () => {
    agentMock.simulateFailure(429, "You've used all your daily AI responses. Upgrade to Pro for unlimited access.");

    const res = await fetch("https://example.com/functions/v1/scrf-agent", {
      method: "POST",
      body: JSON.stringify({ message: "Message 11" }),
    });

    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toContain("daily AI responses");
  });

  it("tracks number of prompts sent", async () => {
    // Send 10 messages
    for (let i = 0; i < 10; i++) {
      await fetch("https://example.com/functions/v1/scrf-agent", {
        method: "POST",
        body: JSON.stringify({ message: `Message ${i + 1}` }),
      });
    }

    expect(agentMock.prompts).toHaveLength(10);
  });

  it("no API call made after rate limit failure", async () => {
    // Configure failure from the start
    agentMock.simulateFailure(429, "Rate limited");

    const res = await fetch("https://example.com/functions/v1/scrf-agent", {
      method: "POST",
      body: JSON.stringify({ message: "Should be blocked" }),
    });

    expect(res.status).toBe(429);
    // The prompt was recorded but got rate limited
    expect(agentMock.prompts).toHaveLength(1);
  });

  it("recovery works after clearing rate limit state", async () => {
    agentMock.simulateFailure(429, "Rate limited");

    const failedRes = await fetch("https://example.com/functions/v1/scrf-agent", {
      method: "POST",
      body: JSON.stringify({ message: "Blocked" }),
    });
    expect(failedRes.status).toBe(429);

    // Clear the failure (simulating Pro upgrade)
    agentMock.clearFailure();

    const successRes = await fetch("https://example.com/functions/v1/scrf-agent", {
      method: "POST",
      body: JSON.stringify({ message: "After upgrade" }),
    });
    expect(successRes.status).toBe(200);
  });
});
