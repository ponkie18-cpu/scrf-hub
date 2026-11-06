import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { UpgradeGate } from "@/components/tier/UpgradeGate";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Brain, ArrowRight, ArrowLeft, Eye, Lightbulb, RefreshCw,
  AlertTriangle, TrendingUp, Scale, Shield, Sparkles, Target
} from "lucide-react";

interface BiasQuestion {
  id: string;
  scenario: string;
  options: { text: string; biases: Record<string, number> }[];
}

interface BiasProfile {
  primaryBias: string;
  biasLabel: string;
  scores: Record<string, number>;
  explanation: string;
  manifestation: string;
  strategies: string[];
}

const BIAS_LABELS: Record<string, { label: string; icon: typeof Brain; color: string }> = {
  loss_aversion: { label: "Loss Aversion", icon: Shield, color: "text-amber-600" },
  optimism_bias: { label: "Optimism Bias", icon: TrendingUp, color: "text-blue-600" },
  present_bias: { label: "Present Bias", icon: Target, color: "text-purple-600" },
  overconfidence: { label: "Overconfidence", icon: Eye, color: "text-red-600" },
  status_quo: { label: "Status Quo Bias", icon: Scale, color: "text-green-600" },
};

const BIAS_EXPLANATIONS: Record<string, { explanation: string; manifestation: string; strategies: string[] }> = {
  loss_aversion: {
    explanation: "You tend to weigh potential losses more heavily than equivalent gains. While this can make you cautious, it may also prevent you from taking calculated risks that could benefit your business.",
    manifestation: "Avoiding necessary business changes because the potential downside feels larger than the upside. Over-insuring or over-hedging. Holding onto underperforming assets or partnerships too long.",
    strategies: [
      "Frame decisions in terms of total outcomes rather than gains vs losses separately",
      "Use pre-commitment strategies — decide your threshold for action before emotions kick in",
      "Ask: 'What would I advise a friend in this exact situation?' to create emotional distance",
    ],
  },
  optimism_bias: {
    explanation: "You tend to overestimate the likelihood of positive outcomes and underestimate risks. This makes you entrepreneurial but can leave you underprepared for adverse scenarios.",
    manifestation: "Underestimating project timelines and budgets. Skipping contingency planning because 'it'll be fine'. Not stress-testing financial models with realistic downside scenarios.",
    strategies: [
      "Conduct a Pre-Mortem exercise: imagine the project has failed and work backward to identify causes",
      "Always build in a 30% buffer on time and cost estimates",
      "Seek out a 'designated dissenter' who challenges optimistic assumptions",
    ],
  },
  present_bias: {
    explanation: "You tend to prioritise immediate rewards over future benefits, even when the future benefit is objectively larger. This can lead to under-investment in long-term resilience.",
    manifestation: "Postponing compliance tasks, BCP updates, or risk assessments because they don't feel urgent today. Choosing short-term cost savings over long-term protection.",
    strategies: [
      "Set automated reminders and calendar blocks for risk management activities",
      "Visualise future costs: calculate what a compliance failure or breach would cost in real numbers",
      "Use the 'commitment device' technique — publicly commit to deadlines and reviews",
    ],
  },
  overconfidence: {
    explanation: "You tend to overestimate your own knowledge, skills, or the accuracy of your predictions. This can lead to inadequate preparation and dismissal of expert advice.",
    manifestation: "Not seeking specialist advice when needed. Underestimating competitor capabilities. Dismissing warning signs because 'I know my business better than anyone'.",
    strategies: [
      "Track your past predictions and their outcomes to calibrate your confidence",
      "Before major decisions, list 3 things you might be wrong about",
      "Actively seek disconfirming evidence — ask 'What would change my mind?'",
    ],
  },
  status_quo: {
    explanation: "You tend to prefer the current state of affairs, even when change would be beneficial. This creates resistance to process improvements and adaptation.",
    manifestation: "Keeping outdated processes because 'they've always worked'. Resisting new technology or compliance frameworks. Sticking with underperforming suppliers out of habit.",
    strategies: [
      "Schedule quarterly 'zero-based thinking' sessions: 'If we weren't already doing this, would we start?'",
      "Try small-scale experiments before full commitment to reduce perceived risk of change",
      "Calculate the 'cost of inaction' — what does staying the same cost you over 12 months?",
    ],
  },
};

