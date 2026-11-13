import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const { user, loading } = useAuth();
  const { data: authorised, isPending: roleLoading } = useQuery({
    queryKey: ["verified-user-role", user?.id, role],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles")
        .select("role").eq("user_id", user!.id).eq("role", role).maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  if (loading || (user && roleLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Presentation guard only: RPCs/RLS enforce the same user_roles authority.
  if (!authorised) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
