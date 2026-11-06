import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, AlertTriangle, CheckCircle2, DollarSign, ArrowRight, Wallet, Brain, Loader2, Plus, X, Sparkles, FileDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import LossAversionCalculator from "@/components/behavioral/LossAversionCalculator";
import { useAssessmentSave } from "@/hooks/useAssessmentSave";
import { UpgradeGate } from "@/components/tier/UpgradeGate";
import { supabase } from "@/integrations/supabase/client";
import { downloadPDF } from "@/lib/pdfExport";

interface Scenario {
  id: string;
  name: string;
  revenueDropPercent: number;
  paymentDelayDays: number;
  emergencyCapex: number;
}

interface ScenarioResult {
  month: number;
  baseBalance: number;
  [key: string]: number; // dynamic scenario columns
}

interface AIRecommendation {
  category: string;
  action: string;
  impact: string;
  urgency: "immediate" | "short-term" | "medium-term";
}

const SCENARIO_COLORS = ["hsl(var(--destructive))", "hsl(var(--primary))", "hsl(210, 70%, 50%)"];

const createEmptyScenario = (index: number): Scenario => ({
  id: `scenario-${Date.now()}-${index}`,
  name: index === 0 ? "Revenue drops 30%" : index === 1 ? "Key client pays late" : "Emergency capex",
  revenueDropPercent: index === 0 ? 30 : index === 1 ? 10 : 5,
  paymentDelayDays: index === 0 ? 0 : index === 1 ? 60 : 0,
  emergencyCapex: index === 0 ? 0 : index === 1 ? 0 : 50000,
});