const questions: BiasQuestion[] = [
  {
    id: "q1",
    scenario: "Your business has an opportunity to invest R100,000. Option A guarantees R110,000 back. Option B has 50% chance of R200,000 and 50% chance of R80,000. You choose:",
    options: [
      { text: "Option A — the guaranteed return", biases: { loss_aversion: 3, status_quo: 1 } },
      { text: "Option B — the higher expected value", biases: { optimism_bias: 2, overconfidence: 1 } },
      { text: "I'd need more data before deciding", biases: { present_bias: 1 } },
    ],
  },
  {
    id: "q2",
    scenario: "Your industry faces new compliance regulations effective in 6 months. Your first reaction:",
    options: [
      { text: "Start preparing now — better safe than sorry", biases: { loss_aversion: 2 } },
      { text: "We'll handle it closer to the deadline — we have time", biases: { present_bias: 3, optimism_bias: 1 } },
      { text: "Our current processes probably already cover most of it", biases: { overconfidence: 2, status_quo: 1 } },
    ],
  },
  {
    id: "q3",
    scenario: "A competitor is gaining market share with a new approach. You:",
    options: [
      { text: "Our approach has worked for years — no need to change", biases: { status_quo: 3, overconfidence: 1 } },
      { text: "We should probably adapt, but let's not rush", biases: { present_bias: 2, status_quo: 1 } },
      { text: "Let's analyse and respond quickly — we can outdo them", biases: { optimism_bias: 2, overconfidence: 1 } },
    ],
  },
  {
    id: "q4",
    scenario: "You're considering a new vendor who offers 25% cost savings but requires changing your current workflows:",
    options: [
      { text: "The savings aren't worth the disruption risk", biases: { loss_aversion: 2, status_quo: 2 } },
      { text: "Let's switch — the savings will definitely outweigh transition costs", biases: { optimism_bias: 2 } },
      { text: "I'll look into it later when things are less busy", biases: { present_bias: 2, status_quo: 1 } },
    ],
  },
  {
    id: "q5",
    scenario: "Your financial advisor suggests diversifying revenue streams. You think:",
    options: [
      { text: "I know my market — focus is better than diversification", biases: { overconfidence: 3 } },
      { text: "Diversifying sounds risky — I could lose what I already have", biases: { loss_aversion: 2, status_quo: 1 } },
      { text: "Good idea but I'll think about it next quarter", biases: { present_bias: 3 } },
    ],
  },
  {
    id: "q6",
    scenario: "Your team suggests updating your business continuity plan. You respond:",
    options: [
      { text: "We've never had a major incident — it's not urgent", biases: { optimism_bias: 2, overconfidence: 1 } },
      { text: "Let's do it, but we have bigger priorities right now", biases: { present_bias: 2 } },
      { text: "The current plan works — a full overhaul is too disruptive", biases: { status_quo: 2, loss_aversion: 1 } },
    ],
  },
  {
    id: "q7",
    scenario: "You forecast next year's revenue. Compared to your actuals, your forecasts historically tend to be:",
    options: [
      { text: "Spot on — I have good instincts", biases: { overconfidence: 3 } },
      { text: "Optimistic — things usually cost more or earn less", biases: { optimism_bias: 3 } },
      { text: "Conservative — I plan for the worst", biases: { loss_aversion: 2 } },
    ],
  },
  {
    id: "q8",
    scenario: "You discover a process that could save 10 hours/week but requires 2 weeks of setup disruption:",
    options: [
      { text: "2 weeks of disruption could cost us clients", biases: { loss_aversion: 3 } },
      { text: "We'll implement it eventually — just not this month", biases: { present_bias: 2, status_quo: 1 } },
      { text: "Our current process is fine — don't fix what isn't broken", biases: { status_quo: 3 } },
    ],
  },
];

