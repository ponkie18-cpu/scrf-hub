import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileText, TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";

const DOMAINS = [
  { key: "fais_financial_conduct", label: "Financial Conduct & FAIS" },
  { key: "popia", label: "POPIA" },
  { key: "cipc_companies_act", label: "CIPC / Companies Act" },
  { key: "labour_bcea", label: "Labour / BCEA" },
  { key: "fais_financial", label: "FAIS / Financial" },
];

function getThresholdColor(score: number): "destructive" | "default" | "secondary" {
  if (score < 3.5) return "destructive";
  if (score < 4.0) return "default";
  return "secondary";
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "improving") return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === "declining") return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

export default function QuarterlyReport() {
  const queryClient = useQueryClient();

  const { data: reports, isLoading } = useQuery({
    queryKey: ["quarterly-reports"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("quarterly_accuracy_reports")
        .select("*")
        .order("generated_at", { ascending: false });
      return data || [];
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ["all-reviews-for-report"],
    queryFn: async () => {
      const { data } = await supabase.from("expert_reviews").select("*");
      return data || [];
    },
  });

  const { data: corrections } = useQuery({
    queryKey: ["all-corrections-for-report"],
    queryFn: async () => {
      const { data } = await supabase.from("knowledge_corrections").select("*");
      return data || [];
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const now = new Date();
      const q = Math.ceil((now.getMonth() + 1) / 3);
      const quarter = `${now.getFullYear()}-Q${q}`;

      const domainScores = DOMAINS.map((d) => {
        const domainRevs = (reviews || []).filter((r: any) => r.reviewer_domain === d.key);
        const avg = (field: string) =>
          domainRevs.length ? Math.round(domainRevs.reduce((s: number, r: any) => s + (r[field] || 0), 0) / domainRevs.length * 10) / 10 : 0;
        return {
          domain: d.key,
          label: d.label,
          accuracy: avg("accuracy_score"),
          compliance: avg("sa_compliance_score"),
          completeness: avg("completeness_score"),
          accessibility: avg("sme_accessibility_score"),
          reviewCount: domainRevs.length,
          harmfulCount: domainRevs.filter((r: any) => r.is_advice_harmful).length,
          misleadingCount: domainRevs.filter((r: any) => r.is_advice_misleading).length,
        };
      });

      const domainCorrections = DOMAINS.map((d) => {
        const domCorr = (corrections || []).filter((c: any) => c.domain === d.key);
        return {
          domain: d.key,
          label: d.label,
          total: domCorr.length,
          applied: domCorr.filter((c: any) => c.applied_to_system_prompt).length,
          pending: domCorr.filter((c: any) => !c.applied_to_system_prompt).length,
        };
      });

      const correctionTypes = (corrections || []).reduce((acc: any, c: any) => {
        acc[c.correction_type || "unknown"] = (acc[c.correction_type || "unknown"] || 0) + 1;
        return acc;
      }, {});

      const lowestDomains = [...domainScores]
        .filter((d) => d.reviewCount > 0)
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 2);

      const reviewerStats = (reviews || []).reduce((acc: any, r: any) => {
        acc[r.reviewer_name] = (acc[r.reviewer_name] || 0) + 1;
        return acc;
      }, {});

      const reportData = {
        quarter,
        scorecard: domainScores,
        harmfulTotal: domainScores.reduce((s, d) => s + d.harmfulCount, 0),
        misleadingTotal: domainScores.reduce((s, d) => s + d.misleadingCount, 0),
        corrections: domainCorrections,
        correctionTypes,
        totalCorrections: (corrections || []).length,
        priorities: lowestDomains.map((d) => d.label),
        reviewers: Object.entries(reviewerStats).map(([name, count]) => ({ name, count })),
        totalReviews: (reviews || []).length,
      };

      const { error } = await (supabase as any).from("quarterly_accuracy_reports").insert({
        quarter,
        report_data: reportData,
        generated_by: "admin",
      });
      if (error) throw error;
      return reportData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quarterly-reports"] });
      toast.success("Quarterly report generated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const latestReport = reports?.[0];
  const reportData = latestReport?.report_data as any;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Quarterly Content Accuracy Reports</h2>
        </div>
        <Button onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {generateMutation.isPending ? "Generating..." : "Generate Report"}
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading...</p>}

      {!reportData && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No quarterly reports yet. Click "Generate Report" to create one.
          </CardContent>
        </Card>
      )}

      {reportData && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                A. Accuracy Scorecard — {reportData.quarter}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Domain</th>
                      <th className="text-center py-2">Accuracy</th>
                      <th className="text-center py-2">SA Compliance</th>
                      <th className="text-center py-2">Completeness</th>
                      <th className="text-center py-2">Accessibility</th>
                      <th className="text-center py-2">Reviews</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.scorecard?.map((d: any) => (
                      <tr key={d.domain} className="border-b">
                        <td className="py-2 font-medium">{d.label}</td>
                        <td className="text-center py-2">
                          <Badge variant={getThresholdColor(d.accuracy)}>{d.accuracy.toFixed(1)}</Badge>
                        </td>
                        <td className="text-center py-2">
                          <Badge variant={getThresholdColor(d.compliance)}>{d.compliance.toFixed(1)}</Badge>
                        </td>
                        <td className="text-center py-2">
                          <Badge variant={getThresholdColor(d.completeness)}>{d.completeness.toFixed(1)}</Badge>
                        </td>
                        <td className="text-center py-2">
                          <Badge variant={getThresholdColor(d.accessibility)}>{d.accessibility.toFixed(1)}</Badge>
                        </td>
                        <td className="text-center py-2 text-muted-foreground">{d.reviewCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">B. Harmful Response Count</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Harmful flagged</span>
                    <Badge variant={reportData.harmfulTotal > 0 ? "destructive" : "secondary"}>
                      {reportData.harmfulTotal}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Misleading flagged</span>
                    <Badge variant={reportData.misleadingTotal > 0 ? "destructive" : "secondary"}>
                      {reportData.misleadingTotal}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">E. Knowledge Library Stats</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total corrections</span>
                    <Badge variant="secondary">{reportData.totalCorrections}</Badge>
                  </div>
                  {reportData.corrections?.map((c: any) => (
                    c.total > 0 && (
                      <div key={c.domain} className="flex justify-between text-sm">
                        <span>{c.label}</span>
                        <span className="text-muted-foreground">{c.applied} applied / {c.pending} pending</span>
                      </div>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">F. Next Quarter Priorities</CardTitle></CardHeader>
            <CardContent>
              {reportData.priorities?.length > 0 ? (
                <div className="space-y-2">
                  {reportData.priorities.map((p: string, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <Badge variant="destructive">Priority {i + 1}</Badge>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No data available</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">G. Expert Reviewer Acknowledgement</CardTitle></CardHeader>
            <CardContent>
              {reportData.reviewers?.length > 0 ? (
                <div className="space-y-2">
                  {reportData.reviewers.map((r: any, i: number) => (
                    <div key={i} className="flex justify-between">
                      <span className="font-medium">{r.name}</span>
                      <Badge variant="outline">{r.count} reviews</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No reviewers yet</p>
              )}
            </CardContent>
          </Card>

          {/* Past Reports */}
          {(reports?.length || 0) > 1 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Past Reports</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reports?.slice(1).map((r: any) => (
                    <div key={r.id} className="flex justify-between p-2 bg-muted/30 rounded">
                      <span className="font-medium">{r.report_data?.quarter || r.quarter}</span>
                      <span className="text-xs text-muted-foreground">
                        Generated {new Date(r.generated_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
