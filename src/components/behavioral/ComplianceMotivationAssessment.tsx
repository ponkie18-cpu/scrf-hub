import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Brain, ArrowRight, ArrowLeft, TrendingUp, Heart, Shield, Sparkles, RefreshCw } from "lucide-react";

interface Question {
  id: string;
  question: string;
  options: { text: string; type: "trust" | "power" | "neutral"; score: number }[];
}

const questions: Question[] = [
  {
    id: "motivation",
    question: "When you complete a compliance task, what's your primary motivation?",
    options: [
      { text: "I understand how it helps my business succeed", type: "trust", score: 3 },
      { text: "I want to avoid penalties and legal trouble", type: "power", score: 1 },
      { text: "It's just part of running a business", type: "neutral", score: 2 },
    ],
  },
  {
    id: "communication",
    question: "How do you communicate regulatory requirements to your team?",
    options: [
      { text: "Explain the 'why' behind each requirement", type: "trust", score: 3 },
      { text: "Present them as non-negotiable rules", type: "power", score: 1 },
      { text: "Share the requirements without much context", type: "neutral", score: 2 },
    ],
  },
  {
    id: "newRule",
    question: "When a new regulation comes out, your first thought is:",
    options: [
      { text: "How can this help us improve?", type: "trust", score: 3 },
      { text: "Another thing to worry about", type: "power", score: 1 },
      { text: "Let's see what's required", type: "neutral", score: 2 },
    ],
  },
  {
    id: "documentation",
    question: "Why do you maintain business documentation?",
    options: [
      { text: "It helps us operate better and share knowledge", type: "trust", score: 3 },
      { text: "We need it if we get audited", type: "power", score: 1 },
      { text: "It's standard practice", type: "neutral", score: 2 },
    ],
  },
  {
    id: "riskReview",
    question: "When you review business risks, you're primarily thinking about:",
    options: [
      { text: "Opportunities to build resilience", type: "trust", score: 3 },
      { text: "What could go wrong and hurt us", type: "power", score: 1 },
      { text: "Getting a clear picture of our situation", type: "neutral", score: 2 },
    ],
  },
  {
    id: "vendorCompliance",
    question: "How do you approach vendor compliance requirements?",
    options: [
      { text: "Partner with vendors to achieve mutual goals", type: "trust", score: 3 },
      { text: "Enforce requirements through contracts and audits", type: "power", score: 1 },
      { text: "Check their compliance status regularly", type: "neutral", score: 2 },
    ],
  },
];