const CognitiveBiasDetector = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0); // 0-7 = questions, 8 = results
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [profile, setProfile] = useState<BiasProfile | null>(null);
  const [showBehavioralView, setShowBehavioralView] = useState(true);

  const handleAnswer = (questionIdx: number, optionIdx: number) => {
    setAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const generateProfile = () => {
    const biasScores: Record<string, number> = {
      loss_aversion: 0, optimism_bias: 0, present_bias: 0, overconfidence: 0, status_quo: 0,
    };

    Object.entries(answers).forEach(([qIdx, optIdx]) => {
      const q = questions[parseInt(qIdx)];
      const option = q.options[optIdx];
      Object.entries(option.biases).forEach(([bias, score]) => {
        biasScores[bias] = (biasScores[bias] || 0) + score;
      });
    });

    // Normalize to 0-100
    const maxPossible = 12; // rough max per bias
    const normalized: Record<string, number> = {};
    Object.entries(biasScores).forEach(([k, v]) => {
      normalized[k] = Math.min(100, Math.round((v / maxPossible) * 100));
    });

    const primaryBias = Object.entries(normalized).sort(([, a], [, b]) => b - a)[0][0];
    const info = BIAS_EXPLANATIONS[primaryBias];

    setProfile({
      primaryBias,
      biasLabel: BIAS_LABELS[primaryBias].label,
      scores: normalized,
      explanation: info.explanation,
      manifestation: info.manifestation,
      strategies: info.strategies,
    });
    setStep(questions.length);
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setProfile(null);
  };

  // Survey view
  if (step < questions.length) {
    const q = questions[step];
    return (
      <UpgradeGate toolId="cognitive-bias-detector" toolName="Know Your Risk Psychology"
        toolDescription="Identify cognitive biases that affect your business decisions"
        features={["8-scenario bias assessment", "Personalised bias profile", "Debiasing strategies", "Contextual bias alerts"]}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="h-5 w-5 text-primary" />
              Know Your Risk Psychology
            </CardTitle>
            <CardDescription>Question {step + 1} of {questions.length}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={((step + 1) / questions.length) * 100} className="h-2" />
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm font-medium leading-relaxed">{q.scenario}</p>
            </div>
            <RadioGroup
              value={answers[step]?.toString()}
              onValueChange={(v) => handleAnswer(step, parseInt(v))}
            >
              {q.options.map((opt, i) => (
                <div key={i} className="flex items-start space-x-2 p-3 rounded-lg border hover:border-primary/40 transition-colors">
                  <RadioGroupItem value={i.toString()} id={`q${step}-o${i}`} className="mt-0.5" />
                  <Label htmlFor={`q${step}-o${i}`} className="text-sm cursor-pointer flex-1">{opt.text}</Label>
                </div>
              ))}
            </RadioGroup>
            <div className="flex justify-between pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              {step < questions.length - 1 ? (
                <Button size="sm" onClick={() => setStep(s => s + 1)} disabled={answers[step] === undefined}>
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button size="sm" onClick={generateProfile} disabled={answers[step] === undefined}>
                  See My Profile <Sparkles className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </UpgradeGate>
    );
  }

  // Results view
  if (!profile) return null;

  const PrimaryIcon = BIAS_LABELS[profile.primaryBias].icon;
  const primaryColor = BIAS_LABELS[profile.primaryBias].color;

  return (
    <UpgradeGate toolId="cognitive-bias-detector" toolName="Know Your Risk Psychology"
      toolDescription="Identify cognitive biases that affect your business decisions"
      features={["8-scenario bias assessment", "Personalised bias profile", "Debiasing strategies", "Contextual bias alerts"]}>
      <div className="space-y-4">
        {/* Profile Header */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-5 w-5 text-primary" />
                Your Risk Psychology Profile
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RefreshCw className="h-4 w-4 mr-1" /> Retake
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <PrimaryIcon className={`h-8 w-8 ${primaryColor}`} />
              <div>
                <p className="text-sm text-muted-foreground">Primary Bias</p>
                <p className={`text-lg font-bold ${primaryColor}`}>{profile.biasLabel}</p>
              </div>
            </div>

            {/* Bias Scores */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Bias Tendency Breakdown</p>
              {Object.entries(profile.scores)
                .sort(([, a], [, b]) => b - a)
                .map(([bias, score]) => {
                  const info = BIAS_LABELS[bias];
                  const BiasIcon = info.icon;
                  return (
                    <div key={bias} className="flex items-center gap-2">
                      <BiasIcon className={`h-3.5 w-3.5 ${info.color} shrink-0`} />
                      <span className="text-xs w-24 shrink-0">{info.label}</span>
                      <Progress value={score} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground w-8 text-right">{score}%</span>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Rationality Toggle */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">View Mode</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Rational</span>
                <Switch checked={showBehavioralView} onCheckedChange={setShowBehavioralView} />
                <span className="text-xs text-muted-foreground">Behavioural</span>
              </div>
            </div>
            {showBehavioralView ? (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs font-medium text-amber-700 mb-1">Behavioural View (accounts for your biases)</p>
                <p className="text-xs text-muted-foreground">{profile.explanation}</p>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs font-medium text-blue-700 mb-1">Rational View (pure expected-value analysis)</p>
                <p className="text-xs text-muted-foreground">
                  Without bias adjustment, decisions should be evaluated purely on expected outcomes.
                  Your {profile.biasLabel.toLowerCase()} tendency may be causing you to over-weight certain factors in your analysis.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* How it Manifests */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              How This Manifests in Business
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed">{profile.manifestation}</p>
          </CardContent>
        </Card>

        {/* Debiasing Strategies */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Your Debiasing Strategies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {profile.strategies.map((s, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded bg-muted/50">
                <Badge variant="outline" className="text-xs shrink-0 mt-0.5">{i + 1}</Badge>
                <p className="text-xs leading-relaxed">{s}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Contextual Alert Example */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <p className="text-xs font-medium">Better Lens™ — Active</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                💡 Your profile suggests <strong>{profile.biasLabel.toLowerCase()}</strong> here.
                {profile.primaryBias === "optimism_bias" && " Have you stress-tested the downside scenario?"}
                {profile.primaryBias === "loss_aversion" && " Are you overweighting potential losses relative to the upside?"}
                {profile.primaryBias === "present_bias" && " What will this decision cost you in 12 months if you delay?"}
                {profile.primaryBias === "overconfidence" && " What are 3 things you might be wrong about here?"}
                {profile.primaryBias === "status_quo" && " If you weren't already doing this, would you start today?"}
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center italic">
          ⚖️ This assessment is for self-awareness purposes. It does not constitute psychological advice.
        </p>
      </div>
    </UpgradeGate>
  );
};

export default CognitiveBiasDetector;
