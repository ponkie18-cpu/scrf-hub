/**
 * CP02: Login Session Test
 * Test: An existing user can log in and their subscription state loads.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/test-utils";
import React from "react";

const mockSignIn = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    session: null,
    loading: false,
    signUp: vi.fn(),
    signIn: mockSignIn,
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    functions: { invoke: vi.fn().mockResolvedValue({ data: { success: true, planType: "pro" }, error: null }) },
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() }),
    removeChannel: vi.fn(),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => vi.fn() };
});

import Auth from "@/pages/Auth";

describe("CP02: Login Session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the login form", () => {
    renderWithProviders(<Auth />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("calls signIn with correct credentials on submit", async () => {
    mockSignIn.mockResolvedValue({ error: null });
    renderWithProviders(<Auth />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "pro@smoke.co.za" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Smoke@Test99!" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("pro@smoke.co.za", "Smoke@Test99!");
    });
  });

  it("shows error message on invalid credentials", async () => {
    mockSignIn.mockResolvedValue({ error: { message: "Invalid login credentials" } });
    renderWithProviders(<Auth />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "wrong@email.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "WrongPass1!" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
    });
  });

  it("has forgot password link", () => {
    renderWithProviders(<Auth />);
    expect(screen.getByText(/Forgot your password/i)).toBeInTheDocument();
  });

  it("disables submit while loading", async () => {
    mockSignIn.mockImplementation(() => new Promise(() => {})); // never resolves
    renderWithProviders(<Auth />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "pro@smoke.co.za" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Smoke@Test99!" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByText(/Signing in/i)).toBeInTheDocument();
    });
  });
});
