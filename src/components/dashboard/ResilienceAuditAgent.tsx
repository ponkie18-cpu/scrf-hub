import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardCheck, Loader2, AlertTriangle, CheckCircle2, Shield, TrendingUp,
  Download, RefreshCw, Calendar, ChevronRight, FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { downloadPDF } from "@/lib/pdfExport";

interface AuditFinding {
  domain: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  recommendation: string;
  estimatedEffort: string;
}

interface AuditReport {
  overallGrade: string;
  overallScore: number;
  executiveSummary: string;
  findings: AuditFinding[];
  strengths: string[];
  improvementAreas: string[];
  nextAuditDate: string;
}

interface ResilienceAuditAgentProps {
  domainScores: Record<string, number | null>;
  actionItems: { domain: string; completed: boolean; priority: string; title: string }[];
}

const severityConfig = {
  critical: { color: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle, label: "Critical" },
  high: { color: "bg-orange-100 text-orange-700 border-orange-200", icon: AlertTriangle, label: "High" },
  medium: { color: "bg-amber-100 text-amber-700 border-amber-200", icon: Shield, label: "Medium" },
  low: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle2, label: "Low" },
};

const gradeColors: Record<string, string> = {
  "A+": "text-green-600", A: "text-green-600", "A-": "text-green-600",
  "B+": "text-emerald-600", B: "text-emerald-600", "B-": "text-amber-600",
  "C+": "text-amber-600", C: "text-amber-600", "C-": "text-orange-600",
  D: "text-red-600", F: "text-red-600",
};

