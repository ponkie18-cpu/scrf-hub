import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, AlertTriangle, Play } from "lucide-react";

const DOMAINS: Record<string, string> = {
  fais_financial_conduct: "Financial Conduct & FAIS",
  popia: "POPIA",
  cipc_companies_act: "CIPC / Companies Act",
  labour_bcea: "Labour / BCEA",
  fais_financial: "FAIS / Financial",
};

export default function ExpertReviewerDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const { data: reviewer } = useQuery({
    queryKey: ["my-reviewer-profile"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("expert_reviewers")
        .select("*")
        .eq("user_id", user?.id)
        .eq("status", "approved")
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: pendingResponses } = useQuery({
    queryKey: ["reviewer-pending-responses", reviewer?.regulatory_domain],
    queryFn: async () => {
      const { data: responses } = await supabase
        .from("validation_responses")
        .select("id, question_id, validation_questions(domain)")
        .order("response_generated_at", { ascending: false });

      const { data: existingReviews } = await supabase.from("expert_reviews").select("response_id");
      const reviewedIds = new Set((existingReviews || []).map((r: any) => r.response_id));

      return (responses || []).filter((r: any) => {
        if (reviewedIds.has(r.id)) return false;
        if (reviewer?.regulatory_domain && r.validation_questions?.domain !== reviewer.regulatory_domain) return false;
        return true;
      });
    },
    enabled: !!reviewer,
  });

  const { data: myReviews } = useQuery({
    queryKey: ["my-completed-reviews", reviewer?.full_name],
    queryFn: async () => {
      const { data } = await supabase
        .from("expert_reviews")
        .select("id, reviewed_at, accuracy_score, is_advice_harmful")
        .eq("reviewer_name", reviewer?.full_name || "")
        .order("reviewed_at", { ascending: false });
      return data || [];
    },
    enabled: !!reviewer,
  });

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const pendingCount = pendingResponses?.length || 0;
  const estimatedMinutes = pendingCount * 5;
  const harmfulCount = (pendingResponses || []).length; // All need review; harmful ones surface first

  if (!reviewer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-bold">Not Approved Yet</h2>
            <p className="text-muted-foreground">
              Your reviewer registration is pending admin approval. You'll receive an email when approved.
            </p>
            <Button variant="outline" onClick={() => navigate("/expert-review/register")}>
              Register as Reviewer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Expert Reviewer Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {reviewer.full_name} — {DOMAINS[reviewer.regulatory_domain] || reviewer.regulatory_domain}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">Responses Awaiting Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">~{estimatedMinutes} min</p>
                  <p className="text-sm text-muted-foreground">Estimated Review Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{myReviews?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Reviews Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main CTA */}
        {pendingCount > 0 ? (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    You have {pendingCount} responses awaiting your review in {DOMAINS[reviewer.regulatory_domain]}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    This batch takes approximately {estimatedMinutes} minutes to review
                  </p>
                </div>
                <Button size="lg" onClick={() => navigate("/admin/content-validation")}>
                  <Play className="h-5 w-5 mr-2" />
                  Start Reviewing
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              All responses in your domain have been reviewed. Check back when a new validation batch is generated.
            </CardContent>
          </Card>
        )}

        {/* Recent Reviews */}
        {(myReviews?.length || 0) > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Your Recent Reviews</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {myReviews?.slice(0, 10).map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant={r.accuracy_score >= 4 ? "default" : r.accuracy_score >= 3 ? "secondary" : "destructive"}>
                        Accuracy: {r.accuracy_score}
                      </Badge>
                      {r.is_advice_harmful && <Badge variant="destructive">HARMFUL</Badge>}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
