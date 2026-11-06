import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, HelpCircle, FileText, ArrowRight, RotateCcw, Loader2 } from "lucide-react";
import { saveAssessmentAndActions, type AssessmentRecommendation } from "@/services/assessmentService";
import { useToast } from "@/hooks/use-toast";
import { UpgradeGate } from "@/components/tier/UpgradeGate";
interface Question {
  id: string;
  category: string;
  question: string;
  riskWeight: "high" | "medium" | "low";
}

const questions: Question[] = [
  {
    id: "termination",
    category: "Exit Clauses",
    question: "Does this contract clearly state what happens if either party wants to end it early?",
    riskWeight: "high"
  },
  {
    id: "liability",
    category: "Liability",
    question: "Is there a clear limit on your liability if something goes wrong?",
    riskWeight: "high"
  },
  {
    id: "indemnity",
    category: "Indemnification",
    question: "Do you understand what you're agreeing to cover (indemnify) for the other party?",
    riskWeight: "high"
  },
  {
    id: "payment",
    category: "Payment Terms",
    question: "Are payment terms, amounts, and due dates clearly specified?",
    riskWeight: "medium"
  },
  {
    id: "scope",
    category: "Scope of Work",
    question: "Is the scope of work or deliverables clearly defined?",
    riskWeight: "medium"
  },
  {
    id: "ip",
    category: "IP Ownership",
    question: "Is it clear who owns any intellectual property created during the contract?",
    riskWeight: "high"
  },
  {
    id: "confidentiality",
    category: "Confidentiality",
    question: "Are there reasonable confidentiality terms that protect your business information?",
    riskWeight: "medium"
  },
  {
    id: "renewal",
    category: "Auto-Renewal",
    question: "Do you understand if and how the contract auto-renews?",
    riskWeight: "low"
  },
  {
    id: "dispute",
    category: "Dispute Resolution",
    question: "Is there a clear process for resolving disputes (mediation, arbitration, court)?",
    riskWeight: "medium"
  },
  {
    id: "jurisdiction",
    category: "Jurisdiction",
    question: "Do you know which laws govern this contract and where disputes would be heard?",
    riskWeight: "low"
  }
];

type Answer = "yes" | "no" | "unsure";