export default function ResilienceAuditAgent({ domainScores, actionItems }: ResilienceAuditAgentProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [report, setReport] = useState<AuditReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  const runAudit = useCallback(async () => {
    if (!user) return;
    setIsRunning(true);
    setProgress(10);
    setReport(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      setProgress(30);

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrf-agent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            type: "resilience_audit",
            auditData: {
              domainScores,
              pendingActions: actionItems.filter(a => !a.completed).length,
              completedActions: actionItems.filter(a => a.completed).length,
              highPriorityPending: actionItems.filter(a => !a.completed && a.priority === "high").length,
            },
          }),
        }
      );

      setProgress(70);

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || `Audit failed (${resp.status})`);
      }

      const result = await resp.json();
      setProgress(90);

      // Create remediation action items from critical/high findings
      const criticalFindings = (result.findings || []).filter(
        (f: AuditFinding) => f.severity === "critical" || f.severity === "high"
      );

      for (const finding of criticalFindings.slice(0, 3)) {
        await supabase.from("action_items").insert({
          user_id: user.id,
          domain: finding.domain,
          title: `[Audit] ${finding.title}`,
          description: finding.recommendation,
          priority: finding.severity === "critical" ? "high" : "medium",
          due_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
        });
      }

      setReport(result);
      setProgress(100);

      toast({
        title: "Audit Complete",
        description: `Grade: ${result.overallGrade} — ${criticalFindings.length} critical/high findings`,
      });
    } catch (err) {
      toast({
        title: "Audit Failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  }, [user, domainScores, actionItems, toast]);

  const scheduleMonthlyAudit = async () => {
    if (!user) return;
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    await supabase.from("action_items").insert({
      user_id: user.id,
      domain: "operational",
      title: "Monthly Resilience Audit Due",
      description: "Run your monthly automated resilience audit from the dashboard to track progress and identify new risks.",
      priority: "medium",
      due_date: nextMonth.toISOString().split("T")[0],
    });

    toast({ title: "Scheduled", description: "Monthly audit reminder set for " + nextMonth.toLocaleDateString() });
  };

  const exportReport = () => {
    if (!report) return;
    downloadPDF({
      reportTitle: "Resilience Audit Report",
      reportType: "Resilience Audit",
      score: report.overallScore,
      grade: report.overallGrade,
      completedAt: new Date().toLocaleDateString(),
      sections: [
        {
          title: "Executive Summary",
          items: [{ label: "Summary", value: report.executiveSummary }],
        },
        {
          title: "Strengths",
          items: report.strengths.map(s => ({ label: "✓", value: s, highlight: "success" as const })),
        },
        {
          title: "Improvement Areas",
          items: report.improvementAreas.map(a => ({ label: "⚠", value: a, highlight: "warning" as const })),
        },
        {
          title: `Findings (${report.findings.length})`,
          items: report.findings.map(f => ({
            label: `[${f.severity.toUpperCase()}] ${f.title}`,
            value: `Domain: ${f.domain}\n${f.description}\nRecommendation: ${f.recommendation}\nEffort: ${f.estimatedEffort}`,
            highlight: f.severity === "critical" || f.severity === "high" ? "danger" as const : f.severity === "medium" ? "warning" as const : "success" as const,
          })),
        },
        {
          title: "Next Steps",
          items: [{ label: "Next audit recommended", value: report.nextAuditDate }],
        },
      ],
    }, `Resilience-Audit-${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Resilience Audit Agent</CardTitle>
              <CardDescription>Automated monthly risk audit with AI analysis</CardDescription>
            </div>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20">Pro</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {!report && !isRunning && (
          <div className="text-center py-8 space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <ClipboardCheck className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Run Your Resilience Audit</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                The AI agent analyses your scores, actions, and risk posture across all domains to produce a structured audit report with remediation priorities.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button onClick={runAudit}>
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Run Audit Now
              </Button>
              <Button variant="outline" onClick={scheduleMonthlyAudit}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Monthly
              </Button>
            </div>
          </div>
        )}

        {isRunning && (
          <div className="py-8 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="font-medium">Running audit…</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              {progress < 30 ? "Gathering risk data…" : progress < 70 ? "AI analysis in progress…" : "Generating report…"}
            </p>
          </div>
        )}

        {report && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="findings">
                Findings ({report.findings.length})
              </TabsTrigger>
              <TabsTrigger value="remediation">Remediation</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 pt-4">
              {/* Grade Card */}
              <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <p className={`text-5xl font-bold ${gradeColors[report.overallGrade] || "text-foreground"}`}>
                    {report.overallGrade}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{report.overallScore}/100</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm leading-relaxed">{report.executiveSummary}</p>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Strengths
                  </h4>
                  <ul className="space-y-2">
                    {report.strengths.map((s, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <ChevronRight className="h-3 w-3 mt-0.5 text-green-600 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <h4 className="font-medium text-sm flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-amber-600" />
                    Improvement Areas
                  </h4>
                  <ul className="space-y-2">
                    {report.improvementAreas.map((a, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <ChevronRight className="h-3 w-3 mt-0.5 text-amber-600 shrink-0" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  Next audit recommended: {report.nextAuditDate}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportReport}>
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" onClick={runAudit}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Re-run
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="findings" className="space-y-3 pt-4">
              {report.findings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No findings — excellent resilience posture!</p>
              ) : (
                report.findings.map((finding, i) => {
                  const config = severityConfig[finding.severity];
                  const Icon = config.icon;
                  return (
                    <div key={i} className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium text-sm">{finding.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs capitalize">{finding.domain}</Badge>
                          <Badge className={`text-xs ${config.color}`}>{config.label}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{finding.description}</p>
                      <div className="p-2 bg-muted/50 rounded text-xs">
                        <strong>Recommendation:</strong> {finding.recommendation}
                      </div>
                      <p className="text-xs text-muted-foreground">Estimated effort: {finding.estimatedEffort}</p>
                    </div>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="remediation" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Critical and high-severity findings have been automatically added to your Action Center with 14-day deadlines.
              </p>
              <div className="space-y-2">
                {report.findings
                  .filter(f => f.severity === "critical" || f.severity === "high")
                  .map((f, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{f.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{f.recommendation}</p>
                      </div>
                      <Badge className={severityConfig[f.severity].color}>{f.estimatedEffort}</Badge>
                    </div>
                  ))}
              </div>
              {report.findings.filter(f => f.severity === "critical" || f.severity === "high").length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">No critical or high-severity findings — great job!</p>
                </div>
              )}
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={scheduleMonthlyAudit}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Next Audit
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
