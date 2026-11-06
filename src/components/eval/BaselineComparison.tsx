import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { EvalRun, scoreColor } from "./useEvalData";

interface BaselineComparisonProps {
  latestRun?: EvalRun;
  baselineRun?: EvalRun;
}

const DIMENSIONS = [
  { key: "avg_grounding", label: "Grounding" },
  { key: "avg_accuracy", label: "Accuracy" },
  { key: "avg_scope", label: "Scope Compliance" },
  { key: "avg_clarity", label: "Clarity" },
  { key: "avg_sa_context", label: "SA Context" },
  { key: "avg_overall", label: "Overall" },
] as const;

export default function BaselineComparison({ latestRun, baselineRun }: BaselineComparisonProps) {
  if (!latestRun || !baselineRun) {
    return (
      <Card>
        <CardHeader><CardTitle>Baseline Comparison</CardTitle></CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Need at least 2 completed runs to show baseline comparison.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Baseline Comparison</CardTitle>
          <Badge variant="outline" className="text-xs">
            Baseline: {new Date(baselineRun.started_at).toLocaleDateString("en-ZA")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Dimension</th>
              <th className="text-center py-2">Baseline</th>
              <th className="text-center py-2">Current</th>
              <th className="text-center py-2">Change</th>
              <th className="text-center py-2">Trend</th>
            </tr>
          </thead>
          <tbody>
            {DIMENSIONS.map(({ key, label }) => {
              const baseline = (baselineRun as any)[key] || 0;
              const current = (latestRun as any)[key] || 0;
              const change = current - baseline;
              const improved = change > 0.1;
              const degraded = change < -0.1;

              return (
                <tr key={key} className={`border-b ${key === "avg_overall" ? "font-bold bg-muted/30" : ""}`}>
                  <td className="py-2">{label}</td>
                  <td className={`text-center py-2 ${scoreColor(baseline)}`}>{baseline.toFixed(1)}</td>
                  <td className={`text-center py-2 ${scoreColor(current)}`}>{current.toFixed(1)}</td>
                  <td className={`text-center py-2 ${improved ? "text-green-600" : degraded ? "text-red-600" : "text-muted-foreground"}`}>
                    {change > 0 ? "+" : ""}{change.toFixed(2)}
                  </td>
                  <td className="text-center py-2">
                    {improved ? (
                      <TrendingUp className="h-4 w-4 text-green-600 inline" />
                    ) : degraded ? (
                      <TrendingDown className="h-4 w-4 text-red-600 inline" />
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground inline" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
