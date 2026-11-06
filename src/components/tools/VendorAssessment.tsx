import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft, Download, AlertTriangle, CheckCircle, Building, Shield, FileText, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UpgradeGate } from "@/components/tier/UpgradeGate";

interface Question {
  id: string;
  category: string;
  question: string;
  options: { value: number; label: string }[];
  weight: number;
}

const questions: Question[] = [
  // Company Information
  {
    id: "years_operating",
    category: "Company Profile",
    question: "How long has this vendor been in operation?",
    options: [
      { value: 1, label: "Less than 1 year" },
      { value: 2, label: "1-3 years" },
      { value: 3, label: "3-5 years" },
      { value: 4, label: "5-10 years" },
      { value: 5, label: "More than 10 years" },
    ],
    weight: 1,
  },
  {
    id: "financial_stability",
    category: "Company Profile",
    question: "How would you rate their financial stability?",
    options: [
      { value: 1, label: "Unknown / Concerns" },
      { value: 2, label: "Limited visibility" },
      { value: 3, label: "Appears stable" },
      { value: 4, label: "Financially healthy" },
      { value: 5, label: "Strong financials / Audited" },
    ],
    weight: 2,
  },
  // Operational
  {
    id: "delivery_reliability",
    category: "Operational",
    question: "What is their track record for on-time delivery?",
    options: [
      { value: 1, label: "Poor / Frequent delays" },
      { value: 2, label: "Inconsistent" },
      { value: 3, label: "Usually reliable" },
      { value: 4, label: "Very reliable" },
      { value: 5, label: "Excellent / Never missed" },
    ],
    weight: 2,
  },
  {
    id: "quality_control",
    category: "Operational",
    question: "Do they have documented quality control processes?",
    options: [
      { value: 1, label: "None / Unknown" },
      { value: 2, label: "Basic processes" },
      { value: 3, label: "Documented QC" },
      { value: 4, label: "Certified QC (ISO 9001)" },
      { value: 5, label: "Industry-leading QC" },
    ],
    weight: 1.5,
  },
  {
    id: "backup_capability",
    category: "Operational",
    question: "Can they scale or provide backup if demand increases?",
    options: [
      { value: 1, label: "No capacity" },
      { value: 2, label: "Limited capacity" },
      { value: 3, label: "Some flexibility" },
      { value: 4, label: "Good scalability" },
      { value: 5, label: "Highly scalable" },
    ],
    weight: 1.5,
  },
  // Compliance & Security
  {
    id: "data_protection",
    category: "Compliance & Security",
    question: "How do they handle your data and confidential information?",
    options: [
      { value: 1, label: "No data policy" },
      { value: 2, label: "Basic policy" },
      { value: 3, label: "GDPR compliant" },
      { value: 4, label: "Strong data governance" },
      { value: 5, label: "Certified (ISO 27001)" },
    ],
    weight: 2,
  },
  {
    id: "insurance",
    category: "Compliance & Security",
    question: "Do they carry appropriate business insurance?",
    options: [
      { value: 1, label: "Unknown" },
      { value: 2, label: "Basic coverage" },
      { value: 3, label: "Standard coverage" },
      { value: 4, label: "Comprehensive coverage" },
      { value: 5, label: "Full coverage + proof provided" },
    ],
    weight: 1.5,
  },
  {
    id: "cybersecurity",
    category: "Compliance & Security",
    question: "What cybersecurity measures do they have in place?",
    options: [
      { value: 1, label: "None / Unknown" },
      { value: 2, label: "Basic measures" },
      { value: 3, label: "Standard security" },
      { value: 4, label: "Strong security posture" },
      { value: 5, label: "Certified (Cyber Essentials+)" },
    ],
    weight: 2,
  },
  // Relationship
  {
    id: "communication",
    category: "Relationship",
    question: "How responsive is their communication?",
    options: [
      { value: 1, label: "Very slow / Unreliable" },
      { value: 2, label: "Slow" },
      { value: 3, label: "Adequate" },
      { value: 4, label: "Good / Same-day" },
      { value: 5, label: "Excellent / Proactive" },
    ],
    weight: 1,
  },
  {
    id: "contract_terms",
    category: "Relationship",
    question: "Are contract terms fair and protective of your interests?",
    options: [
      { value: 1, label: "Unfavourable" },
      { value: 2, label: "Slightly unfavourable" },
      { value: 3, label: "Standard terms" },
      { value: 4, label: "Favourable" },
      { value: 5, label: "Very protective" },
    ],
    weight: 1.5,
  },
];

const categories = [
  { id: "Company Profile", icon: Building },
  { id: "Operational", icon: FileText },
  { id: "Compliance & Security", icon: Shield },
  { id: "Relationship", icon: Users },
];