const ComplianceMotivationAssessment = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { type: string; score: number }>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (optionIndex: number) => {
    const question = questions[currentQuestion];
    const option = question.options[optionIndex];
    setAnswers({
      ...answers,
      [question.id]: { type: option.type, score: option.score },
    });
  };

  const calculateResults = () => {
    const scores = { trust: 0, power: 0, neutral: 0 };
    Object.values(answers).forEach((answer) => {
      scores[answer.type as keyof typeof scores] += answer.score;
    });
    const total = scores.trust + scores.power + scores.neutral;
    const trustPercentage = total > 0 ? Math.round((scores.trust / total) * 100) : 50;
    return { scores, trustPercentage };
  };

  const { scores, trustPercentage } = calculateResults();

  const getSlopePosition = () => {
    if (trustPercentage >= 66) return {
      position: "Voluntary Compliance (Sustainable)",
      color: "text-green-600",
      bg: "bg-green-100",
      icon: Heart,
      description: "You approach compliance from a place of understanding and genuine business benefit. This creates lasting habits.",
      recommendations: [
        "Leverage your trust-based approach to become an industry leader",
        "Share your 'why' with others to build stronger vendor relationships",
        "Document your approach to scale it as you grow",
      ],
    };
    if (trustPercentage >= 33) return {
      position: "Balanced Approach (Effective)",
      color: "text-amber-600",
      bg: "bg-amber-100",
      icon: TrendingUp,
      description: "You balance understanding with enforcement. There's room to shift more toward trust-based approaches.",
      recommendations: [
        "Pick one fear-based compliance area and explore its business benefits",
        "Explain the 'why' behind one requirement to your team this week",
        "Celebrate compliance wins to build positive associations",
      ],
    };
    return {
      position: "Coerced Compliance (High Resistance)",
      color: "text-red-600",
      bg: "bg-red-100",
      icon: Shield,
      description: "Your compliance approach relies heavily on external pressure. This can create resistance and isn't sustainable.",
      recommendations: [
        "Start with one small area—find the genuine business benefit",
        "Ask 'what would we do if there were no penalties?' for perspective",
        "Build small wins to shift from fear to confidence",
      ],
    };
  };

  const slopePosition = getSlopePosition();
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentAnswer = answers[questions[currentQuestion]?.id];

  if (showResults) {
    const Icon = slopePosition.icon;
    return (
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Your Compliance Motivation Profile
          </CardTitle>
          <CardDescription>Understanding your position on the Slippery Slope</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Result */}
          <div className={`p-6 rounded-xl ${slopePosition.bg}`}>
            <div className="flex items-center gap-3 mb-3">
              <Icon className={`h-8 w-8 ${slopePosition.color}`} />
              <div>
                <h3 className={`text-xl font-bold ${slopePosition.color}`}>
                  {slopePosition.position}
                </h3>
                <p className="text-sm text-muted-foreground">{trustPercentage}% trust-based motivation</p>
              </div>
            </div>
            <p className="text-sm">{slopePosition.description}</p>
          </div>

          {/* Trust Spectrum */}
          <div className="space-y-3">
            <h4 className="font-semibold">Your Position on the Slippery Slope</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-red-600">Coerced</span>
                <span className="text-amber-600">Balanced</span>
                <span className="text-green-600">Voluntary</span>
              </div>
              <div className="relative h-4 bg-gradient-to-r from-red-300 via-amber-300 to-green-300 rounded-full">
                <div 
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-background border-2 border-primary rounded-full shadow-lg"
                  style={{ left: `calc(${trustPercentage}% - 10px)` }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Based on <strong>Slippery Slope Framework</strong>: Sustainable compliance comes from trust and understanding, not enforcement alone.
            </p>
          </div>

          {/* Score Breakdown */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
              <Heart className="h-4 w-4 text-green-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-green-600">{scores.trust}</p>
              <p className="text-xs text-muted-foreground">Trust</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
              <TrendingUp className="h-4 w-4 text-gray-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-600">{scores.neutral}</p>
              <p className="text-xs text-muted-foreground">Neutral</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
              <Shield className="h-4 w-4 text-amber-600 mx-auto mb-1" />
              <p className="text-lg font-bold text-amber-600">{scores.power}</p>
              <p className="text-xs text-muted-foreground">Power</p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Next Steps to Build Trust-Based Compliance
            </h4>
            <ul className="space-y-2">
              {slopePosition.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className="mt-0.5">{i + 1}</Badge>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          <Button onClick={() => { setShowResults(false); setCurrentQuestion(0); setAnswers({}); }} variant="outline" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retake Assessment
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Compliance Motivation Assessment
        </CardTitle>
        <CardDescription>
          Discover your position on the Slippery Slope: trust vs. enforcement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Question {currentQuestion + 1} of {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <div className="space-y-4">
          <h3 className="font-medium text-lg">{questions[currentQuestion].question}</h3>
          <RadioGroup
            value={currentAnswer ? String(questions[currentQuestion].options.findIndex(o => o.type === currentAnswer.type && o.score === currentAnswer.score)) : ""}
            onValueChange={(value) => handleAnswer(parseInt(value))}
          >
            {questions[currentQuestion].options.map((option, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                <RadioGroupItem value={String(i)} id={`option-${i}`} />
                <Label htmlFor={`option-${i}`} className="flex-1 cursor-pointer">
                  {option.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {currentQuestion < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              disabled={!currentAnswer}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => setShowResults(true)}
              disabled={Object.keys(answers).length < questions.length}
            >
              See Results
              <Sparkles className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplianceMotivationAssessment;
