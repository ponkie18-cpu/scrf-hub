import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type Status = "PASS" | "FAIL" | "PARTIAL" | "FIXED";

interface TestStep {
  step: string;
  assertion: string;
  status: Status;
  notes: string;
}

interface Journey {
  id: string;
  title: string;
  persona: string;
  domain: string;
  steps: TestStep[];
}

const StatusBadge = ({ status }: { status: Status }) => {
  const config = {
    PASS: "bg-green-100 text-green-700 border-green-200",
    FAIL: "bg-red-100 text-red-700 border-red-200",
    PARTIAL: "bg-amber-100 text-amber-700 border-amber-200",
    FIXED: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return <Badge variant="outline" className={config[status]}>{status}</Badge>;
};

const journeys: Journey[] = [
  {
    id: "3.1", title: "SPOF Finder", persona: "Thandi", domain: "Operational",
    steps: [
      { step: "Change answer after selection", assertion: "Answer changes handled without form reset", status: "PASS", notes: "State updates granularly via setNewSpof spread" },
      { step: "Auto-save every 30s", assertion: "Form auto-saves progress to localStorage", status: "FIXED", notes: "Added 30s auto-save interval with localStorage persistence" },
      { step: "Leave question blank", assertion: "Platform handles blank/skipped questions", status: "PASS", notes: "Mitigation field is optional, add button requires name+type+process" },
      { step: "Skipped questions flagged", assertion: "Skipped questions are flagged, not silently ignored", status: "PARTIAL", notes: "Empty mitigation field is visible but not explicitly flagged with a warning" },
      { step: "Heat map with 4 SPOFs", assertion: "Heat map renders correctly with 4 items", status: "PASS", notes: "ScatterChart renders all items with color-coded cells" },
      { step: "SPOFs ranked by impact", assertion: "SPOFs are ranked by impact, not entry order", status: "PASS", notes: "rankedSpofs.sort by impactScore descending" },
      { step: "AI mitigation cards generated", assertion: "AI mitigation cards for top 3 SPOFs", status: "PASS", notes: "scrf-agent returns rankedSpofs with rootCause + mitigationOptions" },
      { step: "Mitigation card content", assertion: "Root cause, 3 options, effort/cost band", status: "PASS", notes: "MitigationOption interface enforces action, effort, costBand" },
      { step: "Generate Action Items per SPOF", assertion: "3 SMART action items appear in Action Center", status: "FIXED", notes: "Added 'Generate Actions' button per SPOF that inserts into action_items with 30-day due date and SPOF Finder tag" },
      { step: "Action items due date", assertion: "Default 30 days from today", status: "FIXED", notes: "Due date set via Date.now() + 30 * 86400000" },
      { step: "Action items tagged source", assertion: "Tagged 'SPOF Finder' as source", status: "FIXED", notes: "Description includes [SPOF Finder] prefix" },
      { step: "Return and update to Resolved", assertion: "Score updates to reflect resolved SPOF", status: "PASS", notes: "User can edit SPOFs and re-run; new assessment is saved alongside history" },
      { step: "Historical score preserved", assertion: "Historical score is preserved (not overwritten)", status: "PASS", notes: "score_history table appends, doesn't update" },
      { step: "Dashboard sparkline improvement", assertion: "Sparkline shows improvement trend", status: "PASS", notes: "ResilienceScore uses score_history for sparkline" },
    ],
  },
  {
    id: "3.2", title: "Process Documentation Builder", persona: "Dr. Ndlovu", domain: "Operational",
    steps: [
      { step: "8-step SOP creation", assertion: "Builder handles all 8 steps without UI degradation", status: "PASS", notes: "Dynamic step list via addStep(); no limit on steps" },
      { step: "Decision point branching", assertion: "Decision points render correctly", status: "FAIL", notes: "Builder has text-only steps — no decision-point/branch UI. Steps are linear only" },
      { step: "AI compliance checkpoints", assertion: "AI suggests compliance checkpoints for medical", status: "FAIL", notes: "No AI integration in Process Doc Builder — it's a manual template builder" },
      { step: "PDF export", assertion: "PDF well-formatted with practice name", status: "FAIL", notes: "Download SOP as PDF button exists but has no implementation behind it" },
      { step: "AI compliance notes in PDF", assertion: "AI notes as callout boxes", status: "FAIL", notes: "No AI analysis connected to this tool" },
      { step: "Export under 30s", assertion: "Export completes in under 30 seconds", status: "FAIL", notes: "Export not functional" },
    ],
  },
  {
    id: "3.3", title: "Financial Health Scorecard", persona: "Nomsa", domain: "Financial",
    steps: [
      { step: "Anomaly detection (monthly vs annual)", assertion: "Platform detects anomaly and prompts correction", status: "FAIL", notes: "No input validation/anomaly detection — scorecard uses multiple-choice questions, not raw financial inputs" },
      { step: "Correct without data loss", assertion: "Can correct without losing other data", status: "PASS", notes: "Answers stored in state map; changing one doesn't affect others" },
      { step: "Peer benchmarking panel", assertion: "Score vs retail industry median shown", status: "PASS", notes: "Fetches from industry_benchmarks table with industry/size matching" },
      { step: "Below-median communicated with empathy", assertion: "Not alarmist messaging", status: "PASS", notes: "Uses 'Needs Attention' not 'DANGER'. AI narrative in plain English" },
      { step: "AI narrative plain English", assertion: "No undefined financial jargon", status: "PASS", notes: "AI executive narrative generated per category" },
      { step: "90-day improvement roadmap", assertion: "Generated with 3 specific actions", status: "PASS", notes: "aiAnalysis.roadmap with metric/action/target/timeframe" },
      { step: "Score trend on retake", assertion: "Sparkline shows both data points", status: "PASS", notes: "score_history table records each assessment" },
      { step: "Improvement delta highlighted", assertion: "Score improved by X points message", status: "PARTIAL", notes: "Dashboard shows trend direction but no explicit delta message on the scorecard itself" },
      { step: "Agent congratulations", assertion: "Personalised congratulations + next focus area", status: "PARTIAL", notes: "AI narrative updates but doesn't explicitly congratulate improvement" },
    ],
  },
  {
    id: "3.4", title: "Cash Flow Stress Test", persona: "Sipho", domain: "Financial",
    steps: [
      { step: "3 simultaneous scenarios", assertion: "Comparative waterfall chart renders all 3", status: "PASS", notes: "Up to 3 scenarios supported with BarChart comparison" },
      { step: "Loss aversion framing", assertion: "Loss converted to meaningful equivalents", status: "PASS", notes: "LossAversionCalculator shows rent-months equivalent" },
      { step: "Cost of Inaction compounding", assertion: "Shows compounding loss at 3, 6, 12 months", status: "PARTIAL", notes: "6-month projection shown; no explicit 12-month compounding view" },
      { step: "Scenario-specific mitigation", assertion: "Agent recommends per-scenario mitigation", status: "PASS", notes: "AI recommendations tagged by category and urgency" },
      { step: "PDF export investor-grade", assertion: "PDF clean layout, charts, executive summary", status: "FAIL", notes: "No PDF export button exists on Cash Flow Stress Test" },
      { step: "No raw DB IDs in PDF", assertion: "No internal references visible", status: "FAIL", notes: "PDF export not implemented" },
    ],
  },
  {
    id: "3.5", title: "Regulatory Tracker", persona: "Dr. Ndlovu", domain: "Compliance",
    steps: [
      { step: "Industry-filtered alerts", assertion: "Alerts filtered to healthcare", status: "PASS", notes: "Filter by profile industry_code with fallback" },
      { step: "Effective dates and urgency", assertion: "Alerts include dates and urgency", status: "PASS", notes: "effective_date displayed; impact badge (high/medium/low)" },
      { step: "AI summary under 150 words", assertion: "Plain English AI summary per alert", status: "PASS", notes: "ai_summary field rendered in styled callout" },
      { step: "Local Intelligence disclaimer", assertion: "Prominent disclaimer visible", status: "PASS", notes: "LocalDisclaimer component + per-card footnote" },
      { step: "Mark as Reviewed → Completed section", assertion: "Alert moves to Completed, not deleted", status: "FIXED", notes: "Separated pending/reviewed into distinct sections with headers" },
      { step: "Audit trail logging", assertion: "Review logged to audit_trail with timestamp", status: "PASS", notes: "Inserts into audit_trail with reviewed_at metadata" },
      { step: "History preserved", assertion: "Review doesn't remove from compliance history", status: "PASS", notes: "Reviewed items shown in 'Reviewed & Actioned' section" },
      { step: "60-day history retrieval", assertion: "Full compliance review history retrievable", status: "PASS", notes: "audit_trail records persist indefinitely" },
      { step: "Who/when tracking", assertion: "Shows reviewer name/ID and timestamp", status: "PARTIAL", notes: "User ID stored in audit_trail; name not displayed in UI" },
    ],
  },
  {
    id: "3.6", title: "Contract Risk Checker / Clause Analyser", persona: "Thandi", domain: "Compliance",
    steps: [
      { step: "Contract text analysis", assertion: "AI identifies risk clauses", status: "PASS", notes: "ContractClauseAnalyser calls contract-analyser edge function with structured tool calling" },
      { step: "Risk table display", assertion: "Shows clause excerpt, risk level, recommendation", status: "PASS", notes: "Table with expandable rows showing clauseTitle, riskLevel badge, recommendation" },
      { step: "Free-tier 3-clause limit", assertion: "Free tier shows first 3 clauses + upgrade prompt", status: "PASS", notes: "maxClauses=3 for free; info banner with 'Upgrade to Pro' messaging" },
      { step: "Upgrade prompt contextual", assertion: "Contextual upgrade message", status: "PASS", notes: "Shows 'Free tier shows up to 3 clauses. Upgrade to Pro for full analysis'" },
      { step: "Disclaimer before AI analysis", assertion: "Prominent disclaimer displayed", status: "PASS", notes: "Legal disclaimer and LocalDisclaimer both rendered" },
      { step: "Construction-relevant clauses", assertion: "AI identifies construction-relevant risks", status: "PASS", notes: "AI model contextualises by contract content, not pre-filtered by industry" },
    ],
  },
  {
    id: "3.7", title: "Cyber Resilience Scorecard", persona: "Sipho", domain: "Strategic",
    steps: [
      { step: "Priority matrix 2x2 grid", assertion: "All improvement items in quadrants", status: "PASS", notes: "Quick Wins / Major Projects / Fill-Ins / Consider Later grid" },
      { step: "Quick wins highlighted", assertion: "Low effort, high impact clearly highlighted", status: "PASS", notes: "Green border + Zap icon on Quick Wins quadrant" },
      { step: "3 threat simulation cards", assertion: "Generated for user's profile", status: "PASS", notes: "Phishing, Ransomware, Credential Compromise with personalised narratives" },
      { step: "Cost estimate by business size", assertion: "Relevant to business size", status: "PASS", notes: "REVENUE_ESTIMATES keyed by business size from profile" },
      { step: "Schedule reassessment", assertion: "Reminder set for 90 days and stored", status: "FIXED", notes: "Changed from 30 to 90 days; inserts action_item" },
    ],
  },
  {
    id: "3.8", title: "Nash Equilibrium Simulator", persona: "Sipho", domain: "Strategic",
    steps: [
      { step: "Payoff matrix renders", assertion: "4-cell payoff matrix correct", status: "PASS", notes: "Table renders yourStrategies × competitorStrategies with payoff values" },
      { step: "Nash Equilibrium highlighted", assertion: "NE clearly highlighted", status: "PASS", notes: "cell.isNashEquilibrium triggers ring-2 ring-primary styling + NE badge" },
      { step: "Best Reply recommendation", assertion: "Best Reply with reasoning", status: "PASS", notes: "bestReply.strategy + reasoning + confidence displayed" },
      { step: "Collusion warning/guardrail", assertion: "Displayed on output", status: "PASS", notes: "complianceNote always rendered; riskWarning conditionally shown" },
      { step: "What-If toggle", assertion: "Payoff matrix updates dynamically", status: "FAIL", notes: "No What-If toggle — user must click 'Run Another Simulation' to reset entirely" },
      { step: "New equilibrium within 10s", assertion: "Calculated within 10 seconds", status: "PASS", notes: "AI response typically under 10s" },
    ],
  },
  {
    id: "3.9", title: "Cross-Tool Data Flow Synthesis", persona: "Dr. Ndlovu", domain: "Cross-Domain",
    steps: [
      { step: "Resilience Radar all 4 domains", assertion: "All 4 domain scores populated", status: "PASS", notes: "ResilienceRadar renders from domainScores Record<string, number|null>" },
      { step: "Daily Intelligence Briefing", assertion: "Reflects insights from all 4 domains", status: "PASS", notes: "DailyBriefing component passes domain_scores to scrf-agent" },
      { step: "Agent cross-domain synthesis", assertion: "Agent synthesises all 4 domains on query", status: "PASS", notes: "Context builder injects all domain scores into agent prompt" },
      { step: "Quarterly Resilience Summary PDF", assertion: "PDF contains all 4 domains with actual scores", status: "PARTIAL", notes: "Resilience Audit exports as .txt not PDF; scores are real but format is plain text" },
      { step: "Weakest domain as top priority", assertion: "Audit agent identifies weakest domain", status: "PASS", notes: "ResilienceAuditAgent analyses domainScores and generates findings" },
    ],
  },
];

const getStatusIcon = (status: Status) => {
  switch (status) {
    case "PASS": return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "FAIL": return <XCircle className="h-4 w-4 text-red-600" />;
    case "PARTIAL": return <AlertTriangle className="h-4 w-4 text-amber-600" />;
    case "FIXED": return <CheckCircle className="h-4 w-4 text-blue-600" />;
  }
};

export default function ToolJourneyTestReport() {
  const navigate = useNavigate();

  const allSteps = journeys.flatMap(j => j.steps);
  const passed = allSteps.filter(s => s.status === "PASS" || s.status === "FIXED").length;
  const failed = allSteps.filter(s => s.status === "FAIL").length;
  const partial = allSteps.filter(s => s.status === "PARTIAL").length;
  const passRate = Math.round((passed / allSteps.length) * 100);

  const domainStats = (domain: string) => {
    const steps = journeys.filter(j => j.domain === domain).flatMap(j => j.steps);
    const p = steps.filter(s => s.status === "PASS" || s.status === "FIXED").length;
    return { total: steps.length, passed: p, rate: steps.length ? Math.round((p / steps.length) * 100) : 0 };
  };

  const personaStats = (persona: string) => {
    const steps = journeys.filter(j => j.persona === persona).flatMap(j => j.steps);
    const p = steps.filter(s => s.status === "PASS" || s.status === "FIXED").length;
    return { total: steps.length, passed: p, rate: steps.length ? Math.round((p / steps.length) * 100) : 0 };
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Tool Journey Test Report</h1>
            <p className="text-sm text-muted-foreground">End-to-end QA across all 4 risk domains — 9 tool journeys, {allSteps.length} assertions</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{passRate}%</p>
              <p className="text-xs text-muted-foreground">Overall Pass Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{passed}</p>
              <p className="text-xs text-muted-foreground">Passed / Fixed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{failed}</p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-600">{partial}</p>
              <p className="text-xs text-muted-foreground">Partial</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{journeys.length}</p>
              <p className="text-xs text-muted-foreground">Journeys Tested</p>
            </CardContent>
          </Card>
        </div>

        {/* Domain & Persona Pass Rates */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pass Rate by Domain</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {["Operational", "Financial", "Compliance", "Strategic", "Cross-Domain"].map(d => {
                const s = domainStats(d);
                return (
                  <div key={d} className="flex items-center justify-between text-sm">
                    <span>{d}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{s.passed}/{s.total}</span>
                      <Badge variant="outline" className={s.rate >= 80 ? "bg-green-100 text-green-700" : s.rate >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}>
                        {s.rate}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pass Rate by Persona</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {["Thandi", "Dr. Ndlovu", "Nomsa", "Sipho"].map(p => {
                const s = personaStats(p);
                return (
                  <div key={p} className="flex items-center justify-between text-sm">
                    <span>{p}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{s.passed}/{s.total}</span>
                      <Badge variant="outline" className={s.rate >= 80 ? "bg-green-100 text-green-700" : s.rate >= 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}>
                        {s.rate}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Journeys */}
        <Tabs defaultValue="3.1">
          <TabsList className="flex flex-wrap h-auto gap-1">
            {journeys.map(j => {
              const jp = j.steps.filter(s => s.status === "PASS" || s.status === "FIXED").length;
              const jr = Math.round((jp / j.steps.length) * 100);
              return (
                <TabsTrigger key={j.id} value={j.id} className="text-xs">
                  {j.id} {j.title.split(" ").slice(0, 2).join(" ")} ({jr}%)
                </TabsTrigger>
              );
            })}
          </TabsList>

          {journeys.map(j => (
            <TabsContent key={j.id} value={j.id}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Journey {j.id} — {j.title}</CardTitle>
                  <CardDescription>Persona: {j.persona} | Domain: {j.domain}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Step</TableHead>
                        <TableHead>Assertion</TableHead>
                        <TableHead className="w-[90px]">Status</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {j.steps.map((step, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm font-medium">{step.step}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{step.assertion}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(step.status)}
                              <StatusBadge status={step.status} />
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[300px]">{step.notes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Failures Detail */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Failed Assertions — Remediation Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Journey</TableHead>
                  <TableHead>Step</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Root Cause</TableHead>
                  <TableHead>Suggested Fix</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">3.2 Process Doc Builder</TableCell>
                  <TableCell>Decision point branching</TableCell>
                  <TableCell><Badge variant="outline" className="bg-amber-100 text-amber-700">MEDIUM</Badge></TableCell>
                  <TableCell className="text-xs">Builder only supports linear steps, no if/then branching</TableCell>
                  <TableCell className="text-xs">Add a 'step type' selector (Action / Decision) with conditional branch fields</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">3.2 Process Doc Builder</TableCell>
                  <TableCell>AI compliance checkpoints</TableCell>
                  <TableCell><Badge variant="outline" className="bg-amber-100 text-amber-700">MEDIUM</Badge></TableCell>
                  <TableCell className="text-xs">No AI integration in this tool</TableCell>
                  <TableCell className="text-xs">Add scrf-agent call with process details for industry-specific compliance suggestions</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">3.2 Process Doc Builder</TableCell>
                  <TableCell>PDF export</TableCell>
                  <TableCell><Badge variant="outline" className="bg-red-100 text-red-700">HIGH</Badge></TableCell>
                  <TableCell className="text-xs">Button exists but onClick has no implementation</TableCell>
                  <TableCell className="text-xs">Connect to existing generatePDFReport() utility from lib/pdfExport.ts</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">3.3 Financial Health</TableCell>
                  <TableCell>Anomaly detection</TableCell>
                  <TableCell><Badge variant="outline" className="bg-muted text-muted-foreground">LOW</Badge></TableCell>
                  <TableCell className="text-xs">Scorecard uses multiple-choice, not raw financial inputs — anomaly detection not applicable</TableCell>
                  <TableCell className="text-xs">N/A — design decision; scorecard intentionally avoids raw financial input</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">3.4 Cash Flow Stress Test</TableCell>
                  <TableCell>PDF export</TableCell>
                  <TableCell><Badge variant="outline" className="bg-red-100 text-red-700">HIGH</Badge></TableCell>
                  <TableCell className="text-xs">No export functionality exists</TableCell>
                  <TableCell className="text-xs">Add PDFExportButton with scenario results, waterfall chart screenshot, and AI recommendations</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">3.8 Nash Simulator</TableCell>
                  <TableCell>What-If toggle</TableCell>
                  <TableCell><Badge variant="outline" className="bg-amber-100 text-amber-700">MEDIUM</Badge></TableCell>
                  <TableCell className="text-xs">No strategy-switch capability without full reset</TableCell>
                  <TableCell className="text-xs">Add 'Change Strategy' button on results page that preserves competitors and re-runs with new strategy</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Metrics Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">QA Metrics vs Thresholds</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Actual</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { metric: "Form auto-save reliability", target: "Saves every 30s, no data loss", actual: "Implemented — localStorage every 30s", status: "PASS" as Status },
                  { metric: "AI mitigation card generation", target: "Top 3 SPOFs get cards", actual: "All ranked SPOFs get cards (Pro)", status: "PASS" as Status },
                  { metric: "Financial anomaly detection", target: "Flags plausible input errors", actual: "N/A — uses multiple-choice format", status: "PARTIAL" as Status },
                  { metric: "Cross-tool synthesis accuracy", target: "All 4 domains in summary", actual: "All 4 reflected via context builder", status: "PASS" as Status },
                  { metric: "PDF export quality", target: "Investor-grade, no raw IDs", actual: "Process Doc + Cash Flow exports missing", status: "FAIL" as Status },
                  { metric: "Game theory payoff matrix", target: "Renders and updates within 10s", actual: "Renders correctly; no dynamic re-run", status: "PARTIAL" as Status },
                ].map((m, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm">{m.metric}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.target}</TableCell>
                    <TableCell className="text-sm">{m.actual}</TableCell>
                    <TableCell><StatusBadge status={m.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
