import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { UpgradeGate } from "@/components/tier/UpgradeGate";
import { LocalDisclaimer } from "@/components/advisor/LocalDisclaimer";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Skull, ArrowRight, ArrowLeft, Brain, Lightbulb, Target,
  AlertTriangle, CheckCircle, Loader2, FileText, RefreshCw
} from "lucide-react";

const SCENARIOS = [
  { id: "business_failure", label: "Business Failure", prompt: "My business has failed in 12 months. What went wrong?" },
  { id: "client_loss", label: "Major Client Lost", prompt: "Our biggest client has just terminated our contract. Why?" },
  { id: "data_breach", label: "Data Breach", prompt: "We've suffered a major data breach. How did it happen?" },
  { id: "custom", label: "Custom Scenario", prompt: "" },
];

const PROBING_QUESTIONS = [
  "What operational assumptions are you making that could be wrong?",
  "What competitor action could have triggered this?",
  "What compliance failure could have caused this outcome?",
  "What financial vulnerability made this worse?",
  "Who are the key people whose absence could have contributed?",
];

interface PreventionPriority {
  title: string;
  likelihood: string;
  category: string;
  relatedTool: string;
  action: string;
}

interface SynthesisResult {
  priorities: PreventionPriority[];
  summary: string;
}

const PreMortemExercise = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0); // 0=scenario, 1-5=probing, 6=synthesis
  const [selectedScenario, setSelectedScenario] = useState("");
  const [customScenario, setCustomScenario] = useState("");
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [synthesis, setSynthesis] = useState<SynthesisResult | null>(null);

  const activeScenario = selectedScenario === "custom" ? customScenario : SCENARIOS.find(s => s.id === selectedScenario)?.prompt || "";

  const handleAnalyse = async () => {
    if (!user) { toast({ title: "Please sign in", variant: "destructive" }); return; }
    setIsAnalysing(true);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("No session");

      const probingData = PROBING_QUESTIONS.map((q, i) => ({
        question: q,
        response: responses[i] || "Not answered",
        category: ["operational", "strategic", "compliance", "financial", "operational"][i],
      }));

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrf-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type: "pre_mortem",
          premortemData: { scenario: activeScenario, responses: probingData },
        }),
      });

      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();

      if (data.priorities) {
        setSynthesis(data);
      } else {
        // Fallback if edge function returns structured response instead
        setSynthesis({
          summary: data.insight || data.recommendation || "Analysis complete.",
          priorities: [
            { title: "Review operational assumptions", likelihood: "High", category: "operational", relatedTool: "spof-finder", action: "Run SPOF analysis on identified vulnerabilities" },
            { title: "Strengthen compliance controls", likelihood: "Medium", category: "compliance", relatedTool: "compliance-motivation", action: "Complete compliance motivation assessment" },
            { title: "Stress-test financial runway", likelihood: "High", category: "financial", relatedTool: "cashflow-stress-test", action: "Run cash flow stress test with failure scenario" },
            { title: "Assess competitive positioning", likelihood: "Medium", category: "strategic", relatedTool: "horizon-scanner", action: "Scan for emerging competitive threats" },
            { title: "Document critical processes", likelihood: "High", category: "operational", relatedTool: "process-doc-builder", action: "Document the process most at risk of failure" },
          ],
        });
      }
      setStep(6);
    } catch (err) {
      console.error(err);
      toast({ title: "Analysis failed", description: "Please try again", variant: "destructive" });
    } finally {
      setIsAnalysing(false);
    }
  };

  const createActionItems = async () => {
    if (!user || !synthesis) return;
    try {
      const items = synthesis.priorities.slice(0, 3).map(p => ({
        user_id: user.id,
        title: p.action,
        description: `Pre-Mortem: ${p.title}`,
        domain: p.category,
        priority: p.likelihood === "High" ? "high" : "medium",
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      }));
      const { error } = await supabase.from("action_items").insert(items);
      if (error) throw error;
      toast({ title: "Action items created", description: `${items.length} items added to your Action Center` });
    } catch {
      toast({ title: "Error creating action items", variant: "destructive" });
    }
  };

  const reset = () => {
    setStep(0);
    setSelectedScenario("");
    setCustomScenario("");
    setResponses({});
    setSynthesis(null);
  };

  const categoryColors: Record<string, string> = {
    operational: "bg-blue-100 text-blue-700",
    financial: "bg-green-100 text-green-700",
    compliance: "bg-purple-100 text-purple-700",
    strategic: "bg-amber-100 text-amber-700",
  };

  return (
    <UpgradeGate toolId="pre-mortem-exercise" toolName="Pre-Mortem Exercise"
      toolDescription="Imagine future failure and work backward to prevent it"
      features={["Guided failure scenario brainstorm", "AI-facilitated risk surfacing", "Prevention priority ranking", "Auto-generated action items"]}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Skull className="h-5 w-5 text-primary" />
              Pre-Mortem Exercise
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Imagine a specific future failure and work backward to prevent it
            </p>
          </div>
          {step > 0 && (
            <Button variant="ghost" size="sm" onClick={reset}>
              <RefreshCw className="h-4 w-4 mr-1" /> Start Over
            </Button>
          )}
        </div>

        <Progress value={step === 6 ? 100 : (step / 6) * 100} className="h-1.5" />

        {/* STEP 0: Scenario Selection */}
        {step === 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Step 1: Choose Your Failure Scenario</CardTitle>
              <CardDescription className="text-xs">Select a scenario to analyse, or create your own</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {SCENARIOS.map(s => (
                <div key={s.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedScenario === s.id ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}
                  onClick={() => setSelectedScenario(s.id)}>
                  <p className="text-sm font-medium">{s.label}</p>
                  {s.prompt && <p className="text-xs text-muted-foreground mt-0.5 italic">"{s.prompt}"</p>}
                </div>
              ))}
              {selectedScenario === "custom" && (
                <div className="mt-2">
                  <Label className="text-xs">Describe your failure scenario</Label>
                  <Textarea value={customScenario} onChange={e => setCustomScenario(e.target.value)}
                    placeholder="e.g. Our supply chain has completely collapsed..." rows={2} className="mt-1" />
                </div>
              )}
              <Button className="w-full" onClick={() => setStep(1)}
                disabled={!selectedScenario || (selectedScenario === "custom" && !customScenario.trim())}>
                Begin Brainstorm <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* STEPS 1-5: Probing Questions */}
        {step >= 1 && step <= 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Step 2: Guided Brainstorm — Question {step}/5</CardTitle>
              <CardDescription className="text-xs">
                Scenario: "<span className="italic">{activeScenario}</span>"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-start gap-2">
                  <Brain className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm font-medium">{PROBING_QUESTIONS[step - 1]}</p>
                </div>
              </div>
              <Textarea
                value={responses[step - 1] || ""}
                onChange={e => setResponses(prev => ({ ...prev, [step - 1]: e.target.value }))}
                placeholder="Think carefully about what could have gone wrong..."
                rows={3}
              />
              <div className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                {step < 5 ? (
                  <Button size="sm" onClick={() => setStep(s => s + 1)}>
                    Next Question <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleAnalyse} disabled={isAnalysing}>
                    {isAnalysing ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Analysing...</> : <>Synthesise & Analyse <Target className="h-4 w-4 ml-1" /></>}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 6: Synthesis */}
        {step === 6 && synthesis && (
          <div className="space-y-4">
            {/* Summary */}
            <Card className="border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Pre-Mortem Synthesis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{synthesis.summary}</p>
              </CardContent>
            </Card>

            {/* Prevention Priorities */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Top Prevention Priorities</CardTitle>
                <CardDescription className="text-xs">Ranked by likelihood — address these to prevent the scenario</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {synthesis.priorities.map((p, i) => (
                  <div key={i} className="p-3 rounded-lg border flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{p.title}</p>
                        <Badge variant={p.likelihood === "High" ? "destructive" : "secondary"} className="text-xs">{p.likelihood}</Badge>
                        <Badge className={`text-xs ${categoryColors[p.category] || ""}`}>{p.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.action}</p>
                    </div>
                    <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={createActionItems} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-1" /> Create Action Items
              </Button>
              <Button variant="outline" onClick={reset}>
                <RefreshCw className="h-4 w-4 mr-1" /> New Exercise
              </Button>
            </div>

            <LocalDisclaimer adviceType="general" />
          </div>
        )}
      </div>
    </UpgradeGate>
  );
};

export default PreMortemExercise;
