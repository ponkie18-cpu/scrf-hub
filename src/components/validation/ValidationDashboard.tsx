import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Target, ShieldAlert } from "lucide-react";

const DOMAINS = [
  { key: "fais_financial_conduct", label: "Financial Conduct & FAIS" },
  { key: "popia", label: "POPIA" },
  { key: "cipc_companies_act", label: "CIPC / Companies Act" },
  { key: "labour_bcea", label: "Labour / BCEA" },
  { key: "fais_financial", label: "FAIS / Financial" },
];

const IMPROVEMENT_TARGET = 4.0;
const LAUNCH_MINIMUM = 3.0;

export default function ValidationDashboard() {
  const { data: questions } = useQuery({
    queryKey: ["validation-questions"],
    queryFn: async () => {
      const { data } = await supabase.from("validation_questions").select("id, domain, is_active");
      return data || [];
    },
  });

  const { data: responses } = useQuery({
    queryKey: ["validation-responses"],
    queryFn: async () => {
      const { data } = await supabase.from("validation_responses").select("id, question_id");
      return data || [];
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["expert-reviews"],
    queryFn: async () => {
      const { data } = await supabase.from("expert_reviews").select("*");
      return data || [];
    },
  });

  const { data: corrections } = useQuery({
    queryKey: ["knowledge-corrections"],
    queryFn: async () => {
      const { data } = await supabase.from("knowledge_corrections").select("*");
      return data || [];
    },
  });

  const { data: escalations } = useQuery({
    queryKey: ["response-escalations"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("response_escalations").select("*");
      return data || [];
    },
  });

  const domainCoverage = DOMAINS.map((d) => {
    const domainQs = (questions || []).filter((q: any) => q.domain === d.key && q.is_active);
    const domainResps = (responses || []).filter((r: any) =>
      domainQs.some((q: any) => q.id === r.question_id)
    );
    const reviewedResps = (reviews || []).filter(
      (rev: any) => rev.review_status !== "pending" && domainResps.some((r: any) => r.id === rev.response_id)
    );
    const pct = domainQs.length > 0 ? Math.round((reviewedResps.length / domainQs.length) * 100) : 0;
    return { ...d, total: domainQs.length, reviewed: reviewedResps.length, pct };
  });

  const domainScores = DOMAINS.map((d) => {
    const domainReviews = (reviews || []).filter((r: any) => r.reviewer_domain === d.key);
    if (!domainReviews.length) return { ...d, accuracy: 0, compliance: 0, completeness: 0, accessibility: 0, count: 0 };
    const avg = (field: string) => Math.round(domainReviews.reduce((s: number, r: any) => s + (r[field] || 0), 0) / domainReviews.length * 10) / 10;
    return { ...d, accuracy: avg("accuracy_score"), compliance: avg("sa_compliance_score"), completeness: avg("completeness_score"), accessibility: avg("sme_accessibility_score"), count: domainReviews.length };
  });

  const flaggedCount = (reviews || []).filter((r: any) => r.is_advice_harmful || r.is_advice_misleading).length;
  const appliedCount = (corrections || []).filter((c: any) => c.applied_to_system_prompt).length;
  const pendingCount = (corrections || []).filter((c: any) => !c.applied_to_system_prompt).length;
  const unresolvedEscalations = (escalations || []).filter((e: any) => !e.resolved).length;

  // Launch readiness check
  const launchBlockers = domainScores.filter(
    (d) => d.count > 0 && (d.accuracy < LAUNCH_MINIMUM || d.compliance < LAUNCH_MINIMUM)
  );

  return (
    <div className="space-y-6">
      {/* Launch Readiness Banner */}
      {launchBlockers.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Launch Blockers Detected</p>
                <p className="text-sm text-muted-foreground">
                  {launchBlockers.map(d => d.label).join(", ")} — scoring below 3.0 minimum on Accuracy or SA Compliance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{(questions || []).length}</p>
                <p className="text-sm text-muted-foreground">Questions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{flaggedCount}</p>
                <p className="text-sm text-muted-foreground">Flagged</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{unresolvedEscalations}</p>
                <p className="text-sm text-muted-foreground">Escalations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{appliedCount}</p>
                <p className="text-sm text-muted-foreground">Applied</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Domain Coverage */}
      <Card>
        <CardHeader><CardTitle>Validation Coverage by Domain</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {domainCoverage.map((d) => (
            <div key={d.key} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{d.label}</span>
                <span className="text-muted-foreground">{d.reviewed}/{d.total} reviewed ({d.pct}%)</span>
              </div>
              <Progress value={d.pct} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Domain Scores with Thresholds */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Average Scores by Domain</CardTitle>
            <div className="flex items-center gap-2 text-xs">
              <Target className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Target: ≥{IMPROVEMENT_TARGET} | Launch min: ≥{LAUNCH_MINIMUM}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Domain</th>
                  <th className="text-center py-2 font-medium">Accuracy</th>
                  <th className="text-center py-2 font-medium">SA Compliance</th>
                  <th className="text-center py-2 font-medium">Completeness</th>
                  <th className="text-center py-2 font-medium">Accessibility</th>
                  <th className="text-center py-2 font-medium">Reviews</th>
                  <th className="text-center py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {domainScores.map((d) => {
                  const meetsTarget = d.accuracy >= IMPROVEMENT_TARGET && d.compliance >= IMPROVEMENT_TARGET;
                  const meetsLaunch = d.accuracy >= LAUNCH_MINIMUM && d.compliance >= LAUNCH_MINIMUM;
                  return (
                    <tr key={d.key} className="border-b">
                      <td className="py-2 font-medium">{d.label}</td>
                      <td className="text-center py-2"><ScoreBadge score={d.accuracy} /></td>
                      <td className="text-center py-2"><ScoreBadge score={d.compliance} /></td>
                      <td className="text-center py-2"><ScoreBadge score={d.completeness} /></td>
                      <td className="text-center py-2"><ScoreBadge score={d.accessibility} /></td>
                      <td className="text-center py-2 text-muted-foreground">{d.count}</td>
                      <td className="text-center py-2">
                        {d.count === 0 ? (
                          <Badge variant="outline">No data</Badge>
                        ) : meetsTarget ? (
                          <Badge variant="secondary" className="bg-primary/20 text-primary">✓ Target</Badge>
                        ) : meetsLaunch ? (
                          <Badge variant="default">Launch OK</Badge>
                        ) : (
                          <Badge variant="destructive">BLOCKER</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  if (!score) return <span className="text-muted-foreground">—</span>;
  const variant = score >= 4 ? "secondary" : score >= 3 ? "default" : "destructive";
  return <Badge variant={variant}>{score.toFixed(1)}</Badge>;
}
