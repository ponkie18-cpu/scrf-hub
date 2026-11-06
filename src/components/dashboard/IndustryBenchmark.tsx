import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell,
} from "recharts";
import { Users, TrendingUp, ArrowUp, ArrowDown, Minus } from "lucide-react";

interface IndustryBenchmarkProps {
  domainScores: Record<string, number | null>;
  industry: string;
}

// Static benchmark data (would come from industry_benchmarks table in production)
const benchmarkData: Record<string, Record<string, number>> = {
  general: { operational: 52, financial: 48, compliance: 45, strategic: 40 },
  technology: { operational: 58, financial: 55, compliance: 50, strategic: 55 },
  retail: { operational: 50, financial: 45, compliance: 48, strategic: 38 },
  healthcare: { operational: 55, financial: 50, compliance: 60, strategic: 42 },
  manufacturing: { operational: 60, financial: 52, compliance: 55, strategic: 35 },
  professional_services: { operational: 48, financial: 55, compliance: 52, strategic: 50 },
  construction: { operational: 55, financial: 42, compliance: 50, strategic: 32 },
  hospitality: { operational: 45, financial: 40, compliance: 42, strategic: 35 },
};

const domainLabels: Record<string, string> = {
  operational: "Operational",
  financial: "Financial",
  compliance: "Compliance",
  strategic: "Strategic",
};

export default function IndustryBenchmark({ domainScores, industry }: IndustryBenchmarkProps) {
  const benchmarks = benchmarkData[industry] || benchmarkData.general;

  const chartData = useMemo(() =>
    Object.entries(domainLabels).map(([key, label]) => ({
      domain: label,
      you: domainScores[key] ?? 0,
      industry: benchmarks[key],
    })),
  [domainScores, benchmarks]);

  const comparisons = useMemo(() =>
    Object.entries(domainLabels).map(([key, label]) => {
      const yours = domainScores[key];
      const bench = benchmarks[key];
      if (yours === null) return { domain: label, diff: null, status: "none" as const };
      const diff = yours - bench;
      return {
        domain: label,
        diff,
        status: diff > 5 ? "above" as const : diff < -5 ? "below" as const : "inline" as const,
      };
    }),
  [domainScores, benchmarks]);

  const hasData = Object.values(domainScores).some(s => s !== null);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-primary" />
          Industry Benchmark
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasData ? (
          <>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={2}>
                  <XAxis dataKey="domain" fontSize={10} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis domain={[0, 100]} fontSize={10} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      fontSize: 11,
                    }}
                  />
                  <Bar dataKey="you" name="You" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} barSize={16} />
                  <Bar dataKey="industry" name="Industry Avg" fill="hsl(var(--muted-foreground))" opacity={0.4} radius={[2, 2, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center gap-4 text-xs justify-center">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-primary" />
                <span>You</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-muted-foreground/40" />
                <span>Industry average</span>
              </div>
            </div>

            <div className="space-y-2">
              {comparisons.map((c) => (
                <div key={c.domain} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{c.domain}</span>
                  {c.diff !== null ? (
                    <div className="flex items-center gap-1">
                      {c.status === "above" && <ArrowUp className="h-3 w-3 text-green-600" />}
                      {c.status === "below" && <ArrowDown className="h-3 w-3 text-red-600" />}
                      {c.status === "inline" && <Minus className="h-3 w-3 text-muted-foreground" />}
                      <span className={
                        c.status === "above" ? "text-green-600 font-medium" :
                        c.status === "below" ? "text-red-600 font-medium" :
                        "text-muted-foreground"
                      }>
                        {c.diff > 0 ? "+" : ""}{c.diff} vs avg
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Complete assessments to see how you compare
          </div>
        )}
      </CardContent>
    </Card>
  );
}