const CashFlowStressTest = () => {
  const [currentCash, setCurrentCash] = useState("");
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [monthlyExpenses, setMonthlyExpenses] = useState("");
  const [scenarios, setScenarios] = useState<Scenario[]>([createEmptyScenario(0)]);
  const [results, setResults] = useState<ScenarioResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [aiRecs, setAiRecs] = useState<AIRecommendation[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { saveAssessment, isSaving, savedToDb, reset: resetSave } = useAssessmentSave();

  const addScenario = () => {
    if (scenarios.length < 3) {
      setScenarios([...scenarios, createEmptyScenario(scenarios.length)]);
    }
  };

  const removeScenario = (id: string) => {
    if (scenarios.length > 1) {
      setScenarios(scenarios.filter((s) => s.id !== id));
    }
  };

  const updateScenario = (id: string, field: keyof Scenario, value: string | number) => {
    setScenarios(scenarios.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const runStressTest = () => {
    const cash = parseFloat(currentCash) || 0;
    const revenue = parseFloat(monthlyRevenue) || 0;
    const expenses = parseFloat(monthlyExpenses) || 0;

    const projections: ScenarioResult[] = [];

    for (let month = 1; month <= 6; month++) {
      const row: ScenarioResult = {
        month,
        baseBalance: 0,
      };

      // Base scenario
      const baseBalance = cash + (revenue - expenses) * month;
      row.baseBalance = Math.round(baseBalance);

      // Each stress scenario
      scenarios.forEach((sc, idx) => {
        const revDrop = sc.revenueDropPercent / 100;
        const delayMonths = sc.paymentDelayDays / 30;
        const stressedRevenue = revenue * (1 - revDrop);
        const delayImpact = month === 1 ? revenue * (delayMonths / 2) : 0;
        const capexHit = month === 1 ? sc.emergencyCapex : 0;
        const balance = cash - delayImpact - capexHit + (stressedRevenue - expenses) * month;
        row[`scenario${idx}`] = Math.round(balance);
      });

      projections.push(row);
    }

    setResults(projections);
    setShowResults(true);
  };

  // Fetch AI recommendations when results show
  useEffect(() => {
    if (!showResults || results.length === 0) return;

    const fetchAIRecs = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) return;

      setAiLoading(true);
      try {
        const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrf-agent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.session.access_token}`,
          },
          body: JSON.stringify({
            type: "cashflow_recommendations",
            financialHealthData: {
              currentCash: parseFloat(currentCash),
              monthlyRevenue: parseFloat(monthlyRevenue),
              monthlyExpenses: parseFloat(monthlyExpenses),
              scenarios: scenarios.map((s) => ({
                name: s.name,
                revenueDropPercent: s.revenueDropPercent,
                paymentDelayDays: s.paymentDelayDays,
                emergencyCapex: s.emergencyCapex,
              })),
              worstBalance: Math.min(...results.map((r) => Math.min(...Object.values(r).filter((_, i) => i > 1) as number[]))),
            },
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          setAiRecs(data.recommendations || []);
        }
      } catch (e) {
        console.error("AI recs failed:", e);
      } finally {
        setAiLoading(false);
      }
    };

    fetchAIRecs();
  }, [showResults]);

  // Save assessment
  useEffect(() => {
    if (showResults && results.length > 0 && !savedToDb && !isSaving) {
      const worstBalance = Math.min(
        ...results.flatMap((r) =>
          scenarios.map((_, idx) => r[`scenario${idx}`] as number).filter((v) => v !== undefined)
        )
      );
      const hasNegative = worstBalance < 0;
      const runwayMonths = results.find((r) =>
        scenarios.some((_, idx) => (r[`scenario${idx}`] as number) < 0)
      )?.month || 6;

      const score = hasNegative
        ? Math.max(0, (runwayMonths / 6) * 60)
        : Math.min(100, 60 + (worstBalance / (parseFloat(monthlyExpenses) || 1)) * 10);

      const recommendations = [];
      if (hasNegative) {
        recommendations.push({ title: "Build emergency cash reserve", priority: "high" as const, description: `Runway: ${runwayMonths} months under worst scenario` });
      }
      recommendations.push({ title: "Diversify revenue streams", priority: "medium" as const, description: "Reduce exposure to single-scenario risk" });

      saveAssessment({
        domain: "financial",
        toolId: "cashflow-stress-test",
        answers: { currentCash, monthlyRevenue, monthlyExpenses, scenarios },
        score: Math.round(score),
        confidence: 1.0,
        insights: [`${scenarios.length} scenarios tested`, `Worst balance: R${worstBalance.toLocaleString()}`],
        recommendations,
      });
    }
  }, [showResults, results, savedToDb, isSaving]);

  const getWorstScenarioLoss = () => {
    if (results.length === 0) return 0;
    const worstBalance = Math.min(
      ...results.flatMap((r) =>
        scenarios.map((_, idx) => r[`scenario${idx}`] as number).filter((v) => v !== undefined)
      )
    );
    return worstBalance < 0 ? Math.abs(worstBalance) : 0;
  };

  const hasAnyNegative = results.some((r) =>
    scenarios.some((_, idx) => (r[`scenario${idx}`] as number) < 0)
  );

  const resetForm = () => {
    setCurrentCash("");
    setMonthlyRevenue("");
    setMonthlyExpenses("");
    setScenarios([createEmptyScenario(0)]);
    setResults([]);
    setShowResults(false);
    setAiRecs(null);
    resetSave();
  };

  // Build waterfall chart data
  const waterfallData = results.map((r) => {
    const row: Record<string, string | number> = { name: `M${r.month}`, Base: r.baseBalance };
    scenarios.forEach((sc, idx) => {
      row[sc.name.slice(0, 20)] = r[`scenario${idx}`];
    });
    return row;
  });

  return (
    <UpgradeGate
      toolId="cashflow-stress-test"
      toolName="Test Your Business's Survival"
      toolDescription="Model up to 3 stress scenarios simultaneously with behavioural finance insights."
      features={["Multi-scenario comparison", "Waterfall chart", "Loss aversion analysis", "AI recommendations"]}
    >
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <TrendingDown className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display text-xl">Test Your Business's Survival</CardTitle>
              <CardDescription>Model up to 3 stress scenarios with behavioural finance insights</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!showResults ? (
            <div className="space-y-6">
              {/* Financial Inputs */}
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { id: "currentCash", label: "Current Cash Balance", value: currentCash, set: setCurrentCash, ph: "50000" },
                  { id: "monthlyRevenue", label: "Monthly Revenue", value: monthlyRevenue, set: setMonthlyRevenue, ph: "20000" },
                  { id: "monthlyExpenses", label: "Monthly Expenses", value: monthlyExpenses, set: setMonthlyExpenses, ph: "18000" },
                ].map((f) => (
                  <div key={f.id} className="space-y-2">
                    <Label htmlFor={f.id}>{f.label}</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id={f.id} type="number" placeholder={f.ph} value={f.value} onChange={(e) => f.set(e.target.value)} className="pl-9" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Scenario Builder */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Stress Scenarios</h4>
                  {scenarios.length < 3 && (
                    <Button variant="outline" size="sm" onClick={addScenario}>
                      <Plus className="h-3 w-3 mr-1" /> Add Scenario
                    </Button>
                  )}
                </div>

                {scenarios.map((sc, idx) => (
                  <div key={sc.id} className="p-4 bg-secondary rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SCENARIO_COLORS[idx] }} />
                        <Input
                          value={sc.name}
                          onChange={(e) => updateScenario(sc.id, "name", e.target.value)}
                          className="h-7 text-sm font-medium w-48 bg-background"
                          placeholder="Scenario name"
                        />
                      </div>
                      {scenarios.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeScenario(sc.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Revenue Drop %</Label>
                        <Input type="number" value={sc.revenueDropPercent} onChange={(e) => updateScenario(sc.id, "revenueDropPercent", parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Payment Delay (days)</Label>
                        <Input type="number" value={sc.paymentDelayDays} onChange={(e) => updateScenario(sc.id, "paymentDelayDays", parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Emergency Capex (R)</Label>
                        <Input type="number" value={sc.emergencyCapex} onChange={(e) => updateScenario(sc.id, "emergencyCapex", parseFloat(e.target.value) || 0)} className="h-8 text-sm" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={runStressTest} className="w-full" size="lg" disabled={!currentCash || !monthlyRevenue || !monthlyExpenses}>
                Run Stress Test <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary */}
              <div className={`p-4 rounded-lg flex items-start gap-3 ${hasAnyNegative ? "bg-destructive/10" : "bg-green-500/10"}`}>
                {hasAnyNegative ? (
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                )}
                <div>
                  <p className="font-semibold">
                    {hasAnyNegative
                      ? `Warning: At least one scenario depletes cash within 6 months`
                      : "Your cash position remains healthy across all scenarios"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {scenarios.length} scenario{scenarios.length > 1 ? "s" : ""} compared simultaneously
                  </p>
                </div>
              </div>

              {/* Comparative Waterfall Chart */}
              <div className="space-y-3">
                <h4 className="font-semibold">Comparative 6-Month Waterfall</h4>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={waterfallData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => `R${value.toLocaleString()}`} />
                    <Legend />
                    <Bar dataKey="Base" fill="hsl(var(--muted-foreground) / 0.3)" radius={[3, 3, 0, 0]} />
                    {scenarios.map((sc, idx) => (
                      <Bar key={sc.id} dataKey={sc.name.slice(0, 20)} radius={[3, 3, 0, 0]}>
                        {waterfallData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={(entry[sc.name.slice(0, 20)] as number) < 0 ? "hsl(var(--destructive) / 0.7)" : SCENARIO_COLORS[idx]}
                          />
                        ))}
                      </Bar>
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Enhanced Loss Aversion Calculator */}
              {getWorstScenarioLoss() > 0 && (
                <LossAversionCalculator
                  potentialLoss={getWorstScenarioLoss()}
                  preventionCost={Math.round(getWorstScenarioLoss() * 0.15)}
                  scenarioName="worst-case cash shortfall"
                  monthlyRevenue={parseFloat(monthlyRevenue) || 0}
                  monthlyExpenses={parseFloat(monthlyExpenses) || 0}
                />
              )}

              {/* AI Proactive Recommendations */}
              {aiLoading && (
                <div className="p-6 border rounded-lg flex items-center gap-3 justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Generating AI recommendations...</span>
                </div>
              )}
              {aiRecs && aiRecs.length > 0 && (
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">AI Proactive Recommendations</h4>
                  </div>
                  {aiRecs.map((rec, idx) => (
                    <div key={idx} className="p-3 bg-secondary rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs">{rec.category}</Badge>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          rec.urgency === "immediate" ? "bg-destructive/10 text-destructive"
                            : rec.urgency === "short-term" ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                        }`}>{rec.urgency}</span>
                      </div>
                      <p className="text-sm font-medium mt-1">{rec.action}</p>
                      <p className="text-xs text-muted-foreground mt-1">{rec.impact}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Mental Accounting Context */}
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 flex items-start gap-3">
                <Wallet className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Financial Buffer Account</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Mental Accounting Insight:</strong> Treat your cash reserve as a separate "Financial Buffer Account"—not part of your operating budget. This psychological separation protects it from daily spending temptations.
                  </p>
                </div>
              </div>

              {/* Behavioural Tips */}
              <div className="p-4 bg-secondary rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <h4 className="font-semibold">Behavioral Tips to Extend Your Runway</h4>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• <strong>Create separate accounts:</strong> Physically separate your buffer from operations</li>
                  <li>• <strong>Automate transfers:</strong> "Pay yourself first" by auto-transferring to your buffer</li>
                  <li>• <strong>Frame as insurance:</strong> Think of reserves as "business continuity insurance"</li>
                  <li>• <strong>Set triggers:</strong> Define specific scenarios when you'd use the buffer</li>
                </ul>
              </div>

              {/* PDF Export */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const cash = parseFloat(currentCash) || 0;
                  const rev = parseFloat(monthlyRevenue) || 0;
                  const exp = parseFloat(monthlyExpenses) || 0;
                  downloadPDF({
                    reportTitle: "Cash Flow Stress Test Report",
                    reportType: "Cash Flow Stress Test",
                    score: Math.round(
                      hasAnyNegative
                        ? Math.max(0, ((results.find(r => scenarios.some((_, idx) => (r[`scenario${idx}`] as number) < 0))?.month || 6) / 6) * 60)
                        : Math.min(100, 60 + (Math.min(...results.flatMap(r => scenarios.map((_, idx) => r[`scenario${idx}`] as number).filter(v => v !== undefined))) / (exp || 1)) * 10)
                    ),
                    completedAt: new Date().toLocaleDateString(),
                    sections: [
                      {
                        title: "Financial Inputs",
                        items: [
                          { label: "Current Cash Balance", value: `R${cash.toLocaleString()}` },
                          { label: "Monthly Revenue", value: `R${rev.toLocaleString()}` },
                          { label: "Monthly Expenses", value: `R${exp.toLocaleString()}` },
                        ],
                      },
                      {
                        title: "Stress Scenarios",
                        items: scenarios.map(sc => ({
                          label: sc.name,
                          value: `Revenue drop: ${sc.revenueDropPercent}% | Payment delay: ${sc.paymentDelayDays} days | Emergency capex: R${sc.emergencyCapex.toLocaleString()}`,
                        })),
                      },
                      {
                        title: "6-Month Projections",
                        items: results.map(r => ({
                          label: `Month ${r.month}`,
                          value: [`Base: R${r.baseBalance.toLocaleString()}`, ...scenarios.map((sc, idx) => `${sc.name.slice(0, 20)}: R${(r[`scenario${idx}`] as number).toLocaleString()}`)].join(" | "),
                          highlight: scenarios.some((_, idx) => (r[`scenario${idx}`] as number) < 0) ? "danger" as const : "success" as const,
                        })),
                      },
                      ...(getWorstScenarioLoss() > 0 ? [{
                        title: "Risk Summary",
                        items: [
                          { label: "Worst-Case Shortfall", value: `R${getWorstScenarioLoss().toLocaleString()}`, highlight: "danger" as const },
                          { label: "Status", value: hasAnyNegative ? "Cash depletion risk detected" : "Cash position healthy", highlight: hasAnyNegative ? "danger" as const : "success" as const },
                        ],
                      }] : []),
                      ...(aiRecs && aiRecs.length > 0 ? [{
                        title: "AI Recommendations",
                        items: aiRecs.map(rec => ({
                          label: `[${rec.urgency}] ${rec.category}`,
                          value: `${rec.action} — Impact: ${rec.impact}`,
                          highlight: rec.urgency === "immediate" ? "danger" as const : rec.urgency === "short-term" ? "warning" as const : "success" as const,
                        })),
                      }] : []),
                    ],
                  }, `CashFlow-StressTest-${new Date().toISOString().slice(0, 10)}`);
                }}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export PDF Report
              </Button>

              <Button variant="outline" onClick={resetForm} className="w-full">Run Another Test</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </UpgradeGate>
  );
};

export default CashFlowStressTest;
