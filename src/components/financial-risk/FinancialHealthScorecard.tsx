import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Heart, ArrowRight, AlertTriangle, CheckCircle2, TrendingUp, Shield, PiggyBank, FileText, Loader2, BarChart3, Brain, MapPin } from "lucide-react";
import { useAssessmentSave } from "@/hooks/useAssessmentSave";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { PDFExportButton } from "@/components/advisor/PDFExportButton";
import type { PDFReportData } from "@/lib/pdfExport";

interface Question {
  id: string;
  category: "liquidity" | "profitability" | "efficiency" | "preparedness";
  question: string;
  options: { value: number; label: string }[];
}

const questions: Question[] = [
  { id: "q1", category: "liquidity", question: "How many months could your business survive with zero revenue?", options: [{ value: 0, label: "Less than 1 month" }, { value: 1, label: "1-2 months" }, { value: 2, label: "3-5 months" }, { value: 3, label: "6+ months" }] },
  { id: "q2", category: "liquidity", question: "Do you have access to a line of credit or emergency funding?", options: [{ value: 0, label: "No, and haven't considered it" }, { value: 1, label: "No, but I know my options" }, { value: 2, label: "Yes, but never used it" }, { value: 3, label: "Yes, with a clear borrowing strategy" }] },
  { id: "q3", category: "profitability", question: "How well do you understand your profit margins by product/service?", options: [{ value: 0, label: "I don't track this" }, { value: 1, label: "I have a general sense" }, { value: 2, label: "I know roughly which are most profitable" }, { value: 3, label: "I have detailed margin data I review regularly" }] },
  { id: "q4", category: "profitability", question: "Is your revenue diversified across multiple customers?", options: [{ value: 0, label: "One customer is 50%+ of revenue" }, { value: 1, label: "Top 3 customers are 50%+ of revenue" }, { value: 2, label: "No single customer is more than 20%" }, { value: 3, label: "Highly diversified with many revenue streams" }] },
  { id: "q5", category: "efficiency", question: "How quickly do you collect payments from customers?", options: [{ value: 0, label: "60+ days on average" }, { value: 1, label: "30-60 days" }, { value: 2, label: "15-30 days" }, { value: 3, label: "Less than 15 days or payment upfront" }] },
  { id: "q6", category: "efficiency", question: "Do you review your cash flow forecast regularly?", options: [{ value: 0, label: "Never or don't have one" }, { value: 1, label: "Occasionally, when problems arise" }, { value: 2, label: "Monthly" }, { value: 3, label: "Weekly" }] },
  { id: "q7", category: "preparedness", question: "How prepared are you for your next tax payment?", options: [{ value: 0, label: "I'll figure it out when it's due" }, { value: 1, label: "I set aside money sporadically" }, { value: 2, label: "I have a rough estimate saved" }, { value: 3, label: "I have a dedicated tax account with scheduled transfers" }] },
  { id: "q8", category: "preparedness", question: "When did you last meet with your accountant/financial advisor?", options: [{ value: 0, label: "Only at tax time" }, { value: 1, label: "6-12 months ago" }, { value: 2, label: "Within the last 3 months" }, { value: 3, label: "We have regular scheduled meetings" }] },
];

const categoryIcons = { liquidity: PiggyBank, profitability: TrendingUp, efficiency: FileText, preparedness: Shield };
const categoryLabels = { liquidity: "Liquidity", profitability: "Profitability", efficiency: "Efficiency", preparedness: "Risk Preparedness" };

interface AIAnalysis {
  narratives: { liquidity: string; profitability: string; efficiency: string };
  roadmap: Array<{ metric: string; action: string; target: string; timeframe: string; priority: "high" | "medium" | "low" }>;
}

interface BenchmarkData {
  liquidity_median: number;
  profitability_median: number;
  efficiency_median: number;
  preparedness_median: number;
}

