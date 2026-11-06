import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Target,
  Plus,
  Trash2,
  Loader2,
  RotateCcw,
  Shield,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UpgradeGate } from "@/components/tier/UpgradeGate";
import { useAuth } from "@/hooks/useAuth";

interface CompetitorProfile {
  id: string;
  name: string;
  strategy: string;
}

interface PayoffCell {
  yourPayoff: number;
  competitorPayoff: number;
  isNashEquilibrium: boolean;
}

interface NashResult {
  payoffMatrix: {
    yourStrategies: string[];
    competitorStrategies: string[];
    cells: PayoffCell[][];
  };
  nashEquilibria: Array<{
    yourStrategy: string;
    competitorStrategy: string;
    explanation: string;
  }>;
  bestReply: {
    strategy: string;
    reasoning: string;
    confidence: string;
  };
  riskWarning: string | null;
  complianceNote: string;
  recommendation: string;
  noStableEquilibrium: boolean;
}

const strategyOptions = [
  { value: "price_leader", label: "Price Leader" },
  { value: "differentiator", label: "Differentiator" },
  { value: "niche_focus", label: "Niche Focus" },
  { value: "cost_leader", label: "Cost Leader" },
  { value: "innovation", label: "Innovation Leader" },
  { value: "service_excellence", label: "Service Excellence" },
];

