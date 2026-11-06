import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, Loader2, RotateCcw, Shield, AlertTriangle, Lightbulb, Handshake,
  TrendingDown, CheckCircle, Zap, Brain,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UpgradeGate } from "@/components/tier/UpgradeGate";
import { useAuth } from "@/hooks/useAuth";
import { LocalDisclaimer } from "@/components/advisor/LocalDisclaimer";

/* ── Types ── */
interface CollaborationInput {
  partyAContribution: string;
  partyBContribution: string;
  cooperationGainA: string;
  cooperationGainB: string;
  defectionGainA: string;
  defectionGainB: string;
  lossIfBetrayedA: string;
  lossIfBetrayedB: string;
  partnerName: string;
  scenarioDescription: string;
}

interface PayoffCell { a: number; b: number }

interface CollaborationResult {
  payoffMatrix: {
    labels: { rows: string[]; cols: string[] };
    cells: PayoffCell[][];
  };
  gameType: string;
  gameTypeExplanation: string;
  defectionRiskScore: number;
  defectionRiskExplanation: string;
  contractualSafeguards: Array<{ safeguard: string; reasoning: string }>;
  reputationMechanisms: Array<{ mechanism: string; description: string }>;
  cognitiveBiasWarnings: Array<{ bias: string; warning: string }>;
  overallRecommendation: string;
  complianceNote: string;
}

const emptyInput: CollaborationInput = {
  partyAContribution: "",
  partyBContribution: "",
  cooperationGainA: "",
  cooperationGainB: "",
  defectionGainA: "",
  defectionGainB: "",
  lossIfBetrayedA: "",
  lossIfBetrayedB: "",
  partnerName: "",
  scenarioDescription: "",
};

