import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Map, Loader2, RotateCcw, Shield, AlertTriangle, Lightbulb, Zap,
  TrendingUp, Plus, Trash2, Clock, DollarSign, Users, ToggleLeft, ToggleRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UpgradeGate } from "@/components/tier/UpgradeGate";
import { useAuth } from "@/hooks/useAuth";
import { LocalDisclaimer } from "@/components/advisor/LocalDisclaimer";

/* ── Types ── */
interface Competitor {
  id: string;
  name: string;
  marketShare: string;
  aggressiveness: string;
}

interface MarketEntryInput {
  targetMarket: string;
  marketSize: string;
  entryStrategy: string;
  budget: string;
  teamSize: string;
  timeline: string;
  competitors: Competitor[];
}

interface LandscapePoint {
  name: string;
  marketShare: number;
  aggressiveness: number;
  isUser?: boolean;
}

interface RiskItem {
  risk: string;
  likelihood: string;
  mitigant: string;
}

interface RoadmapStep {
  phase: string;
  action: string;
  timeline: string;
  keyMetric: string;
}

interface MarketEntryResult {
  saturationAnalysis: {
    saturationLevel: string;
    saturationScore: number;
    explanation: string;
  };
  nashResponse: {
    equilibriumStrategy: string;
    incumbentReaction: string;
    explanation: string;
  };
  blueOceanSegments: Array<{ segment: string; reasoning: string; opportunityScore: number }>;
  timingRecommendation: {
    recommendation: string;
    reasoning: string;
    type: string;
  };
  landscapeMap: LandscapePoint[];
  executionRoadmap: RoadmapStep[];
  riskRegister: RiskItem[];
  overallRecommendation: string;
  complianceNote: string;
}

const strategyOptions = [
  { value: "price_leader", label: "Price Leader — Undercut on price" },
  { value: "differentiator", label: "Differentiator — Unique value proposition" },
  { value: "niche", label: "Niche Focus — Specialised segment" },
  { value: "fast_follower", label: "Fast Follower — Improve on existing" },
  { value: "disruptor", label: "Disruptor — New business model" },
];

const budgetOptions = [
  { value: "under_100k", label: "Under R100K" },
  { value: "100k_500k", label: "R100K – R500K" },
  { value: "500k_1m", label: "R500K – R1M" },
  { value: "1m_5m", label: "R1M – R5M" },
  { value: "over_5m", label: "Over R5M" },
];

const aggressivenessOptions = [
  { value: "low", label: "Low — Passive / defensive" },
  { value: "medium", label: "Medium — Moderate response" },
  { value: "high", label: "High — Aggressive retaliation" },
];

const emptyInput: MarketEntryInput = {
  targetMarket: "",
  marketSize: "",
  entryStrategy: "",
  budget: "",
  teamSize: "",
  timeline: "",
  competitors: [{ id: "1", name: "", marketShare: "", aggressiveness: "" }],
};

/* ── Landscape Chart (pure CSS) ── */
const LandscapeChart = ({ points }: { points: LandscapePoint[] }) => (
  <div className="relative w-full h-64 border border-border rounded-lg bg-muted/20 overflow-hidden">
    {/* Axis labels */}
    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground">Market Share →</div>
    <div className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-muted-foreground">Aggressiveness →</div>
    {/* Quadrant labels */}
    <div className="absolute top-2 left-2 text-[9px] text-muted-foreground/50">Low Share / High Aggr.</div>
    <div className="absolute top-2 right-2 text-[9px] text-muted-foreground/50">High Share / High Aggr.</div>
    <div className="absolute bottom-6 left-2 text-[9px] text-muted-foreground/50">Low Share / Low Aggr.</div>
    <div className="absolute bottom-6 right-2 text-[9px] text-muted-foreground/50">High Share / Low Aggr.</div>
    {/* Crosshair */}
    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />
    <div className="absolute top-1/2 left-0 right-0 h-px bg-border" />
    {/* Points */}
    {points.map((p, i) => (
      <div
        key={i}
        className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2"
        style={{
          left: `${Math.min(Math.max(p.marketShare * 10, 5), 95)}%`,
          bottom: `${Math.min(Math.max(p.aggressiveness * 10, 5), 95)}%`,
        }}
      >
        <div className={`w-4 h-4 rounded-full border-2 ${p.isUser ? "bg-primary border-primary" : "bg-destructive/70 border-destructive"}`} />
        <span className={`text-[9px] mt-0.5 whitespace-nowrap ${p.isUser ? "font-bold text-primary" : "text-muted-foreground"}`}>{p.name}</span>
      </div>
    ))}
  </div>
);

