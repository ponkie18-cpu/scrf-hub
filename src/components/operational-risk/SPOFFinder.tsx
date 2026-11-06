import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, Plus, Trash2, Download, CheckCircle2, Loader2,
  BrainCircuit, ShieldAlert, Lock, ArrowRight,
} from "lucide-react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, Label as RLabel } from "recharts";
import { useAssessmentSave } from "@/hooks/useAssessmentSave";
import { useTierAccess } from "@/hooks/useTierAccess";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface SPOF {
  id: string;
  type: "person" | "supplier" | "tool" | "system";
  name: string;
  process: string;
  mitigation: string;
}

interface MitigationOption {
  action: string;
  effort: string;
  costBand: "Low cost" | "Medium cost" | "High cost";
}

interface RankedSpof {
  spofId: string;
  name: string;
  impactScore: "high" | "medium" | "low";
  likelihoodScore: "high" | "medium" | "low";
  rootCause: string;
  mitigationOptions: MitigationOption[];
  industryBenchmark: number;
}

interface SmartAction {
  spofId: string;
  title: string;
  description: string;
  priority: string;
  estimatedDays: number;
}

interface MitigationResult {
  rankedSpofs: RankedSpof[];
  smartActions: SmartAction[];
  overallRiskSummary: string;
}

const spofTypes = [
  { value: "person", label: "Person", description: "Key employee or role" },
  { value: "supplier", label: "Supplier", description: "Vendor or partner" },
  { value: "tool", label: "Tool/Equipment", description: "Physical asset" },
  { value: "system", label: "System", description: "Software or process" },
];

const scoreValue = { high: 3, medium: 2, low: 1 };
const scoreLabel = { high: "High", medium: "Medium", low: "Low" };