const VendorAssessment = () => {
  const [vendorName, setVendorName] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const uniqueCategories = [...new Set(questions.map((q) => q.category))];
  const currentCategory = uniqueCategories[currentStep];
  const categoryQuestions = questions.filter((q) => q.category === currentCategory);

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const canProceed = () => {
    return categoryQuestions.every((q) => answers[q.id] !== undefined);
  };

  const nextStep = () => {
    if (currentStep < uniqueCategories.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowResults(true);
    }
  };

  const prevStep = () => {
    if (showResults) {
      setShowResults(false);
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateScore = () => {
    let totalScore = 0;
    let maxScore = 0;

    questions.forEach((q) => {
      const answer = answers[q.id] || 0;
      totalScore += answer * q.weight;
      maxScore += 5 * q.weight;
    });

    return Math.round((totalScore / maxScore) * 100);
  };

  const getCategoryScore = (category: string) => {
    const catQuestions = questions.filter((q) => q.category === category);
    let total = 0;
    let max = 0;

    catQuestions.forEach((q) => {
      total += (answers[q.id] || 0) * q.weight;
      max += 5 * q.weight;
    });

    return Math.round((total / max) * 100);
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: "Low Risk", color: "text-green-600 bg-green-100", recommendation: "This vendor appears to be a reliable partner." };
    if (score >= 60) return { level: "Medium Risk", color: "text-amber-600 bg-amber-100", recommendation: "Consider additional due diligence or contract protections." };
    if (score >= 40) return { level: "High Risk", color: "text-orange-600 bg-orange-100", recommendation: "Significant concerns. Explore alternatives or require improvements." };
    return { level: "Critical Risk", color: "text-red-600 bg-red-100", recommendation: "Not recommended without major changes or risk mitigation." };
  };

  const exportAssessment = () => {
    const score = calculateScore();
    const { level, recommendation } = getRiskLevel(score);

    let report = `# Vendor Risk Assessment Report\n\n`;
    report += `**Vendor Name:** ${vendorName || "Not specified"}\n`;
    report += `**Assessment Date:** ${new Date().toLocaleDateString()}\n\n`;
    report += `## Overall Score: ${score}% - ${level}\n\n`;
    report += `**Recommendation:** ${recommendation}\n\n---\n\n`;

    uniqueCategories.forEach((cat) => {
      report += `### ${cat}\n`;
      report += `**Score:** ${getCategoryScore(cat)}%\n\n`;
      
      questions.filter((q) => q.category === cat).forEach((q) => {
        const answer = answers[q.id];
        const option = q.options.find((o) => o.value === answer);
        report += `- **${q.question}**\n  Answer: ${option?.label || "Not answered"}\n\n`;
      });
    });

    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vendor-assessment-${vendorName || "unnamed"}-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Assessment exported!" });
  };

  const startOver = () => {
    setVendorName("");
    setAnswers({});
    setCurrentStep(0);
    setShowResults(false);
  };

  if (showResults) {
    const score = calculateScore();
    const { level, color, recommendation } = getRiskLevel(score);

    return (
      <UpgradeGate toolId="vendor-assessment" toolName="Vendor Risk Assessment" toolDescription="Evaluate supplier reliability and risk across key dimensions.">
        <div className="space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Assessment Complete</CardTitle>
            <CardDescription>{vendorName || "Vendor"} Risk Assessment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">{score}%</div>
              <Badge className={`text-lg px-4 py-1 ${color}`}>{level}</Badge>
              <p className="text-muted-foreground mt-4 max-w-md mx-auto">{recommendation}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {uniqueCategories.map((cat) => {
                const catScore = getCategoryScore(cat);
                const Icon = categories.find((c) => c.id === cat)?.icon || Building;
                
                return (
                  <div key={cat} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{cat}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={catScore} className="flex-1 h-2" />
                      <span className="text-sm font-medium w-12 text-right">{catScore}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 justify-center pt-4">
              <Button variant="outline" onClick={prevStep}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Review Answers
              </Button>
              <Button onClick={exportAssessment}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button variant="outline" onClick={startOver}>
                Start New Assessment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      </UpgradeGate>
    );
  }

  return (
    <UpgradeGate toolId="vendor-assessment" toolName="Vendor Risk Assessment" toolDescription="Evaluate supplier reliability and risk across key dimensions.">
    <div className="space-y-6">
      {/* Vendor Name */}
      {currentStep === 0 && (
        <Card>
          <CardContent className="pt-6">
            <Label htmlFor="vendorName">Vendor / Supplier Name</Label>
            <Input
              id="vendorName"
              placeholder="Enter the vendor name"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="mt-2"
            />
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      <div className="flex items-center gap-2">
        {uniqueCategories.map((cat, idx) => {
          const Icon = categories.find((c) => c.id === cat)?.icon || Building;
          const isComplete = questions
            .filter((q) => q.category === cat)
            .every((q) => answers[q.id] !== undefined);
          const isCurrent = idx === currentStep;

          return (
            <div
              key={cat}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                isCurrent
                  ? "bg-primary text-primary-foreground"
                  : isComplete
                  ? "bg-green-100 text-green-700"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isComplete ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              <span className="hidden md:inline">{cat}</span>
            </div>
          );
        })}
      </div>

      {/* Questions */}
      <Card>
        <CardHeader>
          <CardTitle>{currentCategory}</CardTitle>
          <CardDescription>
            Question {categoryQuestions.findIndex((q) => answers[q.id] === undefined) + 1 || categoryQuestions.length} of {categoryQuestions.length}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {categoryQuestions.map((question) => (
            <div key={question.id} className="space-y-3">
              <Label className="text-base">{question.question}</Label>
              <RadioGroup
                value={answers[question.id]?.toString()}
                onValueChange={(v) => handleAnswer(question.id, parseInt(v))}
                className="space-y-2"
              >
                {question.options.map((option) => (
                  <div
                    key={option.value}
                    className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      answers[question.id] === option.value
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => handleAnswer(question.id, option.value)}
                  >
                    <RadioGroupItem value={option.value.toString()} id={`${question.id}-${option.value}`} />
                    <Label htmlFor={`${question.id}-${option.value}`} className="flex-1 cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <Button onClick={nextStep} disabled={!canProceed()}>
              {currentStep === uniqueCategories.length - 1 ? "View Results" : "Next"}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    </UpgradeGate>
  );
};

export default VendorAssessment;