/* ── Results View ── */
const ResultsView = ({
  result,
  onReset,
  onWhatIf,
  currentStrategy,
}: {
  result: MarketEntryResult;
  onReset: () => void;
  onWhatIf: (strategy: string) => void;
  currentStrategy: string;
}) => {
  const [whatIfStrategy, setWhatIfStrategy] = useState(currentStrategy);
  const [whatIfMode, setWhatIfMode] = useState(false);

  const satColor = result.saturationAnalysis.saturationScore >= 70
    ? "text-destructive" : result.saturationAnalysis.saturationScore >= 40
    ? "text-amber-600" : "text-green-600";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center">
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
          <Zap className="h-3 w-3 mr-1" />
          Powered by Game Theory — Market Entry Analysis
        </Badge>
      </div>

      {/* What-If Toggle */}
      <Card className="border-primary/20">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button
            variant={whatIfMode ? "default" : "outline"}
            size="sm"
            onClick={() => setWhatIfMode(!whatIfMode)}
            className="shrink-0"
          >
            {whatIfMode ? <ToggleRight className="h-4 w-4 mr-1" /> : <ToggleLeft className="h-4 w-4 mr-1" />}
            What-If Mode
          </Button>
          {whatIfMode && (
            <div className="flex items-center gap-2 flex-1 w-full">
              <Select value={whatIfStrategy} onValueChange={setWhatIfStrategy}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {strategyOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={() => onWhatIf(whatIfStrategy)} disabled={whatIfStrategy === currentStrategy}>
                Re-analyse
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saturation Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Market Saturation Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <span className={`text-3xl font-bold ${satColor}`}>{result.saturationAnalysis.saturationScore}%</span>
            <Badge variant="outline">{result.saturationAnalysis.saturationLevel}</Badge>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                result.saturationAnalysis.saturationScore >= 70 ? "bg-destructive" :
                result.saturationAnalysis.saturationScore >= 40 ? "bg-amber-500" : "bg-green-500"
              }`}
              style={{ width: `${result.saturationAnalysis.saturationScore}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">{result.saturationAnalysis.explanation}</p>
        </CardContent>
      </Card>

      {/* Competitive Landscape Map */}
      {result.landscapeMap?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Competitive Landscape Map</CardTitle>
            <CardDescription>Market Share vs Aggressiveness (your position in blue)</CardDescription>
          </CardHeader>
          <CardContent>
            <LandscapeChart points={result.landscapeMap} />
          </CardContent>
        </Card>
      )}

      {/* Nash Response */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Game-Theoretic Incumbent Response
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Badge className="bg-primary text-primary-foreground">{result.nashResponse.equilibriumStrategy}</Badge>
          </div>
          <p className="text-sm"><strong>Predicted incumbent reaction:</strong> {result.nashResponse.incumbentReaction}</p>
          <p className="text-sm text-muted-foreground">{result.nashResponse.explanation}</p>
        </CardContent>
      </Card>

      {/* Blue Ocean Segments */}
      {result.blueOceanSegments?.length > 0 && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-green-600" />
              Blue Ocean Segments
            </CardTitle>
            <CardDescription>Low-competition areas with high potential</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.blueOceanSegments.map((seg, i) => (
              <div key={i} className="border border-green-500/10 rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{seg.segment}</span>
                  <Badge variant="outline" className="text-green-600">Opportunity: {seg.opportunityScore}/10</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{seg.reasoning}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Timing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Entry Timing Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Badge variant="outline">{result.timingRecommendation.type}</Badge>
          <p className="text-sm font-medium">{result.timingRecommendation.recommendation}</p>
          <p className="text-sm text-muted-foreground">{result.timingRecommendation.reasoning}</p>
        </CardContent>
      </Card>

      {/* 3-Step Roadmap */}
      {result.executionRoadmap?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Execution Roadmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {result.executionRoadmap.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{i + 1}</div>
                    {i < result.executionRoadmap.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div className="pb-4 flex-1">
                    <p className="font-medium text-sm">{step.phase}</p>
                    <p className="text-sm text-muted-foreground">{step.action}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]"><Clock className="h-3 w-3 mr-1" />{step.timeline}</Badge>
                      <Badge variant="outline" className="text-[10px]">KPI: {step.keyMetric}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Register */}
      {result.riskRegister?.length > 0 && (
        <Card className="border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Top Competitor Retaliation Risks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.riskRegister.map((r, i) => (
              <div key={i} className="border rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{r.risk}</span>
                  <Badge variant={r.likelihood === "High" ? "destructive" : r.likelihood === "Medium" ? "secondary" : "outline"}>
                    {r.likelihood}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground"><strong>Mitigant:</strong> {r.mitigant}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Overall Recommendation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm">{result.overallRecommendation}</p>
          </div>
        </CardContent>
      </Card>

      {/* Compliance */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
        <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Compliance Note:</strong> {result.complianceNote}
        </p>
      </div>

      <LocalDisclaimer />

      <Button onClick={onReset} variant="outline" className="w-full">
        <RotateCcw className="h-4 w-4 mr-2" />
        Analyse Another Market
      </Button>
    </div>
  );
};

/* ── Main Component ── */
const MarketEntryAdvisor = () => {
  const [input, setInput] = useState<MarketEntryInput>(emptyInput);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [result, setResult] = useState<MarketEntryResult | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const update = <K extends keyof MarketEntryInput>(field: K, value: MarketEntryInput[K]) =>
    setInput((prev) => ({ ...prev, [field]: value }));

  const addCompetitor = () => {
    if (input.competitors.length >= 5) return;
    update("competitors", [...input.competitors, { id: String(Date.now()), name: "", marketShare: "", aggressiveness: "" }]);
  };

  const removeCompetitor = (id: string) => {
    if (input.competitors.length <= 1) return;
    update("competitors", input.competitors.filter((c) => c.id !== id));
  };

  const updateCompetitor = (id: string, field: keyof Competitor, value: string) => {
    update("competitors", input.competitors.map((c) => c.id === id ? { ...c, [field]: value } : c));
  };

  const isFormValid =
    input.targetMarket.trim().length > 5 &&
    input.entryStrategy &&
    input.competitors.some((c) => c.aggressiveness);

  const runAnalysis = async (strategyOverride?: string) => {
    if (!user) { toast({ title: "Sign in required", variant: "destructive" }); return; }
    if (!isFormValid) { toast({ title: "Please fill required fields", variant: "destructive" }); return; }

    setIsAnalysing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const payload = {
        ...input,
        entryStrategy: strategyOverride || input.entryStrategy,
      };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrf-agent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ type: "market_entry", marketEntryData: payload }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Analysis failed");
      }

      const data = await response.json();
      setResult(data);
      if (strategyOverride) {
        update("entryStrategy", strategyOverride);
      }
      toast({ title: "Analysis complete", description: "Market entry analysis ready." });
    } catch (e: any) {
      console.error("Market entry analysis error:", e);
      toast({ title: "Analysis failed", description: e.message, variant: "destructive" });
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleReset = () => { setInput(emptyInput); setResult(null); };

  if (result) {
    return (
      <UpgradeGate
        toolId="market-entry-advisor"
        toolName="Market Entry Advisor"
        toolDescription="Game theory strategic positioning for market entry decisions."
        features={["Saturation analysis", "Nash response prediction", "Blue ocean segments", "Execution roadmap"]}
      >
        <ResultsView
          result={result}
          onReset={handleReset}
          onWhatIf={(strategy) => runAnalysis(strategy)}
          currentStrategy={input.entryStrategy}
        />
      </UpgradeGate>
    );
  }

  return (
    <UpgradeGate
      toolId="market-entry-advisor"
      toolName="Market Entry Advisor"
      toolDescription="Use game theory to analyse market entry decisions and predict competitor responses."
      features={["Market saturation analysis", "Nash Equilibrium response prediction", "Blue ocean segment identification", "What-If strategy toggle"]}
    >
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            Market Entry Advisor
          </CardTitle>
          <CardDescription>
            Analyse your market entry decision using game theory — predict incumbent responses and find your optimal positioning.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Target Market */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Target Market
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Market / Segment Description *</Label>
                <Textarea
                  placeholder="e.g. Last-mile delivery for e-commerce retailers in Gauteng province"
                  value={input.targetMarket}
                  onChange={(e) => update("targetMarket", e.target.value)}
                  className="min-h-[60px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Estimated Market Size</Label>
                <Input placeholder="e.g. R500M annual, 200 active players" value={input.marketSize} onChange={(e) => update("marketSize", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Your Entry Strategy *</Label>
                <Select value={input.entryStrategy} onValueChange={(v) => update("entryStrategy", v)}>
                  <SelectTrigger><SelectValue placeholder="Select strategy" /></SelectTrigger>
                  <SelectContent>
                    {strategyOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Available Resources
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Budget Band</Label>
                <Select value={input.budget} onValueChange={(v) => update("budget", v)}>
                  <SelectTrigger><SelectValue placeholder="Select budget" /></SelectTrigger>
                  <SelectContent>
                    {budgetOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Team Size</Label>
                <Input placeholder="e.g. 5 people" value={input.teamSize} onChange={(e) => update("teamSize", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Timeline</Label>
                <Input placeholder="e.g. 6 months" value={input.timeline} onChange={(e) => update("timeline", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Competitors */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Current Competitors (up to 5)
              </h3>
              {input.competitors.length < 5 && (
                <Button variant="outline" size="sm" onClick={addCompetitor}>
                  <Plus className="h-3 w-3 mr-1" />Add
                </Button>
              )}
            </div>
            {input.competitors.map((comp, idx) => (
              <div key={comp.id} className="border rounded-lg p-3 space-y-2 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Competitor {idx + 1}</span>
                  {input.competitors.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeCompetitor(comp.id)}><Trash2 className="h-3 w-3" /></Button>
                  )}
                </div>
                <div className="grid md:grid-cols-3 gap-2">
                  <Input placeholder="Name (optional)" value={comp.name} onChange={(e) => updateCompetitor(comp.id, "name", e.target.value)} />
                  <Input placeholder="Market share (e.g. 30%)" value={comp.marketShare} onChange={(e) => updateCompetitor(comp.id, "marketShare", e.target.value)} />
                  <Select value={comp.aggressiveness} onValueChange={(v) => updateCompetitor(comp.id, "aggressiveness", v)}>
                    <SelectTrigger><SelectValue placeholder="Aggressiveness *" /></SelectTrigger>
                    <SelectContent>
                      {aggressivenessOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={() => runAnalysis()} disabled={isAnalysing || !isFormValid} className="w-full" size="lg">
            {isAnalysing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Running Market Entry Analysis...</>
            ) : (
              <><Map className="h-4 w-4 mr-2" />Analyse Market Entry</>
            )}
          </Button>
        </CardContent>
      </Card>
    </UpgradeGate>
  );
};

export default MarketEntryAdvisor;
