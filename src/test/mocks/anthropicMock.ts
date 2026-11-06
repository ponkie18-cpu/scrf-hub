/**
 * AI Agent API mock for SCRF Hub regression tests.
 *
 * Intercepts fetch calls to the scrf-agent edge function and returns
 * configurable structured responses with optional streaming simulation.
 */
import { vi } from "vitest";
import type { AgentResponseData } from "@/services/agentService";

interface RecordedPrompt {
  message: string;
  context?: Record<string, unknown>;
  conversationHistory?: { role: string; content: string }[];
  timestamp: number;
}

const defaultResponse: AgentResponseData = {
  insight: "Based on your risk profile, your operational resilience needs attention in supply chain redundancy.",
  recommendation: "Run the SPOF Finder tool to identify single points of failure in your operations.",
  urgencyLevel: "amber",
  relatedTools: ["spof", "bia"],
  nextAction: "Run SPOF Finder",
};

export function createMockAnthropicClient() {
  let responseOverride: AgentResponseData | null = null;
  let shouldFail = false;
  let failureStatus = 500;
  let failureMessage = "AI service temporarily unavailable";
  const prompts: RecordedPrompt[] = [];

  function setResponse(response: Partial<AgentResponseData>) {
    responseOverride = { ...defaultResponse, ...response };
  }

  function simulateFailure(status = 500, message = "AI service temporarily unavailable") {
    shouldFail = true;
    failureStatus = status;
    failureMessage = message;
  }

  function clearFailure() {
    shouldFail = false;
  }

  function reset() {
    responseOverride = null;
    shouldFail = false;
    prompts.length = 0;
  }

  /**
   * Install: intercepts global fetch for the scrf-agent endpoint.
   * Call in beforeEach. Returns cleanup fn for afterEach.
   */
  function install() {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;

      if (url.includes("/functions/v1/scrf-agent")) {
        const body = init?.body ? JSON.parse(init.body as string) : {};
        prompts.push({
          message: body.message ?? "",
          context: body.context,
          conversationHistory: body.conversationHistory,
          timestamp: Date.now(),
        });

        if (shouldFail) {
          return new Response(JSON.stringify({ error: failureMessage }), {
            status: failureStatus,
            headers: { "Content-Type": "application/json" },
          });
        }

        const data = responseOverride ?? defaultResponse;
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Pass through all other fetch calls
      return originalFetch(input, init);
    }) as typeof fetch;

    return () => {
      globalThis.fetch = originalFetch;
    };
  }

  return {
    setResponse,
    simulateFailure,
    clearFailure,
    reset,
    install,
    prompts,
    get defaultResponse() {
      return { ...defaultResponse };
    },
  };
}
