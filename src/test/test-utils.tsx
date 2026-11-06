/**
 * Global test utilities for SCRF Hub regression tests.
 *
 * renderWithProviders()  — renders with all context providers
 * createTestUser()       — re-exported from factories for convenience
 */
import React, { type ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";

// Re-export factories
export {
  createTestUser,
  createTestSubscription,
  createTestAssessment,
  createTestActionItem,
  createTestAgentConversation,
} from "./factories";

// Re-export mocks
export { createMockSupabaseClient } from "./mocks/supabaseMock";
export { createMockAnthropicClient } from "./mocks/anthropicMock";

interface ProviderOptions {
  /** Initial route for the BrowserRouter */
  route?: string;
  /** Override the QueryClient */
  queryClient?: QueryClient;
}

/**
 * Wraps component in all necessary providers for integration-level tests.
 */
export function renderWithProviders(
  ui: ReactElement,
  options: ProviderOptions & Omit<RenderOptions, "wrapper"> = {},
) {
  const { route = "/", queryClient: qc, ...renderOptions } = options;

  window.history.pushState({}, "Test", route);

  const queryClient =
    qc ??
    new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}
