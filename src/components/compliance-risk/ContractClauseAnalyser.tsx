import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Loader2,
  RotateCcw,
  Shield,
  Download,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UpgradeGate } from "@/components/tier/UpgradeGate";
import { useTierAccess } from "@/hooks/useTierAccess";
import { useAuth } from "@/hooks/useAuth";
import { LocalDisclaimer } from "@/components/advisor/LocalDisclaimer";

interface ClauseAnalysis {
  clauseTitle: string;
  clauseText: string;
  riskLevel: "high" | "medium" | "low";
  explanation: string;
  recommendation: string;
  category: string;
}

interface MissingProtection {
  protection: string;
  importance: "critical" | "important" | "recommended";
  suggestedWording: string;
}

interface Amendment {
  currentWording: string;
  suggestedWording: string;
  rationale: string;
}

interface AnalysisResult {
  summary: string;
  clauses: ClauseAnalysis[];
  missingProtections: MissingProtection[];
  amendments: Amendment[];
  overallRisk: "high" | "medium" | "low";
  overallScore: number;
}

const riskConfig = {
  high: { color: "bg-destructive/10 text-destructive border-destructive/30", icon: AlertTriangle, label: "High Risk" },
  medium: { color: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: HelpCircle, label: "Medium Risk" },
  low: { color: "bg-green-500/10 text-green-600 border-green-500/30", icon: CheckCircle, label: "Low Risk" },
};

const importanceConfig = {
  critical: "bg-destructive/10 text-destructive",
  important: "bg-amber-500/10 text-amber-600",
  recommended: "bg-blue-500/10 text-blue-600",
};

