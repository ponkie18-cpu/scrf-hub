import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Calendar, PiggyBank, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useAssessmentSave } from "@/hooks/useAssessmentSave";
import { UpgradeGate } from "@/components/tier/UpgradeGate";

interface TaxSchedule {
  month: string;
  amount: number;
  cumulative: number;
}

const TaxLiabilityForecaster = () => {
  const [annualProfit, setAnnualProfit] = useState("");
  const [taxRate, setTaxRate] = useState("25");
  const [monthsRemaining, setMonthsRemaining] = useState("12");
  const [currentSavings, setCurrentSavings] = useState("");
  const [schedule, setSchedule] = useState<TaxSchedule[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const { saveAssessment, isSaving, savedToDb, reset: resetSave } = useAssessmentSave();

  // Save to dashboard when schedule is shown
  useEffect(() => {
    if (showSchedule && schedule.length > 0 && !savedToDb && !isSaving) {
      const totalTax = (parseFloat(annualProfit) || 0) * (parseFloat(taxRate) / 100);
      const currentSaved = parseFloat(currentSavings) || 0;
      const savingsRatio = totalTax > 0 ? (currentSaved / totalTax) * 100 : 0;
      
      // Score based on how prepared they are
      const score = Math.min(100, Math.round(savingsRatio));

      const recommendations = [];
      if (savingsRatio < 25) {
        recommendations.push({
          title: "Set up automatic tax savings transfers",
          priority: "high" as const,
          description: `Currently ${savingsRatio.toFixed(0)}% of tax liability saved`,
        });
      }
      if (savingsRatio < 75) {
        recommendations.push({
          title: "Review monthly savings schedule",
          priority: "medium" as const,
          description: `Need to save ${schedule[0]?.amount?.toLocaleString() || 0}/month`,
        });
      }

      const insights = [
        `Total tax liability: ${totalTax.toLocaleString()}`,
        `Current savings: ${currentSaved.toLocaleString()} (${savingsRatio.toFixed(0)}%)`,
        `Monthly target: ${schedule[0]?.amount?.toLocaleString() || 0}`,
      ];

      saveAssessment({
        domain: "financial",
        toolId: "tax-forecaster",
        answers: { annualProfit, taxRate, monthsRemaining, currentSavings },
        score,
        confidence: 1.0,
        insights,
        recommendations,
      });
    }
  }, [showSchedule, schedule, savedToDb, isSaving]);

  const calculateSchedule = () => {
    const profit = parseFloat(annualProfit) || 0;
    const rate = parseFloat(taxRate) / 100;
    const months = parseInt(monthsRemaining);
    const saved = parseFloat(currentSavings) || 0;

    const totalTax = profit * rate;
    const remaining = Math.max(0, totalTax - saved);
    const monthlyAmount = months > 0 ? remaining / months : 0;

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    
    const scheduleItems: TaxSchedule[] = [];
    let cumulative = saved;

    for (let i = 0; i < months; i++) {
      const monthIndex = (currentMonth + i) % 12;
      cumulative += monthlyAmount;
      scheduleItems.push({
        month: monthNames[monthIndex],
        amount: Math.round(monthlyAmount),
        cumulative: Math.round(cumulative),
      });
    }

    setSchedule(scheduleItems);
    setShowSchedule(true);
  };

  const totalTax = (parseFloat(annualProfit) || 0) * (parseFloat(taxRate) / 100);
  const currentSaved = parseFloat(currentSavings) || 0;
  const remainingToSave = Math.max(0, totalTax - currentSaved);

  const resetForm = () => {
    setAnnualProfit("");
    setTaxRate("25");
    setMonthsRemaining("12");
    setCurrentSavings("");
    setSchedule([]);
    setShowSchedule(false);
  };

  return (
    <UpgradeGate
      toolId="tax-forecaster"
      toolName="Avoid Surprise Tax Shocks"
      toolDescription="Turn tax panic into predictable planning with clear estimates and automated savings schedules."
      features={["Clear tax liability estimates", "Monthly savings schedule", "Progress tracking", "Actionable next steps"]}
    >
      <Card className="border-2 border-primary/20">
        <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Calculator className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="font-display text-xl">Avoid Surprise Tax Shocks</CardTitle>
            <CardDescription>
              Turn tax panic into predictable planning
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!showSchedule ? (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="annualProfit">Projected Annual Profit</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="annualProfit"
                    type="number"
                    placeholder="100000"
                    value={annualProfit}
                    onChange={(e) => setAnnualProfit(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate">Estimated Tax Rate</Label>
                <Select value={taxRate} onValueChange={setTaxRate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select rate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15% (Small business rate)</SelectItem>
                    <SelectItem value="20">20% (Lower bracket)</SelectItem>
                    <SelectItem value="25">25% (Standard)</SelectItem>
                    <SelectItem value="30">30% (Higher bracket)</SelectItem>
                    <SelectItem value="35">35% (Top rate)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthsRemaining">Months Until Tax Due</Label>
                <Select value={monthsRemaining} onValueChange={setMonthsRemaining}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select months" />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 6, 9, 12].map((m) => (
                      <SelectItem key={m} value={m.toString()}>
                        {m} months
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentSavings">Already Saved for Tax</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="currentSavings"
                    type="number"
                    placeholder="0"
                    value={currentSavings}
                    onChange={(e) => setCurrentSavings(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            {annualProfit && (
              <div className="p-4 bg-secondary rounded-lg">
                <h4 className="font-semibold mb-3">Quick Estimate</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">${totalTax.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total Tax Due</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">${currentSaved.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Already Saved</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-accent">${remainingToSave.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Still Needed</p>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={calculateSchedule} className="w-full" size="lg" disabled={!annualProfit}>
              Generate Savings Schedule
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <div className="p-4 bg-primary/5 rounded-lg text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <PiggyBank className="h-5 w-5 text-primary" />
                <span className="font-semibold">Monthly Savings Target</span>
              </div>
              <p className="text-3xl font-bold text-primary">
                ${(remainingToSave / parseInt(monthsRemaining)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Transfer this amount to your tax savings account each month
              </p>
            </div>

            {/* Schedule */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-semibold">Your Savings Schedule</h4>
              </div>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {schedule.slice(0, 6).map((item, idx) => (
                  <div key={idx} className="text-center p-2 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground">{item.month}</p>
                    <p className="text-sm font-semibold">${item.amount.toLocaleString()}</p>
                    <p className="text-xs text-primary">${item.cumulative.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Bottom number shows cumulative savings
              </p>
            </div>

            {/* Cognitive Reframing */}
            <div className="p-4 bg-accent/10 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">Reframe Your Mindset</p>
                  <p className="text-sm text-muted-foreground">
                    Tax payments are a sign of business success—they mean you're profitable! 
                    By setting aside money monthly, you're turning a stressful annual event into 
                    a manageable routine expense, just like rent.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Items */}
            <div className="p-4 bg-secondary rounded-lg">
              <h4 className="font-semibold mb-2">Next Steps</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Open a separate tax savings account (if you haven't)</li>
                <li>• Set up automatic monthly transfers</li>
                <li>• Add a calendar reminder to review quarterly</li>
                <li>• Share this projection with your accountant</li>
              </ul>
            </div>

            <Button variant="outline" onClick={resetForm} className="w-full">
              Calculate Another Scenario
            </Button>
          </div>
        )}
        </CardContent>
      </Card>
    </UpgradeGate>
  );
};

export default TaxLiabilityForecaster;