const ContractRiskChecker = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedToDb, setSavedToDb] = useState(false);
  const { toast } = useToast();

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep) / questions.length) * 100;

  const handleAnswer = (answer: Answer) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAnswers({});
    setIsComplete(false);
    setSavedToDb(false);
  };

  const calculateRiskScore = () => {
    let highRisks: string[] = [];
    let mediumRisks: string[] = [];
    let lowRisks: string[] = [];

    questions.forEach(q => {
      const answer = answers[q.id];
      if (answer === "no" || answer === "unsure") {
        if (q.riskWeight === "high") highRisks.push(q.category);
        else if (q.riskWeight === "medium") mediumRisks.push(q.category);
        else lowRisks.push(q.category);
      }
    });

    return { highRisks, mediumRisks, lowRisks };
  };

  const getOverallRisk = () => {
    const { highRisks, mediumRisks } = calculateRiskScore();
    if (highRisks.length >= 2) return { level: "High", color: "text-destructive" };
    if (highRisks.length >= 1 || mediumRisks.length >= 3) return { level: "Medium", color: "text-amber-500" };
    return { level: "Low", color: "text-green-500", score: 80 };
  };

  // Convert risk level to numeric score for dashboard
  const calculateNumericScore = () => {
    const { highRisks, mediumRisks, lowRisks } = calculateRiskScore();
    // Start at 100, deduct for risks
    let score = 100;
    score -= highRisks.length * 15;
    score -= mediumRisks.length * 8;
    score -= lowRisks.length * 3;
    return Math.max(0, Math.min(100, score));
  };

  // Save to dashboard when assessment is complete
  useEffect(() => {
    if (isComplete && !savedToDb && !isSaving) {
      const saveResults = async () => {
        setIsSaving(true);
        const { highRisks, mediumRisks } = calculateRiskScore();
        const score = calculateNumericScore();
        const overall = getOverallRisk();

        // Build recommendations from identified risks
        const recommendations: AssessmentRecommendation[] = [
          ...highRisks.map(risk => ({
            title: `Review ${risk} clause with legal counsel`,
            priority: "high" as const,
            description: `The ${risk} section needs attention before signing`,
          })),
          ...mediumRisks.map(risk => ({
            title: `Clarify ${risk} terms before signing`,
            priority: "medium" as const,
            description: `Consider getting clarification on ${risk}`,
          })),
        ];

        const insights = [
          `Contract risk level: ${overall.level}`,
          `${highRisks.length} high-priority issues identified`,
          `${mediumRisks.length} areas need clarification`,
        ];

        const result = await saveAssessmentAndActions({
          domain: "compliance",
          toolId: "contract-risk-checker",
          answers,
          score,
          confidence: 1.0,
          insights,
          recommendations,
        });

        setIsSaving(false);
        setSavedToDb(true);

        if (result.success) {
          toast({
            title: "Assessment saved",
            description: "Results added to your dashboard",
          });
        }
      };

      saveResults();
    }
  }, [isComplete, savedToDb, isSaving]);


  const ContractResults = () => {
    const { highRisks, mediumRisks, lowRisks } = calculateRiskScore();
    const overall = getOverallRisk();

    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Contract Risk Assessment Report
          </CardTitle>
          <CardDescription>Review these findings with a legal professional</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-6 bg-muted/30 rounded-xl">
            <p className="text-sm text-muted-foreground mb-2">Overall Risk Level</p>
            <p className={`text-4xl font-bold ${overall.color}`}>{overall.level}</p>
            {isSaving && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center justify-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving to dashboard...
              </p>
            )}
            {savedToDb && !isSaving && (
              <p className="text-xs text-green-600 mt-2 flex items-center justify-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Saved to your dashboard
              </p>
            )}
          </div>

          {highRisks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">High Priority - Discuss with Lawyer</span>
              </div>
              <ul className="space-y-2 pl-7">
                {highRisks.map(risk => (
                  <li key={risk} className="text-sm text-muted-foreground list-disc">{risk}</li>
                ))}
              </ul>
            </div>
          )}

          {mediumRisks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-500">
                <HelpCircle className="h-5 w-5" />
                <span className="font-semibold">Medium Priority - Clarify Before Signing</span>
              </div>
              <ul className="space-y-2 pl-7">
                {mediumRisks.map(risk => (
                  <li key={risk} className="text-sm text-muted-foreground list-disc">{risk}</li>
                ))}
              </ul>
            </div>
          )}

          {lowRisks.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">Low Priority - Note for Reference</span>
              </div>
              <ul className="space-y-2 pl-7">
                {lowRisks.map(risk => (
                  <li key={risk} className="text-sm text-muted-foreground list-disc">{risk}</li>
                ))}
              </ul>
            </div>
          )}

          {highRisks.length === 0 && mediumRisks.length === 0 && lowRisks.length === 0 && (
            <div className="text-center p-6">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-lg font-medium">Looking Good!</p>
              <p className="text-sm text-muted-foreground">No major risk areas identified. Still consider a legal review for important contracts.</p>
            </div>
          )}

          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground">
              <strong>Disclaimer:</strong> This tool provides general guidance only and does not constitute legal advice. 
              Always consult with a qualified legal professional before signing important contracts.
            </p>
          </div>

          <Button onClick={handleReset} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Check Another Contract
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (isComplete) {
    return (
      <UpgradeGate
        toolId="contract-risk-checker"
        toolName="Contract Risk Checker"
        toolDescription="Analyze contracts for potential risk areas and get prioritized recommendations before signing."
        features={["10-question assessment", "Risk categorization", "Legal priority levels", "Actionable recommendations"]}
      >
        <ContractResults />
      </UpgradeGate>
    );
  }

  return (
    <UpgradeGate
      toolId="contract-risk-checker"
      toolName="Contract Risk Checker"
      toolDescription="Analyze contracts for potential risk areas and get prioritized recommendations before signing."
      features={["10-question assessment", "Risk categorization", "Legal priority levels", "Actionable recommendations"]}
    >
      <Card className="border-primary/20">
        <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Contract Risk Quick-Checker
        </CardTitle>
        <CardDescription>Answer these questions about your contract to identify potential risk areas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Question {currentStep + 1} of {questions.length}</span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="p-4 bg-muted/30 rounded-lg">
          <span className="text-xs font-medium text-primary uppercase tracking-wide">{currentQuestion.category}</span>
          <p className="mt-2 text-lg font-medium">{currentQuestion.question}</p>
        </div>

        <RadioGroup
          value={answers[currentQuestion.id] || ""}
          onValueChange={(value) => handleAnswer(value as Answer)}
          className="space-y-3"
        >
          <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
            <RadioGroupItem value="yes" id="yes" />
            <Label htmlFor="yes" className="flex-1 cursor-pointer">Yes, this is clear</Label>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
            <RadioGroupItem value="no" id="no" />
            <Label htmlFor="no" className="flex-1 cursor-pointer">No, this is missing or unclear</Label>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors">
            <RadioGroupItem value="unsure" id="unsure" />
            <Label htmlFor="unsure" className="flex-1 cursor-pointer">I'm not sure</Label>
            <HelpCircle className="h-4 w-4 text-amber-500" />
          </div>
        </RadioGroup>

        <Button 
          onClick={handleNext} 
          disabled={!answers[currentQuestion.id]}
          className="w-full"
        >
          {currentStep < questions.length - 1 ? (
            <>
              Next Question
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          ) : (
            "View Risk Assessment"
          )}
        </Button>
        </CardContent>
      </Card>
    </UpgradeGate>
  );
};

export default ContractRiskChecker;
