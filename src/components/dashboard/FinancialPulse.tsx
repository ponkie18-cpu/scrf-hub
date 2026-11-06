import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  DollarSign, TrendingUp, TrendingDown, Minus, ArrowRight,
  ShieldCheck, AlertTriangle,
} from "lucide-react";

interface FinancialPulseProps {
  financialScore: number | null;
  scoreHistory: { domain: string; score: number; recorded_at: string }[];
  pendingFinancialActions: number;
}

export default function FinancialPulse({ financialScore, scoreHistory, pendingFinancialActions }: FinancialPulseProps) {
  const financialHistory = scoreHistory
    .filter(h => h.domain === "financial")
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

  const trend = (() => {
    if (financialHistory.length < 2) return null;
    const latest = financialHistory[financialHistory.length - 1].score;
    const previous = financialHistory[financialHistory.length - 2].score;
    const diff = latest - previous;
    return { direction: diff > 0 ? "up" : diff < 0 ? "down" : "stable", change: Math.abs(diff) };
  })();

  const getHealthLabel = (score: number) => {
    if (score >= 80) return { label: "Strong", color: "text-green-600", bg: "bg-green-100" };
    if (score >= 60) return { label: "Healthy", color: "text-emerald-600", bg: "bg-emerald-100" };
    if (score >= 40) return { label: "At Risk", color: "text-amber-600", bg: "bg-amber-100" };
    return { label: "Critical", color: "text-red-600", bg: "bg-red-100" };
  };

  const health = financialScore !== null ? getHealthLabel(financialScore) : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-4 w-4 text-green-600" />
          Financial Pulse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {financialScore !== null ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-3xl font-bold ${health?.color}`}>{financialScore}</p>
                <Badge className={`mt-1 ${health?.bg} ${health?.color} border-0`}>
                  {health?.label}
                </Badge>
              </div>
              <div className="text-right space-y-1">
                {trend && (
                  <div className="flex items-center gap-1 justify-end">
                    {trend.direction === "up" && <TrendingUp className="h-4 w-4 text-green-600" />}
                    {trend.direction === "down" && <TrendingDown className="h-4 w-4 text-red-600" />}
                    {trend.direction === "stable" && <Minus className="h-4 w-4 text-muted-foreground" />}
                    <span className="text-sm font-medium">
                      {trend.change > 0 ? `${trend.direction === "up" ? "+" : "-"}${trend.change}` : "—"}
                    </span>
                  </div>
                )}
                {pendingFinancialActions > 0 ? (
                  <div className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="text-xs">{pendingFinancialActions} actions</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-green-600">
                    <ShieldCheck className="h-3 w-3" />
                    <span className="text-xs">All clear</span>
                  </div>
                )}
              </div>
            </div>
            <Progress value={financialScore} className="h-2" />
            <Link to="/financial-risk">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                View Financial Tools
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </>
        ) : (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">No financial assessment yet</p>
            <Link to="/financial-risk">
              <Button variant="outline" size="sm">
                <DollarSign className="h-4 w-4 mr-1" />
                Start Assessment
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
