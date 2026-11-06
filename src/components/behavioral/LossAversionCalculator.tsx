import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ArrowRight, DollarSign, TrendingDown, Shield, Brain, Clock } from "lucide-react";

interface LossAversionCalculatorProps {
  potentialLoss: number;
  preventionCost: number;
  scenarioName?: string;
  monthlyRevenue?: number;
  monthlyExpenses?: number;
}

const LossAversionCalculator = ({
  potentialLoss,
  preventionCost,
  scenarioName = "this risk",
  monthlyRevenue = 0,
  monthlyExpenses = 0,
}: LossAversionCalculatorProps) => {
  const [showRationalityCheck, setShowRationalityCheck] = useState(false);

  const savings = potentialLoss - preventionCost;
  const ratio = preventionCost > 0 ? (savings / preventionCost).toFixed(1) : "0";

  // Emotionally resonant equivalents
  const monthlyRent = monthlyExpenses > 0 ? monthlyExpenses * 0.3 : 5000;
  const avgClientValue = monthlyRevenue > 0 ? monthlyRevenue / 10 : 2000;

  const rentMonths = Math.round(potentialLoss / monthlyRent);
  const clientsNeeded = Math.round(potentialLoss / avgClientValue);
  const salaryWeeks = Math.round(potentialLoss / (monthlyExpenses * 0.4 / 4));

  // Cost of inaction over time
  const monthlyBurn = monthlyExpenses - (monthlyRevenue * 0.7); // stressed revenue
  const costOfInaction3 = Math.round(Math.max(0, monthlyBurn * 3));
  const costOfInaction6 = Math.round(Math.max(0, monthlyBurn * 6));
  const costOfInaction12 = Math.round(Math.max(0, monthlyBurn * 12));

  // Rationality check: loss aversion bias typically 2-2.5x
  const perceivedLoss = Math.round(potentialLoss * 2.25);
  const biasDelta = perceivedLoss - potentialLoss;

  return (
    <Card className="bg-gradient-to-br from-red-50 to-green-50 dark:from-red-950/20 dark:to-green-950/20 border-0">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>Loss Aversion Analysis</span>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="rationality" className="text-xs text-muted-foreground cursor-pointer">Rationality Check</Label>
            <Switch id="rationality" checked={showRationalityCheck} onCheckedChange={setShowRationalityCheck} />
          </div>
        </div>

        {/* Loss vs Prevention Accounts */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-red-100/50 dark:bg-red-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-xs font-medium text-red-700 dark:text-red-400">Crisis Loss Account</span>
            </div>
            <p className="text-xl font-bold text-red-700 dark:text-red-400">
              R{potentialLoss.toLocaleString()}
            </p>
            <p className="text-xs text-red-600/70 mt-1">Potential loss from {scenarioName}</p>
          </div>
          <div className="p-3 bg-green-100/50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-green-700 dark:text-green-400">Prevention Account</span>
            </div>
            <p className="text-xl font-bold text-green-700 dark:text-green-400">
              R{preventionCost.toLocaleString()}
            </p>
            <p className="text-xs text-green-600/70 mt-1">Investment to prevent it</p>
          </div>
        </div>

        {/* Emotionally Resonant Equivalents */}
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2">What this loss really means:</p>
          <ul className="space-y-1.5 text-sm">
            {rentMonths > 0 && (
              <li className="text-amber-700 dark:text-amber-400">
                💰 Equivalent to <strong>{rentMonths} months of your rent/premises costs</strong>
              </li>
            )}
            {clientsNeeded > 0 && (
              <li className="text-amber-700 dark:text-amber-400">
                👥 You'd need <strong>{clientsNeeded} new clients</strong> to recover this
              </li>
            )}
            {salaryWeeks > 0 && (
              <li className="text-amber-700 dark:text-amber-400">
                ⏱️ That's <strong>{salaryWeeks} weeks of payroll</strong> wiped out
              </li>
            )}
          </ul>
        </div>

        {/* Cost of Inaction */}
        <div className="p-3 bg-background/80 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-destructive" />
            <p className="text-xs font-semibold">Cost of Inaction</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "3 months", value: costOfInaction3 },
              { label: "6 months", value: costOfInaction6 },
              { label: "12 months", value: costOfInaction12 },
            ].map((item) => (
              <div key={item.label} className="p-2 bg-destructive/5 rounded">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-bold text-destructive">R{item.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2 italic">Cumulative drain if no action is taken</p>
        </div>

        {/* Mitigation as Gain */}
        <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
          <Shield className="h-5 w-5 text-green-600 shrink-0" />
          <p className="text-sm">
            <strong className="text-green-700 dark:text-green-400">Taking action today could protect R{savings.toLocaleString()}</strong>
            <span className="text-muted-foreground"> — for every R1 invested, you avoid R{ratio} in potential loss</span>
          </p>
        </div>

        {/* Rationality Check Toggle */}
        {showRationalityCheck && (
          <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-2">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              <p className="text-xs font-semibold">Rationality Check: Your Brain vs The Numbers</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 bg-background rounded">
                <p className="text-xs text-muted-foreground">How it <em>feels</em></p>
                <p className="text-lg font-bold text-destructive">R{perceivedLoss.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Emotional weight (2.25× bias)</p>
              </div>
              <div className="text-center p-2 bg-background rounded">
                <p className="text-xs text-muted-foreground">Actual expected value</p>
                <p className="text-lg font-bold text-primary">R{potentialLoss.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Statistical reality</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              <strong>Loss aversion bias</strong> makes losses feel 2-2.5× more painful than equivalent gains.
              Your brain is adding <strong>R{biasDelta.toLocaleString()}</strong> in phantom pain.
              Acknowledge the bias, then decide based on the real number.
            </p>
          </div>
        )}

        {/* Mental Accounting Reframe */}
        <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">🧠 Mental Accounting Reframe:</strong>{" "}
            This isn't a cost—it's a transfer from your "Crisis Loss Account"
            to your "Controlled Prevention Account." The money is allocated either way;
            prevention gives you control over when and how.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LossAversionCalculator;