const ContractClauseAnalyser = () => {
  const [contractText, setContractText] = useState("");
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [expandedClause, setExpandedClause] = useState<number | null>(null);
  const [activeResultTab, setActiveResultTab] = useState("clauses");
  const { toast } = useToast();
  const { tier } = useTierAccess();
  const { user } = useAuth();

  const isPro = tier === "pro";
  const maxClauses = isPro ? 99 : 3;
  const charCount = contractText.length;
  const pageEstimate = Math.ceil(charCount / 3000);

  const handleAnalyse = async () => {
    if (!contractText.trim() || contractText.trim().length < 50) {
      toast({ title: "Contract too short", description: "Please paste at least a few paragraphs of contract text.", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to analyse contracts.", variant: "destructive" });
      return;
    }

    setIsAnalysing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contract-analyser`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ contractText, maxClauses }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Analysis failed");
      }

      const data = await response.json();
      if (!data.success || !data.analysis) throw new Error("Invalid response");

      // For free users, limit visible clauses
      if (!isPro && data.analysis.clauses.length > 3) {
        data.analysis.clauses = data.analysis.clauses.slice(0, 3);
      }

      setResult(data.analysis);
      toast({ title: "Analysis complete", description: `${data.analysis.clauses.length} clauses identified.` });
    } catch (e: any) {
      console.error("Contract analysis error:", e);
      toast({ title: "Analysis failed", description: e.message || "Please try again.", variant: "destructive" });
    } finally {
      setIsAnalysing(false);
    }
  };

  const handleReset = () => {
    setContractText("");
    setResult(null);
    setExpandedClause(null);
  };

  const highlightClausesInText = () => {
    if (!result) return contractText;
    let highlighted = contractText;
    const sortedClauses = [...result.clauses].sort((a, b) => b.clauseText.length - a.clauseText.length);

    for (const clause of sortedClauses) {
      const excerpt = clause.clauseText.slice(0, 80);
      const idx = highlighted.toLowerCase().indexOf(excerpt.toLowerCase());
      if (idx !== -1) {
        const original = highlighted.slice(idx, idx + excerpt.length);
        const colorClass =
          clause.riskLevel === "high" ? "clause-high" :
          clause.riskLevel === "medium" ? "clause-medium" : "clause-low";
        highlighted =
          highlighted.slice(0, idx) +
          `<mark class="${colorClass}" title="${clause.clauseTitle}">${original}</mark>` +
          highlighted.slice(idx + excerpt.length);
      }
    }
    return highlighted;
  };

  // Results view
  if (result) {
    const riskCfg = riskConfig[result.overallRisk];
    const RiskIcon = riskCfg.icon;

    return (
      <UpgradeGate
        toolId="contract-clause-analyser"
        toolName="Contract Clause Analyser"
        toolDescription="AI-powered NLP contract analysis with clause-by-clause risk assessment."
        features={["Full clause analysis", "Missing protections check", "Amendment suggestions", "Inline highlighting"]}
      >
        <div className="space-y-6">
          {/* Disclaimer */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
            <Shield className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Legal Disclaimer:</strong> This analysis is informational only and does not constitute legal advice. Consult a qualified attorney for binding decisions.
            </p>
          </div>

          {/* Summary Card */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Contract Analysis Report
                </CardTitle>
                <Badge className={riskCfg.color}>
                  <RiskIcon className="h-3 w-3 mr-1" />
                  {riskCfg.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{result.summary}</p>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Contract Safety Score</span>
                    <span className="font-semibold">{result.overallScore}/100</span>
                  </div>
                  <Progress value={result.overallScore} className="h-2" />
                </div>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-destructive" /> {result.clauses.filter(c => c.riskLevel === "high").length} High</span>
                <span className="flex items-center gap-1"><HelpCircle className="h-3 w-3 text-amber-500" /> {result.clauses.filter(c => c.riskLevel === "medium").length} Medium</span>
                <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" /> {result.clauses.filter(c => c.riskLevel === "low").length} Low</span>
              </div>
            </CardContent>
          </Card>

          {/* Results Tabs */}
          <Tabs value={activeResultTab} onValueChange={setActiveResultTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="clauses">Risk Table</TabsTrigger>
              <TabsTrigger value="document">Document View</TabsTrigger>
              <TabsTrigger value="amendments">Amendments</TabsTrigger>
            </TabsList>

            {/* Clause Risk Table */}
            <TabsContent value="clauses" className="space-y-4">
              {!isPro && result.clauses.length >= 3 && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-2 text-sm">
                  <Info className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-muted-foreground">Free tier shows up to 3 clauses. <strong className="text-primary">Upgrade to Pro</strong> for full analysis.</span>
                </div>
              )}
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Clause</TableHead>
                      <TableHead className="w-[100px]">Risk Level</TableHead>
                      <TableHead>Recommendation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.clauses.map((clause, idx) => {
                      const cfg = riskConfig[clause.riskLevel];
                      const Icon = cfg.icon;
                      const isExpanded = expandedClause === idx;
                      return (
                        <>
                          <TableRow
                            key={idx}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setExpandedClause(isExpanded ? null : idx)}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                {clause.clauseTitle}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cfg.color}>
                                <Icon className="h-3 w-3 mr-1" />
                                {cfg.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{clause.recommendation}</TableCell>
                          </TableRow>
                          {isExpanded && (
                            <TableRow key={`${idx}-detail`}>
                              <TableCell colSpan={3} className="bg-muted/20">
                                <div className="space-y-3 p-2">
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Contract Excerpt</p>
                                    <p className="text-sm bg-background p-3 rounded border italic">"{clause.clauseText}"</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Why This Matters</p>
                                    <p className="text-sm">{clause.explanation}</p>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>

              {/* Missing Protections */}
              {result.missingProtections.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4 text-destructive" />
                      Missing Standard Protections
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.missingProtections.map((mp, idx) => (
                      <div key={idx} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{mp.protection}</span>
                          <Badge className={importanceConfig[mp.importance]}>{mp.importance}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded font-mono">{mp.suggestedWording}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Inline Document View */}
            <TabsContent value="document">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Colour-Coded Document View</CardTitle>
                  <CardDescription>Risk clauses are highlighted: Red = High, Amber = Medium, Green = Low</CardDescription>
                </CardHeader>
                <CardContent>
                  <style>{`
                    .clause-high { background-color: hsl(var(--destructive) / 0.2); border-bottom: 2px solid hsl(var(--destructive)); padding: 1px 2px; border-radius: 2px; }
                    .clause-medium { background-color: hsl(45 93% 47% / 0.2); border-bottom: 2px solid hsl(45 93% 47%); padding: 1px 2px; border-radius: 2px; }
                    .clause-low { background-color: hsl(142 71% 45% / 0.2); border-bottom: 2px solid hsl(142 71% 45%); padding: 1px 2px; border-radius: 2px; }
                  `}</style>
                  <ScrollArea className="h-[400px] border rounded-lg p-4">
                    <div
                      className="text-sm leading-relaxed whitespace-pre-wrap font-mono"
                      dangerouslySetInnerHTML={{ __html: highlightClausesInText() }}
                    />
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Amendments */}
            <TabsContent value="amendments">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recommended Amendments</CardTitle>
                  <CardDescription>Suggested changes to strengthen your position</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.amendments.map((amendment, idx) => (
                    <div key={idx} className="border rounded-lg p-4 space-y-3">
                      <Badge variant="outline" className="bg-primary/10 text-primary">Amendment {idx + 1}</Badge>
                      <div>
                        <p className="text-xs font-medium text-destructive uppercase tracking-wide mb-1">Current Wording</p>
                        <p className="text-sm bg-destructive/5 p-3 rounded border border-destructive/20 line-through italic">"{amendment.currentWording}"</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1">Suggested Replacement</p>
                        <p className="text-sm bg-green-500/5 p-3 rounded border border-green-500/20 italic">"{amendment.suggestedWording}"</p>
                      </div>
                      <p className="text-sm text-muted-foreground"><strong>Rationale:</strong> {amendment.rationale}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Local Intelligence Disclaimer */}
          <LocalDisclaimer />

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handleReset} variant="outline" className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              Analyse Another Contract
            </Button>
          </div>
        </div>
      </UpgradeGate>
    );
  }

  // Input view
  return (
    <UpgradeGate
      toolId="contract-clause-analyser"
      toolName="Contract Clause Analyser"
      toolDescription="AI-powered NLP contract analysis with clause-by-clause risk assessment."
      features={["Full clause analysis", "Missing protections check", "Amendment suggestions", "Inline highlighting"]}
    >
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Contract Upload & Analyse
          </CardTitle>
          <CardDescription>
            Paste your contract text below for AI-powered clause analysis.
            {!isPro && " Free tier: up to 3 clauses flagged. Pro: unlimited analysis."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Disclaimer */}
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
            <Shield className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Disclaimer:</strong> This analysis is informational only and does not constitute legal advice. Consult a qualified attorney for binding decisions.
            </p>
          </div>

          <Textarea
            placeholder="Paste your contract text here... (minimum 50 characters)"
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
            className="min-h-[250px] font-mono text-sm"
          />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{charCount.toLocaleString()} characters (~{pageEstimate} page{pageEstimate !== 1 ? "s" : ""})</span>
            <span>{isPro ? "Unlimited pages" : "Free: max 20 pages"}</span>
          </div>

          <Button
            onClick={handleAnalyse}
            disabled={isAnalysing || contractText.trim().length < 50}
            className="w-full"
            size="lg"
          >
            {isAnalysing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analysing contract... this may take a moment
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Analyse Contract
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </UpgradeGate>
  );
};

export default ContractClauseAnalyser;
