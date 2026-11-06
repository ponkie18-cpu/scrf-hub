import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface RequireRoleProps {
  role: "admin";
  children: React.ReactNode;
}

/**
 * Route guard that checks the authenticated user's role before rendering.
 * Redirects unauthenticated users to /auth, and unauthorised users to /dashboard.
 *
 * Usage:
 *   <Route path="/admin/..." element={<RequireRole role="admin"><AdminPage /></RequireRole>} />
 */
export default function RequireRole({ role, children }: RequireRoleProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check the role field on the user's profile row.
  // Falls back to blocking access if the field is absent.
  const userRole = (profile as any)?.role;
  if (userRole !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
