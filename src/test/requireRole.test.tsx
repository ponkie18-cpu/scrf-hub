import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RequireRole from "@/components/auth/RequireRole";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), maybeSingle: vi.fn(), eq: vi.fn(), select: vi.fn(), from: vi.fn(),
}));
vi.mock("@/hooks/useAuth", () => ({ useAuth: mocks.auth }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { from: mocks.from } }));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockReturnValue({ user: { id: "synthetic-admin" }, loading: false, profile: { role: "admin" } });
  mocks.from.mockReturnValue({ select: mocks.select });
  mocks.select.mockReturnValue({ eq: mocks.eq });
  mocks.eq.mockReturnValue({ eq: mocks.eq, maybeSingle: mocks.maybeSingle });
});
afterEach(cleanup);

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={["/protected"]}>
    <Routes>
      <Route path="/protected" element={<RequireRole role="admin"><div>Admin panel</div></RequireRole>} />
      <Route path="/dashboard" element={<div>Dashboard redirect</div>} />
      <Route path="/auth" element={<div>Sign in</div>} />
    </Routes>
  </MemoryRouter></QueryClientProvider>);
}

describe("verified administrator route guard", () => {
  it("allows a verified user_roles administrator", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { role: "admin" }, error: null });
    mount();
    expect(await screen.findByText("Admin panel")).toBeInTheDocument();
    expect(mocks.from).toHaveBeenCalledWith("user_roles");
    expect(mocks.eq).toHaveBeenCalledWith("user_id", "synthetic-admin");
    expect(mocks.eq).toHaveBeenCalledWith("role", "admin");
  });
  it("does not trust an editable profile role", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    mount();
    expect(await screen.findByText("Dashboard redirect")).toBeInTheDocument();
    expect(screen.queryByText("Admin panel")).toBeNull();
  });
  it("fails closed when role lookup fails", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: new Error("Synthetic outage") });
    mount();
    expect(await screen.findByText("Dashboard redirect")).toBeInTheDocument();
  });
  it("redirects signed-out users without querying roles", async () => {
    mocks.auth.mockReturnValue({ user: null, loading: false });
    mount();
    expect(await screen.findByText("Sign in")).toBeInTheDocument();
    expect(mocks.from).not.toHaveBeenCalled();
  });
});