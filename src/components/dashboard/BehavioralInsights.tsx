import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Brain, Wallet, TrendingUp, Shield, Lightbulb, ArrowRight, PiggyBank, Scale, Sparkles } from "lucide-react";

interface RiskAccount {
  key: string;
  name: string;
  currency: string;
  currencyLabel: string;
  balance: number;
  target: number;
  psychologicalFraming: string;
  icon: typeof Wallet;
  color: string;
}

interface BehavioralInsightsProps {
  domainScores: Record<string, number | null>;
  actionItems: { domain: string; completed: boolean; priority: string }[];
}

const riskAccounts: RiskAccount[] = [
  {
    key: "operational",
    name: "Operational Safety Fund",
    currency: "hours",
    currencyLabel: "hrs invested",
    balance: 0,
    target: 8,
    psychologicalFraming: "Your business continuity insurance—every hour invested protects against disruption",
    icon: Shield,
    color: "bg-blue-500",
  },
  {
    key: "financial",
    name: "Financial Buffer Account",
    currency: "percent",
    currencyLabel: "% allocated",
    balance: 0,
    target: 5,
    psychologicalFraming: "Your stress-free tax and crisis fund—separate from operations",
    icon: PiggyBank,
    color: "bg-green-500",
  },
  {
    key: "compliance",
    name: "Compliance Shield",
    currency: "checkmarks",
    currencyLabel: "items verified",
    balance: 0,
    target: 10,
    psychologicalFraming: "Your audit-proofing deposit—building trust with regulators",
    icon: Scale,
    color: "bg-purple-500",
  },
  {
    key: "strategic",
    name: "Future Vision Reserve",
    currency: "insights",
    currencyLabel: "insights gathered",
    balance: 0,
    target: 4,
    psychologicalFraming: "Your competitive foresight investment—seeing around corners",
    icon: Lightbulb,
    color: "bg-amber-500",
  },
];

const BehavioralInsights = ({ domainScores, actionItems }: BehavioralInsightsProps) => {
  const [showDepositRitual, setShowDepositRitual] = useState(false);

  // Calculate trust vs power balance from action completion patterns
  const completedActions = actionItems.filter(a => a.completed).length;
  const totalActions = actionItems.length;
  const trustScore = totalActions > 0 
    ? Math.round((completedActions / totalActions) * 100) 
    : 50;

  // Determine slippery slope position
  const getSlopePosition = () => {
    if (trustScore >= 70) return { label: "Voluntary Compliance", color: "text-green-600", description: "You're building sustainable habits" };
    if (trustScore >= 40) return { label: "Balanced Approach", color: "text-amber-600", description: "Mix of trust and enforcement" };
    return { label: "Enforcement-Dependent", color: "text-red-600", description: "Consider building more proactive habits" };
  };

  const slopePosition = getSlopePosition();

  // Calculate account health based on domain scores
  const getAccountHealth = (key: string) => {
    const score = domainScores[key];
    if (score === null) return 0;
    return Math.round((score / 100) * riskAccounts.find(a => a.key === key)!.target);
  };

  const fundedAccounts = Object.keys(domainScores).filter(key => domainScores[key] !== null).length;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Your Risk Psychology
        </CardTitle>
        <CardDescription>
          SCRF applies behavioral science to make risk management intuitive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mental Accounting Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-background rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Risk Accounts</span>
            </div>
            <p className="text-2xl font-bold text-primary">{fundedAccounts}/4</p>
            <p className="text-xs text-muted-foreground">accounts funded</p>
          </div>
          <div className="p-4 bg-background rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Trust Balance</span>
            </div>
            <p className={`text-2xl font-bold ${slopePosition.color}`}>{trustScore}%</p>
            <p className="text-xs text-muted-foreground">{slopePosition.label}</p>
          </div>
        </div>

        {/* Slippery Slope Visualization */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-red-600">Coerced</span>
            <span className="text-muted-foreground">Balanced</span>
            <span className="text-green-600">Voluntary</span>
          </div>
          <div className="relative h-3 bg-gradient-to-r from-red-200 via-amber-200 to-green-200 rounded-full">
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-background border-2 border-primary rounded-full shadow-md transition-all duration-500"
              style={{ left: `calc(${trustScore}% - 8px)` }}
            />
          </div>
          <p className="text-xs text-center text-muted-foreground italic">
            "{slopePosition.description}"
          </p>
        </div>

        {/* Quick Account Status */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Mental Account Health</p>
          {riskAccounts.map((account) => {
            const health = getAccountHealth(account.key);
            const percentage = (health / account.target) * 100;
            const Icon = account.icon;
            return (
              <div key={account.key} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${account.color} flex items-center justify-center`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium">{account.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {health}/{account.target} {account.currencyLabel}
                    </span>
                  </div>
                  <Progress value={percentage} className="h-1.5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Behavioral Insight Tip */}
        <div className="p-3 bg-secondary/50 rounded-lg">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-accent mt-0.5" />
            <div>
              <p className="text-sm font-medium">Behavioral Insight</p>
              <p className="text-xs text-muted-foreground mt-1">
                {trustScore < 50 
                  ? "Research shows that understanding 'why' behind compliance creates lasting habits. Try explaining one requirement to your team this week."
                  : "You're building trust-based compliance—this creates more sustainable risk management than fear-based approaches."
                }
              </p>
            </div>
          </div>
        </div>

        {/* Deposit Ritual Dialog */}
        <Dialog open={showDepositRitual} onOpenChange={setShowDepositRitual}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Wallet className="h-4 w-4 mr-2" />
              Make Risk Deposits
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                Monthly Risk Deposits
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                <strong>Mental Accounting</strong> works because we treat "separate accounts" differently. 
                Create psychological separation between your risk investments and daily operations:
              </p>
              
              {riskAccounts.map((account) => {
                const Icon = account.icon;
                return (
                  <div key={account.key} className="p-4 bg-secondary/50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${account.color} flex items-center justify-center`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{account.name}</p>
                        <p className="text-xs text-muted-foreground">{account.psychologicalFraming}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline">Monthly target: {account.target} {account.currencyLabel}</Badge>
                    </div>
                  </div>
                );
              })}

              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-xs text-muted-foreground">
                  <strong>💡 Pro tip:</strong> Schedule a recurring 30-minute "Risk Review" 
                  calendar block. This creates temporal separation that makes risk management 
                  feel like a distinct activity rather than an interruption.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default BehavioralInsights;