const impactColors = {
  high: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  low: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

const costColors = {
  "Low cost": "text-green-600 dark:text-green-400",
  "Medium cost": "text-amber-600 dark:text-amber-400",
  "High cost": "text-red-600 dark:text-red-400",
};

const AUTOSAVE_KEY = "scrf_spof_draft";

const SPOFFinder = () => {
  const [processes, setProcesses] = useState<string[]>(["", "", ""]);
  const [spofs, setSpofs] = useState<SPOF[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [newSpof, setNewSpof] = useState<Partial<SPOF>>({});
  const { saveAssessment, isSaving, savedToDb, reset: resetSave } = useAssessmentSave();
  const { tier } = useTierAccess();
  const { user } = useAuth();
  const [mitigationResult, setMitigationResult] = useState<MitigationResult | null>(null);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [generatingActions, setGeneratingActions] = useState<string | null>(null);

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (currentStep === 3) return; // Don't auto-save completed state
    const interval = setInterval(() => {
      const draft = { processes, spofs, currentStep };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft));
    }, 30000);
    return () => clearInterval(interval);
  }, [processes, spofs, currentStep]);

  // Load draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.processes) setProcesses(draft.processes);
        if (draft.spofs?.length > 0) setSpofs(draft.spofs);
        if (draft.currentStep && draft.currentStep < 3) setCurrentStep(draft.currentStep);
      }
    } catch { /* ignore */ }
  }, []);

  // Clear draft when assessment completes
  useEffect(() => {
    if (currentStep === 3 && savedToDb) {
      localStorage.removeItem(AUTOSAVE_KEY);
    }
  }, [currentStep, savedToDb]);

  // Save to dashboard when viewing results (step 3)
  useEffect(() => {
    if (currentStep === 3 && spofs.length > 0 && !savedToDb && !isSaving) {
      const unmittigatedSpofs = spofs.filter((s) => !s.mitigation);
      const score = Math.max(0, 100 - spofs.length * 10 - unmittigatedSpofs.length * 5);

      const recommendations = spofs
        .filter((s) => !s.mitigation)
        .slice(0, 5)
        .map((s) => ({
          title: `Mitigate ${s.type} dependency: ${s.name}`,
          priority: "high" as const,
          description: `Create backup plan for ${s.name} in ${s.process}`,
        }));

      const insights = [
        `${spofs.length} single points of failure identified`,
        `${unmittigatedSpofs.length} without mitigation plans`,
        `Types: ${[...new Set(spofs.map((s) => s.type))].join(", ")}`,
      ];

      saveAssessment({
        domain: "operational",
        toolId: "spof-finder",
        answers: { processes, spofs },
        score,
        confidence: spofs.length >= 3 ? 1.0 : 0.7,
        insights,
        recommendations,
      });
    }
  }, [currentStep, spofs, savedToDb, isSaving]);

  // Trigger AI mitigation analysis when entering step 3
  useEffect(() => {
    if (currentStep === 3 && spofs.length > 0 && !mitigationResult && !isAnalysing && user) {
      runMitigationAnalysis();
    }
  }, [currentStep]);

  const runMitigationAnalysis = async () => {
    setIsAnalysing(true);
    setAnalysisError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrf-agent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            type: "spof_mitigation",
            spofData: { spofs, processes },
          }),
        }
      );

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || "Analysis failed");
      }

      const result: MitigationResult = await resp.json();
      setMitigationResult(result);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : "Failed to analyse");
    } finally {
      setIsAnalysing(false);
    }
  };

  const addSPOF = () => {
    if (newSpof.name && newSpof.type && newSpof.process) {
      setSpofs([
        ...spofs,
        {
          id: crypto.randomUUID(),
          type: newSpof.type as SPOF["type"],
          name: newSpof.name,
          process: newSpof.process,
          mitigation: newSpof.mitigation || "",
        },
      ]);
      setNewSpof({});
    }
  };

  const removeSPOF = (id: string) => {
    setSpofs(spofs.filter((s) => s.id !== id));
  };

  const updateProcess = (index: number, value: string) => {
    const updated = [...processes];
    updated[index] = value;
    setProcesses(updated);
  };

  const getTypeColor = (type: SPOF["type"]) => {
    const colors = {
      person: "bg-pillar-2/10 text-pillar-2 border-pillar-2/20",
      supplier: "bg-accent/10 text-accent border-accent/20",
      tool: "bg-pillar-3/10 text-pillar-3 border-pillar-3/20",
      system: "bg-primary/10 text-primary border-primary/20",
    };
    return colors[type];
  };

  // Build heat map data
  const heatMapData = mitigationResult
    ? mitigationResult.rankedSpofs.map((rs) => ({
        name: rs.name,
        likelihood: scoreValue[rs.likelihoodScore],
        impact: scoreValue[rs.impactScore],
        impactLabel: scoreLabel[rs.impactScore],
        likelihoodLabel: scoreLabel[rs.likelihoodScore],
      }))
    : [];

  const getHeatMapColor = (likelihood: number, impact: number) => {
    const total = likelihood + impact;
    if (total >= 5) return "#ef4444";
    if (total >= 4) return "#f59e0b";
    return "#22c55e";
  };

  const isPro = tier === "pro";

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-accent" />
          </div>
          <div>
            <CardTitle className="font-display text-xl">Find Your Biggest Vulnerability</CardTitle>
            <CardDescription>Identify the single point that could break your business in 10 minutes</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: List Critical Processes */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="p-4 bg-secondary rounded-lg">
              <p className="font-semibold mb-1">Step 1: List Your Top 3 Critical Processes</p>
              <p className="text-sm text-muted-foreground">What operations would cause significant harm if disrupted for 48+ hours?</p>
            </div>
            <div className="space-y-3">
              {processes.map((process, index) => (
                <div key={index}>
                  <Label htmlFor={`process-${index}`}>Critical Process {index + 1}</Label>
                  <Input
                    id={`process-${index}`}
                    placeholder={`e.g., ${["Fulfill Customer Orders", "Process Payroll", "Customer Support"][index]}`}
                    value={process}
                    onChange={(e) => updateProcess(index, e.target.value)}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
            <Button onClick={() => setCurrentStep(2)} disabled={!processes.some((p) => p.trim())} className="w-full">
              Continue to Identify SPOFs
            </Button>
          </div>
        )}

        {/* Step 2: Identify SPOFs */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="p-4 bg-secondary rounded-lg">
              <p className="font-semibold mb-1">Step 2: Identify Single Points of Failure</p>
              <p className="text-sm text-muted-foreground">For each process, identify people, suppliers, tools, or systems that are irreplaceable within 48 hours.</p>
            </div>

            {spofs.length > 0 && (
              <div className="space-y-2">
                {spofs.map((spof) => (
                  <div key={spof.id} className={`p-3 rounded-lg border flex items-start justify-between gap-3 ${getTypeColor(spof.type)}`}>
                    <div>
                      <p className="font-semibold text-sm">{spof.name}</p>
                      <p className="text-xs opacity-80">{spof.type.charAt(0).toUpperCase() + spof.type.slice(1)} • {spof.process}</p>
                      {spof.mitigation && <p className="text-xs mt-1">Mitigation: {spof.mitigation}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeSPOF(spof.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>SPOF Type</Label>
                  <select
                    className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-sm"
                    value={newSpof.type || ""}
                    onChange={(e) => setNewSpof({ ...newSpof, type: e.target.value as SPOF["type"] })}
                  >
                    <option value="">Select type...</option>
                    {spofTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Related Process</Label>
                  <select
                    className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-sm"
                    value={newSpof.process || ""}
                    onChange={(e) => setNewSpof({ ...newSpof, process: e.target.value })}
                  >
                    <option value="">Select process...</option>
                    {processes.filter((p) => p.trim()).map((process, idx) => (
                      <option key={idx} value={process}>{process}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <Label>SPOF Name/Description</Label>
                <Input
                  placeholder="e.g., John (only person who knows billing system)"
                  value={newSpof.name || ""}
                  onChange={(e) => setNewSpof({ ...newSpof, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Mitigation Idea (optional)</Label>
                <Input
                  placeholder="e.g., Cross-train Sarah on billing procedures"
                  value={newSpof.mitigation || ""}
                  onChange={(e) => setNewSpof({ ...newSpof, mitigation: e.target.value })}
                  className="mt-1"
                />
              </div>
              <Button onClick={addSPOF} disabled={!newSpof.name || !newSpof.type || !newSpof.process} variant="secondary" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add SPOF
              </Button>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>Back</Button>
              <Button onClick={() => { setMitigationResult(null); setCurrentStep(3); }} disabled={spofs.length === 0} className="flex-1">
                Analyse & View Results
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Results with AI Mitigation */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="p-4 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <p className="font-semibold">SPOF Analysis Complete</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {spofs.length} single point(s) of failure identified across {processes.filter((p) => p.trim()).length} critical processes.
              </p>
              {mitigationResult && (
                <p className="text-sm mt-2 font-medium">{mitigationResult.overallRiskSummary}</p>
              )}
            </div>

            {/* AI Loading */}
            {isAnalysing && (
              <Card className="border-dashed border-amber-300/50">
                <CardContent className="py-8 flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                    <BrainCircuit className="h-5 w-5 text-slate-900 animate-pulse" />
                  </div>
                  <p className="text-sm font-medium">SCRF Agent analysing your vulnerabilities…</p>
                  <p className="text-xs">Generating mitigation strategies and risk rankings</p>
                </CardContent>
              </Card>
            )}

            {analysisError && (
              <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{analysisError}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={runMitigationAnalysis}>
                  Retry Analysis
                </Button>
              </div>
            )}

            {/* Impact Ranking (visible to all) */}
            {mitigationResult && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-500" />
                  Impact Ranking
                </h3>
                <div className="space-y-2">
                  {mitigationResult.rankedSpofs
                    .sort((a, b) => scoreValue[b.impactScore] - scoreValue[a.impactScore])
                    .map((rs, idx) => (
                      <div key={rs.spofId} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <span className="text-lg font-bold text-muted-foreground w-6">#{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{rs.name}</p>
                        </div>
                        <Badge className={impactColors[rs.impactScore]}>{scoreLabel[rs.impactScore]} Impact</Badge>
                        <Badge className={impactColors[rs.likelihoodScore]}>{scoreLabel[rs.likelihoodScore]} Likelihood</Badge>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* SPOF Risk Heat Map */}
            {mitigationResult && heatMapData.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">SPOF Risk Heat Map</h3>
                <div className="bg-muted/30 rounded-lg p-4 border">
                  <ResponsiveContainer width="100%" height={280}>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 30, left: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" dataKey="likelihood" domain={[0.5, 3.5]} ticks={[1, 2, 3]} tickFormatter={(v) => ["", "Low", "Med", "High"][v] || ""}>
                        <RLabel value="Likelihood" offset={-10} position="insideBottom" style={{ fontSize: 12 }} />
                      </XAxis>
                      <YAxis type="number" dataKey="impact" domain={[0.5, 3.5]} ticks={[1, 2, 3]} tickFormatter={(v) => ["", "Low", "Med", "High"][v] || ""}>
                        <RLabel value="Impact" angle={-90} position="insideLeft" style={{ fontSize: 12 }} />
                      </YAxis>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="bg-background border rounded-lg p-2 shadow-md text-xs">
                              <p className="font-semibold">{d.name}</p>
                              <p>Impact: {d.impactLabel} • Likelihood: {d.likelihoodLabel}</p>
                            </div>
                          );
                        }}
                      />
                      <Scatter data={heatMapData}>
                        {heatMapData.map((entry, i) => (
                          <Cell key={i} fill={getHeatMapColor(entry.likelihood, entry.impact)} r={10} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Pro Gate: Mitigation Cards */}
            {mitigationResult && !isPro && (
              <div className="relative">
                {/* Blurred preview */}
                <div className="filter blur-sm pointer-events-none opacity-60 space-y-3">
                  {mitigationResult.rankedSpofs.slice(0, 2).map((rs) => (
                    <div key={rs.spofId} className="p-4 border rounded-lg">
                      <p className="font-semibold text-sm">{rs.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{rs.rootCause}</p>
                      <div className="mt-2 space-y-1">
                        {rs.mitigationOptions.map((opt, i) => (
                          <div key={i} className="text-xs p-2 bg-muted/50 rounded">{opt.action}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-background/95 backdrop-blur-sm border-2 border-amber-400/40 rounded-xl p-6 text-center max-w-sm shadow-lg">
                    <Lock className="h-8 w-8 text-amber-500 mx-auto mb-3" />
                    <h4 className="font-bold text-lg mb-2">Unlock AI-Powered Mitigation Strategies</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Get detailed root cause analysis, 3 concrete mitigation options per SPOF, industry benchmarks, and auto-generated action items.
                    </p>
                    <Button className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 hover:from-amber-600 hover:to-yellow-600 font-semibold">
                      Start Free Pro Trial
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Full Mitigation Cards (Pro only) */}
            {mitigationResult && isPro && (
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <BrainCircuit className="h-4 w-4 text-amber-500" />
                  AI Mitigation Analysis
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-[10px]">PRO</Badge>
                </h3>
                {mitigationResult.rankedSpofs
                  .sort((a, b) => scoreValue[b.impactScore] - scoreValue[a.impactScore])
                  .map((rs) => (
                    <Card key={rs.spofId} className="border-l-4" style={{ borderLeftColor: rs.impactScore === "high" ? "#ef4444" : rs.impactScore === "medium" ? "#f59e0b" : "#22c55e" }}>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">{rs.name}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge className={impactColors[rs.impactScore]} variant="outline">{scoreLabel[rs.impactScore]} Impact</Badge>
                              <Badge className={impactColors[rs.likelihoodScore]} variant="outline">{scoreLabel[rs.likelihoodScore]} Likelihood</Badge>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">Industry benchmark</p>
                            <p className="text-lg font-bold text-primary">{rs.industryBenchmark}%</p>
                            <p className="text-[10px] text-muted-foreground">of SMEs addressed</p>
                          </div>
                        </div>

                        {/* Root cause */}
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Root Cause</p>
                          <p className="text-sm">{rs.rootCause}</p>
                        </div>

                        {/* Mitigation options */}
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mitigation Options</p>
                          <div className="space-y-2">
                            {rs.mitigationOptions.map((opt, i) => (
                              <div key={i} className="flex items-start gap-3 p-2.5 border rounded-lg bg-background">
                                <span className="text-xs font-bold text-muted-foreground mt-0.5">{i + 1}.</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm">{opt.action}</p>
                                  <div className="flex gap-3 mt-1">
                                    <span className="text-xs text-muted-foreground">⏱ {opt.effort}</span>
                                    <span className={`text-xs font-medium ${costColors[opt.costBand]}`}>💰 {opt.costBand}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}

            {/* Generate Action Items per SPOF */}
            {mitigationResult && isPro && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Generate Action Items</h3>
                {mitigationResult.rankedSpofs
                  .sort((a, b) => scoreValue[b.impactScore] - scoreValue[a.impactScore])
                  .map((rs) => (
                    <div key={rs.spofId} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-medium truncate">{rs.name}</p>
                        <p className="text-xs text-muted-foreground">{scoreLabel[rs.impactScore]} Impact</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 text-xs"
                        disabled={generatingActions === rs.spofId}
                        onClick={async () => {
                          if (!user) return;
                          setGeneratingActions(rs.spofId);
                          try {
                            const dueDate = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
                            const actions = rs.mitigationOptions.slice(0, 3).map((opt) => ({
                              user_id: user.id,
                              title: opt.action.slice(0, 120),
                              description: `[SPOF Finder] Mitigation for "${rs.name}" — ${opt.effort}, ${opt.costBand}`,
                              domain: "operational",
                              priority: rs.impactScore === "high" ? "high" : "medium",
                              due_date: dueDate,
                            }));
                            await supabase.from("action_items").insert(actions);
                          } catch (e) { console.error(e); }
                          setGeneratingActions(null);
                        }}
                      >
                        {generatingActions === rs.spofId ? (
                          <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Creating...</>
                        ) : (
                          <><Plus className="h-3 w-3 mr-1" /> Generate Actions</>
                        )}
                      </Button>
                    </div>
                  ))}
              </div>
            )}

            {/* SMART Actions created */}
            {mitigationResult && isPro && mitigationResult.smartActions.length > 0 && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                    {mitigationResult.smartActions.length} SMART action items added to your Action Center
                  </p>
                </div>
                <div className="space-y-1">
                  {mitigationResult.smartActions.map((a, i) => (
                    <p key={i} className="text-xs text-green-700 dark:text-green-400">• {a.title}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Summary by type (original) */}
            <div className="grid sm:grid-cols-2 gap-3">
              {spofTypes.map((type) => {
                const count = spofs.filter((s) => s.type === type.value).length;
                return (
                  <div key={type.value} className={`p-3 rounded-lg border ${getTypeColor(type.value as SPOF["type"])}`}>
                    <p className="font-semibold">{type.label}</p>
                    <p className="text-2xl font-display">{count}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>Edit SPOFs</Button>
              <Button className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SPOFFinder;