/* ── Results sub-component ── */
const ResultsView = ({ result, onReset }: { result: CollaborationResult; onReset: () => void }) => {
  const riskColor = result.defectionRiskScore >= 70
    ? "text-destructive" : result.defectionRiskScore >= 40
    ? "text-amber-600" : "text-green-600";

  const riskBg = result.defectionRiskScore >= 70
    ? "bg-destructive/10 border-destructive/20" : result.defectionRiskScore >= 40
    ? "bg-amber-500/10 border-amber-500/20" : "bg-green-500/10 border-green-500/20";

  return (
    <div className="space-y-6">
      {/* Powered-by badge */}
      <div className="flex items-center justify-center">
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
          <Zap className="h-3 w-3 mr-1" />
          Powered by Game Theory — Prisoner's Dilemma Analysis
        </Badge>
      </div>

      {/* Compliance Note */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
        <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Compliance Note:</strong> {result.complianceNote}
        </p>
      </div>

      {/* Game Type */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Handshake className="h-5 w-5 text-primary" />
            Game Classification: {result.gameType}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{result.gameTypeExplanation}</p>
        </CardContent>
      </Card>

      {/* Payoff Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payoff Matrix</CardTitle>
          <CardDescription>Values represent relative payoff. (Your payoff, Partner payoff)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">You ↓ / Partner →</TableHead>
                {result.payoffMatrix.labels.cols.map((c, i) => (
                  <TableHead key={i} className="text-center">{c}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.payoffMatrix.labels.rows.map((r, ri) => (
                <TableRow key={ri}>
                  <TableCell className="font-medium">{r}</TableCell>
                  {result.payoffMatrix.cells[ri]?.map((cell, ci) => (
                    <TableCell key={ci} className="text-center">
                      <span className="font-semibold">{cell.a}</span>
                      <span className="text-muted-foreground">, </span>
                      <span className="font-semibold">{cell.b}</span>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Defection Risk Score */}
      <Card className={`border ${riskBg}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingDown className={`h-5 w-5 ${riskColor}`} />
            Defection Risk Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-bold ${riskColor}`}>{result.defectionRiskScore}</div>
            <span className="text-sm text-muted-foreground">/ 100</span>
            <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  result.defectionRiskScore >= 70 ? "bg-destructive" :
                  result.defectionRiskScore >= 40 ? "bg-amber-500" : "bg-green-500"
                }`}
                style={{ width: `${result.defectionRiskScore}%` }}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{result.defectionRiskExplanation}</p>
        </CardContent>
      </Card>

      {/* Contractual Safeguards */}
      <Card className="border-green-500/20 bg-green-500/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Recommended Contractual Safeguards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {result.contractualSafeguards.map((s, i) => (
            <div key={i} className="border border-green-500/10 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium">{s.safeguard}</p>
              <p className="text-xs text-muted-foreground">{s.reasoning}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Reputation Mechanisms */}
      {result.reputationMechanisms.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Reputation Tracking Mechanisms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.reputationMechanisms.map((m, i) => (
              <div key={i} className="flex gap-2 text-sm">
                <Badge variant="outline" className="shrink-0">{i + 1}</Badge>
                <div>
                  <span className="font-medium">{m.mechanism}:</span>{" "}
                  <span className="text-muted-foreground">{m.description}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Cognitive Bias Warnings */}
      {result.cognitiveBiasWarnings.length > 0 && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-5 w-5 text-amber-600" />
              Cognitive Bias Alerts
            </CardTitle>
            <CardDescription>Biases that may be inflating your optimism about this partnership</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.cognitiveBiasWarnings.map((b, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">{b.bias}:</span>{" "}
                  <span className="text-muted-foreground">{b.warning}</span>
                </div>
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

      <LocalDisclaimer />

      <Button onClick={onReset} variant="outline" className="w-full">
        <RotateCcw className="h-4 w-4 mr-2" />
        Analyse Another Partnership
      </Button>
    </div>
  );
};

/* ── Main Component ── */
const CollaborationRiskAuditor = () => {
  const [input, setInput] = useState<CollaborationInput>(emptyInput);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [result, setResult] = useState<CollaborationResult | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const update = (field: keyof CollaborationInput, value: string) =>
    setInput((prev) => ({ ...prev, [field]: value }));

  const isFormValid =
    input.scenarioDescription.trim().length > 10 &&
    input.partyAContribution.trim().length > 3 &&
    input.partyBContribution.trim().length > 3 &&
    input.cooperationGainA.trim().length > 3 &&
    input.cooperationGainB.trim().length > 3;

  const handleAnalyse = async () => {
    if (!user) { toast({ title: "Sign in required", variant: "destructive" }); return; }
    if (!isFormValid) { toast({ title: "Please fill all required fields", variant: "destructive" }); return; }

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
          body: JSON.stringify({ type: "prisoner_dilemma", collaborationData: input }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Analysis failed");
      }

      const data = await response.json();
      setResult(data);
      toast({ title: "Analysis complete", description: "Partnership risk report ready." });
    } catch (e: any) {
      console.error("Collaboration analysis error:", e);
      toast({ title: "Analysis failed", description: e.message, variant: "destructive" });
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleReset = () => { setInput(emptyInput); setResult(null); };

  if (result) {
    return (
      <UpgradeGate
        toolId="collaboration-risk-auditor"
        toolName="Collaboration Risk Auditor"
        toolDescription="Prisoner's Dilemma partnership risk analysis with defection scoring and contractual safeguards."
        features={["Payoff matrix", "Defection risk score", "Contractual safeguards", "Cognitive bias alerts"]}
      >
        <ResultsView result={result} onReset={handleReset} />
      </UpgradeGate>
    );
  }

  return (
    <UpgradeGate
      toolId="collaboration-risk-auditor"
      toolName="Collaboration Risk Auditor"
      toolDescription="Apply Prisoner's Dilemma modelling to evaluate whether a partnership will hold or one side will defect."
      features={["Cooperation vs Defection matrix", "Defection risk score 0-100", "Contractual safeguard recommendations", "Cognitive bias detection"]}
    >
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-primary" />
            Collaboration Risk Auditor
          </CardTitle>
          <CardDescription>
            Apply Prisoner's Dilemma game theory to evaluate a business partnership and quantify defection risk.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scenario */}
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Partner / Counterparty Name</Label>
                <Input
                  placeholder="e.g. ABC Logistics"
                  value={input.partnerName}
                  onChange={(e) => update("partnerName", e.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Describe the Partnership Scenario *</Label>
                <Textarea
                  placeholder="e.g. Joint distribution agreement where we provide warehousing and they provide fleet and driver network…"
                  value={input.scenarioDescription}
                  onChange={(e) => update("scenarioDescription", e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>

          {/* Contributions */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">What each party contributes *</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Your Contribution</Label>
                <Input placeholder="e.g. Warehouse, inventory system, staff" value={input.partyAContribution} onChange={(e) => update("partyAContribution", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Partner's Contribution</Label>
                <Input placeholder="e.g. Fleet, drivers, client network" value={input.partyBContribution} onChange={(e) => update("partyBContribution", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Cooperation Gains */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Gains if cooperation succeeds *</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Your Gain</Label>
                <Input placeholder="e.g. 40% revenue increase, new market access" value={input.cooperationGainA} onChange={(e) => update("cooperationGainA", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Partner's Gain</Label>
                <Input placeholder="e.g. Lower warehousing costs, faster delivery" value={input.cooperationGainB} onChange={(e) => update("cooperationGainB", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Defection Gains */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Gains from acting independently (defecting)</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Your Gain if You Defect</Label>
                <Input placeholder="e.g. Keep all IP, no revenue share" value={input.defectionGainA} onChange={(e) => update("defectionGainA", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Partner's Gain if They Defect</Label>
                <Input placeholder="e.g. Copy your processes, bypass agreement" value={input.defectionGainB} onChange={(e) => update("defectionGainB", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Loss if Betrayed */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Loss if the other party defects while you cooperate</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Your Loss if Partner Defects</Label>
                <Input placeholder="e.g. Sunk investment, client loss" value={input.lossIfBetrayedA} onChange={(e) => update("lossIfBetrayedA", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Partner's Loss if You Defect</Label>
                <Input placeholder="e.g. No warehouse access, stranded fleet" value={input.lossIfBetrayedB} onChange={(e) => update("lossIfBetrayedB", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Guardrail */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
            <Brain className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Behavioural Layer:</strong> The AI will flag cognitive biases that may inflate your optimism about this partnership (e.g. familiarity bias, sunk cost effect).
            </p>
          </div>

          <Button onClick={handleAnalyse} disabled={isAnalysing || !isFormValid} className="w-full" size="lg">
            {isAnalysing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Running Prisoner's Dilemma Analysis...</>
            ) : (
              <><Handshake className="h-4 w-4 mr-2" />Analyse Partnership Risk</>
            )}
          </Button>
        </CardContent>
      </Card>
    </UpgradeGate>
  );
};

export default CollaborationRiskAuditor;
