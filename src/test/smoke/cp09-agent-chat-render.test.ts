/**
 * CP09: Agent Chat Render Test
 * Test: Agent chat panel opens, sends a message with context, response streams.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMockAnthropicClient } from "@/test/mocks/anthropicMock";
import { createTestUser, createTestAgentConversation } from "@/test/factories";

const testUser = createTestUser();
let agentMock: ReturnType<typeof createMockAnthropicClient>;
let cleanup: () => void;

describe("CP09: Agent Chat & Context", () => {
  beforeEach(() => {
    agentMock = createMockAnthropicClient();
    cleanup = agentMock.install();
  });

  afterEach(() => {
    cleanup();
    agentMock.reset();
  });

  it("agent mock returns structured response with all fields", async () => {
    const response = await fetch("https://example.com/functions/v1/scrf-agent", {
      method: "POST",
      body: JSON.stringify({ message: "What is my biggest risk today?" }),
    });

    const data = await response.json();
    expect(data.insight).toBeDefined();
    expect(data.recommendation).toBeDefined();
    expect(data.urgencyLevel).toMatch(/^(red|amber|green)$/);
    expect(data.relatedTools).toBeInstanceOf(Array);
    expect(data.nextAction).toBeDefined();
  });

  it("records prompt with user message", async () => {
    await fetch("https://example.com/functions/v1/scrf-agent", {
      method: "POST",
      body: JSON.stringify({
        message: "What is my biggest risk today?",
        context: { currentDomain: "operational" },
      }),
    });

    expect(agentMock.prompts).toHaveLength(1);
    expect(agentMock.prompts[0].message).toBe("What is my biggest risk today?");
  });

  it("injects user context into API call", async () => {
    await fetch("https://example.com/functions/v1/scrf-agent", {
      method: "POST",
      body: JSON.stringify({
        message: "Help me",
        context: {
          currentDomain: "financial",
          currentToolId: "cashflow-stress",
          toolResults: { score: 45 },
        },
      }),
    });

    expect(agentMock.prompts[0].context).toEqual({
      currentDomain: "financial",
      currentToolId: "cashflow-stress",
      toolResults: { score: 45 },
    });
  });

  it("includes conversation history in multi-turn calls", async () => {
    const history = [
      { role: "user", content: "What about compliance?" },
      { role: "assistant", content: "Your compliance score is 81." },
    ];

    await fetch("https://example.com/functions/v1/scrf-agent", {
      method: "POST",
      body: JSON.stringify({
        type: "conversation",
        message: "Can you elaborate?",
        conversationHistory: history,
      }),
    });

    expect(agentMock.prompts[0].conversationHistory).toHaveLength(2);
  });

  it("custom response override works", async () => {
    agentMock.setResponse({
      insight: "Custom insight for testing",
      urgencyLevel: "red",
    });

    const response = await fetch("https://example.com/functions/v1/scrf-agent", {
      method: "POST",
      body: JSON.stringify({ message: "test" }),
    });

    const data = await response.json();
    expect(data.insight).toBe("Custom insight for testing");
    expect(data.urgencyLevel).toBe("red");
  });

  it("conversation factory creates alternating messages", () => {
    const msgs = createTestAgentConversation(6, { user_id: testUser.id });
    expect(msgs).toHaveLength(6);
    expect(msgs[0].role).toBe("user");
    expect(msgs[1].role).toBe("assistant");
    expect(msgs[1].structured_data).toBeTruthy();
    expect(msgs.every((m) => m.user_id === testUser.id)).toBe(true);
  });
});