const NashEquilibriumSimulator = () => {
  const [yourStrategy, setYourStrategy] = useState("");
  const [yourPosition, setYourPosition] = useState("");
  const [decision, setDecision] = useState("");
  const [competitors, setCompetitors] = useState<CompetitorProfile[]>([
    { id: "1", name: "", strategy: "" },
  ]);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [result, setResult] = useState<NashResult | null>(null);
  const [whatIfStrategy, setWhatIfStrategy] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const addCompetitor = () => {
    if (competitors.length >= 3) return;
    setCompetitors((prev) => [
      ...prev,
      { id: String(Date.now()), name: "", strategy: "" },
    ]);
  };

  const removeCompetitor = (id: string) => {
    if (competitors.length <= 1) return;
    setCompetitors((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCompetitor = (id: string, field: keyof CompetitorProfile, value: string) => {
    setCompetitors((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const isFormValid =
    yourStrategy &&
    yourPosition.trim().length > 10 &&
    decision.trim().length > 10 &&
    competitors.every((c) => c.strategy);

  const handleAnalyse = async () => {
    if (!user) {
      toast({ title: "Sign in required", variant: "destructive" });
      return;
    }
    if (!isFormValid) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setIsAnalysing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrf-agent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            type: "game_theory_nash",
            gameTheoryData: {
              yourStrategy,
              yourPosition,
              decision,
              competitors: competitors.map((c) => ({
                name: c.name || `Competitor ${competitors.indexOf(c) + 1}`,
                strategy: c.strategy,
              })),
            },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Analysis failed");
      }

      const data = await response.json();
      setResult(data);
      toast({ title: "Analysis complete", description: "Nash Equilibrium analysis ready." });
    } catch (e: any) {
      console.error("Nash analysis error:", e);
      toast({ title: "Analysis failed", description: e.message, variant: "destructive" });
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleReset = () => {
    setYourStrategy("");
    setYourPosition("");
    setDecision("");
    setCompetitors([{ id: "1", name: "", strategy: "" }]);
    setResult(null);
    setWhatIfStrategy("");
  };



  const handleWhatIf = async (newStrategy: string) => {
    setWhatIfStrategy(newStrategy);
    if (!user) return;
    setIsAnalysing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrf-agent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            type: "game_theory_nash",
            gameTheoryData: {
              yourStrategy: newStrategy,
              yourPosition,
              decision,
              competitors: competitors.map((c) => ({
                name: c.name || `Competitor ${competitors.indexOf(c) + 1}`,
                strategy: c.strategy,
              })),
            },
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Analysis failed");
      }

      const data = await response.json();
      setResult(data);
      toast({ title: "What-If complete", description: `Re-analysed with ${strategyOptions.find(s => s.value === newStrategy)?.label || newStrategy} strategy.` });
    } catch (e: any) {
      toast({ title: "What-If failed", description: e.message, variant: "destructive" });
    } finally {
      setIsAnalysing(false);
    }
  };

  const getPayoffColor = (value: number) => {
    if (value >= 7) return "text-green-600 font-bold";
    if (value >= 4) return "text-amber-600 font-semibold";
    return "text-destructive font-semibold";
  };

  // Results view
  if (result) {
    return (
      <UpgradeGate
        toolId="nash-equilibrium-simulator"
        toolName="Strategic Scenario Simulator"
        toolDescription="Game theory Nash Equilibrium analysis for competitive strategy decisions."
        features={["Payoff matrix", "Nash Equilibrium", "Best reply strategy", "Risk warnings"]}
      >
        <div className="space-y-6">
          {/* Compliance Note */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
            <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Compliance Note:</strong> {result.complianceNote}
            </p>
          </div>

          {/* Powered By Badge */}
          <div className="flex items-center justify-center">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              <Zap className="h-3 w-3 mr-1" />
              Powered by Game Theory — Nash Equilibrium Analysis
            </Badge>
          </div>

          {/* Nash Equilibria */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" />
                Nash Equilibrium{result.nashEquilibria.length > 1 ? " Points" : ""}
              </CardTitle>
              {result.noStableEquilibrium && (
                <CardDescription className="flex items-center gap-1 text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  No stable equilibrium exists — the market is dynamic. See risk warning below.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {result.nashEquilibria.map((eq, idx) => (
                <div key={idx} className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-primary text-primary-foreground">
                      Equilibrium {idx + 1}
                    </Badge>
                    <span className="text-sm">
                      <strong>You:</strong> {eq.yourStrategy} · <strong>Competitor:</strong> {eq.competitorStrategy}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{eq.explanation}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Payoff Matrix */}
          {result.payoffMatrix && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payoff Matrix</CardTitle>
                <CardDescription>Values represent relative payoff (1-10). Highlighted cells = Nash Equilibrium.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold">Your Strategy ↓ / Competitor →</TableHead>
                        {result.payoffMatrix.competitorStrategies.map((cs, i) => (
                          <TableHead key={i} className="text-center min-w-[140px]">{cs}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.payoffMatrix.yourStrategies.map((ys, ri) => (
                        <TableRow key={ri}>
                          <TableCell className="font-medium">{ys}</TableCell>
                          {result.payoffMatrix.cells[ri]?.map((cell, ci) => (
                            <TableCell
                              key={ci}
                              className={`text-center ${cell.isNashEquilibrium ? "bg-primary/10 ring-2 ring-primary/30 rounded" : ""}`}
                            >
                              <div className="flex items-center justify-center gap-1 text-sm">
                                <span className={getPayoffColor(cell.yourPayoff)}>
                                  {cell.yourPayoff}
                                </span>
                                <span className="text-muted-foreground">,</span>
                                <span className={getPayoffColor(cell.competitorPayoff)}>
                                  {cell.competitorPayoff}
                                </span>
                              </div>
                              {cell.isNashEquilibrium && (
                                <Badge variant="outline" className="text-[10px] mt-1 bg-primary/5 text-primary">
                                  NE
                                </Badge>
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Best Reply */}
          <Card className="border-green-500/20 bg-green-500/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-green-600" />
                Best Reply Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600 text-white">{result.bestReply.strategy}</Badge>
                <Badge variant="outline">Confidence: {result.bestReply.confidence}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{result.bestReply.reasoning}</p>
            </CardContent>
          </Card>

          {/* Overall Recommendation */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm">{result.recommendation}</p>
              </div>
            </CardContent>
          </Card>

          {/* Risk Warning */}
          {result.riskWarning && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Risk Warning</p>
                <p className="text-sm text-muted-foreground">{result.riskWarning}</p>
              </div>
            </div>
          )}

          {/* What-If Strategy Toggle */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                What-If Strategy Toggle
              </CardTitle>
              <CardDescription>Switch your strategy to see how the equilibrium shifts — no page reload needed.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {strategyOptions.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={(whatIfStrategy || yourStrategy) === opt.value ? "default" : "outline"}
                    size="sm"
                    disabled={isAnalysing}
                    onClick={() => {
                      if (opt.value !== (whatIfStrategy || yourStrategy)) {
                        handleWhatIf(opt.value);
                      }
                    }}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
              {isAnalysing && (
                <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Recalculating equilibrium…
                </div>
              )}
            </CardContent>
          </Card>

          <Button onClick={handleReset} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Run Another Simulation
          </Button>
        </div>
      </UpgradeGate>
    );
  }

  // Input form
  return (
    <UpgradeGate
      toolId="nash-equilibrium-simulator"
      toolName="Strategic Scenario Simulator"
      toolDescription="Apply Nash Equilibrium game theory to find your optimal competitive strategy."
      features={["Payoff matrix analysis", "Nash Equilibrium identification", "Best-reply recommendation", "Competitor modelling"]}
    >
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Strategic Scenario Simulator
          </CardTitle>
          <CardDescription>
            Describe your competitive situation and the AI will apply Nash Equilibrium analysis to find your optimal strategy.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Your Strategy */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Your Current Position
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Current Strategy</Label>
                <Select value={yourStrategy} onValueChange={setYourStrategy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    {strategyOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Market Position Description</Label>
                <Input
                  placeholder="e.g. Mid-market SaaS with 15% market share"
                  value={yourPosition}
                  onChange={(e) => setYourPosition(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Decision You're Facing</Label>
              <Textarea
                placeholder="e.g. Should we cut prices by 20% to match new competitor, or invest in premium features?"
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>

          {/* Competitors */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Competitor Profiles (up to 3)
              </h3>
              {competitors.length < 3 && (
                <Button variant="outline" size="sm" onClick={addCompetitor}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              )}
            </div>
            {competitors.map((comp, idx) => (
              <div key={comp.id} className="border rounded-lg p-4 space-y-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Competitor {idx + 1}</span>
                  {competitors.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeCompetitor(comp.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Name (optional)</Label>
                    <Input
                      placeholder="e.g. Competitor A"
                      value={comp.name}
                      onChange={(e) => updateCompetitor(comp.id, "name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Their Strategy *</Label>
                    <Select
                      value={comp.strategy}
                      onValueChange={(v) => updateCompetitor(comp.id, "strategy", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        {strategyOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Compliance Note */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
            <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Guardrail:</strong> The AI will refuse to analyse any strategy resembling price-fixing or collusion. All outputs include a compliance disclaimer.
            </p>
          </div>

          <Button
            onClick={handleAnalyse}
            disabled={isAnalysing || !isFormValid}
            className="w-full"
            size="lg"
          >
            {isAnalysing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Nash Equilibrium Analysis...
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                Analyse Competitive Scenario
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </UpgradeGate>
  );
};

export default NashEquilibriumSimulator;