const FinancialHealthScorecard = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const { saveAssessment, isSaving, savedToDb, reset: resetSave } = useAssessmentSave();
  const [benchmarks, setBenchmarks] = useState<BenchmarkData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [questions[currentQuestion].id]: parseInt(value) });
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) setCurrentQuestion(currentQuestion + 1);
    else setShowResults(true);
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
  };

  const calculateScores = () => {
    const categoryScores: Record<string, { score: number; max: number }> = {
      liquidity: { score: 0, max: 0 }, profitability: { score: 0, max: 0 },
      efficiency: { score: 0, max: 0 }, preparedness: { score: 0, max: 0 },
    };
    questions.forEach((q) => {
      categoryScores[q.category].max += 3;
      categoryScores[q.category].score += answers[q.id] || 0;
    });
    return categoryScores;
  };

  const getTotalScore = () => {
    const scores = calculateScores();
    const total = Object.values(scores).reduce((acc, s) => acc + s.score, 0);
    const max = Object.values(scores).reduce((acc, s) => acc + s.max, 0);
    return Math.round((total / max) * 100);
  };

  const getRecommendations = () => {
    const scores = calculateScores();
    const recommendations: string[] = [];
    if (scores.liquidity.score / scores.liquidity.max < 0.5) {
      recommendations.push("Build a 3-month cash reserve as your top priority");
      recommendations.push("Explore setting up a business line of credit before you need it");
    }
    if (scores.profitability.score / scores.profitability.max < 0.5) {
      recommendations.push("Analyse profit margins by product/service to focus on winners");
      recommendations.push("Work on diversifying your customer base to reduce concentration risk");
    }
    if (scores.efficiency.score / scores.efficiency.max < 0.5) {
      recommendations.push("Implement weekly cash flow forecasting");
      recommendations.push("Tighten payment terms or offer early-payment incentives");
    }
    if (scores.preparedness.score / scores.preparedness.max < 0.5) {
      recommendations.push("Set up a dedicated tax savings account with automatic transfers");
      recommendations.push("Schedule a proactive meeting with your accountant to discuss strategy");
    }
    return recommendations.length > 0 ? recommendations : ["Great work! Continue monitoring and optimizing your financial health."];
  };

  // Fetch benchmarks and AI analysis when results shown
  useEffect(() => {
    if (!showResults) return;

    const fetchBenchmarksAndAI = async () => {
      // Fetch benchmarks
      const { data: { user } } = await supabase.auth.getUser();
      let industry = "general";
      let size = "1-10";

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).maybeSingle();
        if (profile?.company_id) {
          const { data: company } = await supabase.from("companies").select("industry, size").eq("id", profile.company_id).maybeSingle();
          if (company) { industry = company.industry || "general"; size = company.size || "1-10"; }
        }
      }

      // Try exact match, then fall back to general
      let { data: benchmarkData } = await supabase
        .from("industry_benchmarks")
        .select("liquidity_median, profitability_median, efficiency_median, preparedness_median")
        .eq("industry_code", industry)
        .eq("business_size", size)
        .maybeSingle();

      if (!benchmarkData) {
        const { data: fallback } = await supabase
          .from("industry_benchmarks")
          .select("liquidity_median, profitability_median, efficiency_median, preparedness_median")
          .eq("industry_code", "general")
          .eq("business_size", size)
          .maybeSingle();
        benchmarkData = fallback;
      }

      if (benchmarkData) setBenchmarks(benchmarkData);

      // AI narrative + roadmap
      if (user) {
        setAiLoading(true);
        try {
          const scores = calculateScores();
          const categoryPercentages = Object.fromEntries(
            Object.entries(scores).map(([k, v]) => [k, Math.round((v.score / v.max) * 100)])
          );

          const { data: session } = await supabase.auth.getSession();
          const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrf-agent`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.session?.access_token}`,
            },
            body: JSON.stringify({
              type: "financial_health_analysis",
              financialHealthData: {
                scores: categoryPercentages,
                totalScore: getTotalScore(),
                benchmarks: benchmarkData,
                industry,
                size,
              },
            }),
          });

          if (resp.ok) {
            const data = await resp.json();
            setAiAnalysis(data);
          }
        } catch (e) {
          console.error("AI analysis failed:", e);
        } finally {
          setAiLoading(false);
        }
      }
    };

    fetchBenchmarksAndAI();
  }, [showResults]);

  // Save to dashboard when results are shown
  useEffect(() => {
    if (showResults && !savedToDb && !isSaving) {
      const scores = calculateScores();
      const totalScore = getTotalScore();
      const recommendations: Array<{ title: string; priority: "high" | "medium"; description: string }> = [];
      Object.entries(scores).forEach(([category, { score, max }]) => {
        const percentage = score / max;
        if (percentage < 0.5) {
          recommendations.push({ title: `Improve ${categoryLabels[category as keyof typeof categoryLabels]}`, priority: "high", description: `Current score: ${Math.round(percentage * 100)}% - needs immediate attention` });
        } else if (percentage < 0.75) {
          recommendations.push({ title: `Strengthen ${categoryLabels[category as keyof typeof categoryLabels]}`, priority: "medium", description: `Current score: ${Math.round(percentage * 100)}% - room for improvement` });
        }
      });
      const insights = [
        `Financial health score: ${totalScore}/100`,
        ...Object.entries(scores).map(([cat, { score, max }]) =>
          `${categoryLabels[cat as keyof typeof categoryLabels]}: ${Math.round((score / max) * 100)}%`
        ),
      ];
      saveAssessment({ domain: "financial", toolId: "financial-health-scorecard", answers: answers as Record<string, unknown>, score: totalScore, confidence: 1.0, insights, recommendations });
    }
  }, [showResults, savedToDb, isSaving]);

  const resetAssessment = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
    resetSave();
    setBenchmarks(null);
    setAiAnalysis(null);
  };

  const totalScore = getTotalScore();
  const scores = calculateScores();

  // Build benchmark chart data
  const benchmarkChartData = benchmarks
    ? (["liquidity", "profitability", "efficiency"] as const).map((cat) => ({
        category: categoryLabels[cat],
        "Your Score": Math.round((scores[cat].score / scores[cat].max) * 100),
        "Industry Median": benchmarks[`${cat}_median` as keyof BenchmarkData],
      }))
    : [];

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Heart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="font-display text-xl">Financial Health Scorecard</CardTitle>
            <CardDescription>AI-enhanced assessment with peer benchmarking and improvement roadmap</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!showResults ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Question {currentQuestion + 1} of {questions.length}</span>
                <span className="font-medium">{categoryLabels[questions[currentQuestion].category]}</span>
              </div>
              <Progress value={((currentQuestion + 1) / questions.length) * 100} />
            </div>
            <div className="p-4 bg-secondary rounded-lg">
              <p className="font-semibold text-lg mb-4">{questions[currentQuestion].question}</p>
              <RadioGroup value={answers[questions[currentQuestion].id]?.toString() || ""} onValueChange={handleAnswer} className="space-y-3">
                {questions[currentQuestion].options.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-background transition-colors">
                    <RadioGroupItem value={option.value.toString()} id={`option-${option.value}`} />
                    <Label htmlFor={`option-${option.value}`} className="cursor-pointer flex-1">{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={prevQuestion} disabled={currentQuestion === 0}>Previous</Button>
              <Button onClick={nextQuestion} disabled={answers[questions[currentQuestion].id] === undefined}>
                {currentQuestion === questions.length - 1 ? "See Results" : "Next"} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Your Financial Health Score</p>
              <p className="text-6xl font-bold text-primary mb-2">{totalScore}</p>
              <p className="text-sm">
                {totalScore >= 75 ? (
                  <span className="text-green-600 flex items-center justify-center gap-1"><CheckCircle2 className="h-4 w-4" /> Strong Financial Health</span>
                ) : totalScore >= 50 ? (
                  <span className="text-yellow-600 flex items-center justify-center gap-1"><TrendingUp className="h-4 w-4" /> Moderate - Room for Improvement</span>
                ) : (
                  <span className="text-destructive flex items-center justify-center gap-1"><AlertTriangle className="h-4 w-4" /> Needs Attention</span>
                )}
              </p>
            </div>

            {/* Category Breakdown */}
            <div className="space-y-3">
              <h4 className="font-semibold">Score Breakdown</h4>
              {(["liquidity", "profitability", "efficiency", "preparedness"] as const).map((category) => {
                const Icon = categoryIcons[category];
                const percentage = Math.round((scores[category].score / scores[category].max) * 100);
                return (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><span>{categoryLabels[category]}</span></div>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>

            {/* 1. PEER BENCHMARKING PANEL */}
            {benchmarks && (
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Peer Benchmarking: Your Score vs Industry Median</h4>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={benchmarkChartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Your Score" radius={[4, 4, 0, 0]}>
                      {benchmarkChartData.map((entry, index) => (
                        <Cell key={index} fill={entry["Your Score"] >= entry["Industry Median"] ? "hsl(var(--primary))" : "hsl(var(--destructive))"} />
                      ))}
                    </Bar>
                    <Bar dataKey="Industry Median" fill="hsl(var(--muted-foreground) / 0.4)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground">Based on anonymised data from SMEs in your industry and size band.</p>
              </div>
            )}

            {/* 2. AI NARRATIVE GENERATION */}
            {aiLoading && (
              <div className="p-6 border rounded-lg flex items-center gap-3 justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Generating AI-powered analysis...</span>
              </div>
            )}
            {aiAnalysis?.narratives && (
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">AI Executive Narrative</h4>
                </div>
                {(["liquidity", "profitability", "efficiency"] as const).map((cat) => (
                  <div key={cat} className="space-y-1">
                    <p className="text-sm font-medium text-primary">{categoryLabels[cat]}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{aiAnalysis.narratives[cat]}</p>
                  </div>
                ))}
              </div>
            )}

            {/* 3. PERSONALISED IMPROVEMENT ROADMAP */}
            {aiAnalysis?.roadmap && aiAnalysis.roadmap.length > 0 && (
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">90-Day Improvement Roadmap</h4>
                </div>
                <div className="space-y-3">
                  {aiAnalysis.roadmap.map((item, idx) => (
                    <div key={idx} className="p-3 bg-secondary rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          item.priority === "high" ? "bg-destructive/10 text-destructive"
                            : item.priority === "medium" ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                        }`}>{item.priority} priority</span>
                        <span className="text-xs text-muted-foreground">{item.timeframe}</span>
                      </div>
                      <p className="text-sm font-medium">{item.action}</p>
                      <p className="text-xs text-muted-foreground mt-1">Metric: {item.metric} → Target: {item.target}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="p-4 bg-secondary rounded-lg">
              <h4 className="font-semibold mb-3">Priority Recommendations</h4>
              <ul className="space-y-2">
                {getRecommendations().map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3">
              <PDFExportButton
                reportData={{
                  reportTitle: "Financial Health Scorecard",
                  reportType: "Financial Health Assessment",
                  score: totalScore,
                  grade: totalScore >= 75 ? "Strong" : totalScore >= 50 ? "Moderate" : "Needs Attention",
                  sections: (["liquidity", "profitability", "efficiency", "preparedness"] as const).map((cat) => ({
                    title: categoryLabels[cat],
                    items: [{ label: "Score", value: `${Math.round((scores[cat].score / scores[cat].max) * 100)}%`, highlight: (scores[cat].score / scores[cat].max) >= 0.75 ? "success" as const : (scores[cat].score / scores[cat].max) >= 0.5 ? "warning" as const : "danger" as const }],
                  })),
                } satisfies PDFReportData}
                label="Export PDF"
                className="flex-1"
              />
              <Button variant="outline" onClick={resetAssessment} className="flex-1">Retake Assessment</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FinancialHealthScorecard;
