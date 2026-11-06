import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateShortSA, formatDateSA } from "@/lib/dateFormat";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, TrendingDown, Minus, Info, Download } from "lucide-react";

interface ScoreHistory {
  domain: string;
  score: number;
  recorded_at: string;
}

interface ResilienceScoreProps {
  currentScore: number;
  domainScores: Record<string, number | null>;
  scoreHistory: ScoreHistory[];
}

const ResilienceScore = ({ currentScore, domainScores, scoreHistory }: ResilienceScoreProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "from-green-500/20 to-green-500/5";
    if (score >= 60) return "from-amber-500/20 to-amber-500/5";
    if (score >= 40) return "from-orange-500/20 to-orange-500/5";
    return "from-red-500/20 to-red-500/5";
  };

  // Process history for chart
  const overallHistory = scoreHistory
    .filter((h) => h.domain === "overall")
    .sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime())
    .slice(-12)
    .map((h) => ({
      date: formatDateShortSA(h.recorded_at),
      score: h.score,
    }));

  // Calculate trend
  const getTrend = () => {
    if (overallHistory.length < 2) return { direction: "neutral", change: 0 };
    const recent = overallHistory[overallHistory.length - 1]?.score || 0;
    const previous = overallHistory[overallHistory.length - 2]?.score || 0;
    const change = recent - previous;
    return {
      direction: change > 0 ? "up" : change < 0 ? "down" : "neutral",
      change: Math.abs(change),
    };
  };

  const trend = getTrend();

  const hasData = currentScore > 0 || Object.values(domainScores).some((s) => s !== null);

  const exportReport = () => {
    const report = `
SCRF Resilience Report
Generated: ${formatDateSA(new Date())}

Overall Score: ${currentScore}/100

Domain Scores:
- Operational: ${domainScores.operational ?? "Not assessed"}
- Financial: ${domainScores.financial ?? "Not assessed"}
- Compliance & Legal: ${domainScores.compliance ?? "Not assessed"}
- Strategic & Cyber: ${domainScores.strategic ?? "Not assessed"}

Score History:
${overallHistory.map((h) => `  ${h.date}: ${h.score}`).join("\n")}
    `.trim();

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resilience-report-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={`bg-gradient-to-br ${hasData ? getScoreBg(currentScore) : "from-muted/50 to-muted/20"} border-primary/20`}>
      <CardContent className="py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Main Score */}
          <div className="text-center md:text-left flex-1">
            <p className="text-sm text-muted-foreground mb-2">Your Business Health Score</p>
            <div className="flex items-center gap-4">
              <div className={`text-4xl sm:text-6xl font-bold ${hasData ? getScoreColor(currentScore) : "text-muted-foreground"}`}>
                {hasData ? currentScore : "—"}
              </div>
              {hasData && trend.change > 0 && (
                <Badge
                  variant="outline"
                  className={`flex items-center gap-1 ${
                    trend.direction === "up"
                      ? "bg-green-100 text-green-700 border-green-300"
                      : trend.direction === "down"
                      ? "bg-red-100 text-red-700 border-red-300"
                      : ""
                  }`}
                >
                  {trend.direction === "up" && <TrendingUp className="h-3 w-3" />}
                  {trend.direction === "down" && <TrendingDown className="h-3 w-3" />}
                  {trend.direction === "neutral" && <Minus className="h-3 w-3" />}
                  {trend.change} pts
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">/ 100</p>
          </div>

          {/* Sparkline */}
          {overallHistory.length > 1 && (
            <div className="w-full md:w-48 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overallHistory}>
                  <defs>
                    <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="url(#scoreGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Domain Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { key: "operational", label: "Operational" },
            { key: "financial", label: "Financial" },
            { key: "compliance", label: "Compliance" },
            { key: "strategic", label: "Strategic" },
          ].map((domain) => {
            const score = domainScores[domain.key];
            return (
              <div key={domain.key} className="text-center p-3 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">{domain.label}</p>
                <p
                  className={`text-lg font-semibold ${
                    score !== null ? getScoreColor(score) : "text-muted-foreground"
                  }`}
                >
                  {score !== null ? score : "—"}
                </p>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-2 mt-6">
          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={!hasData}>
                <Info className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Score History & Trends</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {overallHistory.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={overallHistory}>
                        <XAxis dataKey="date" fontSize={12} />
                        <YAxis domain={[0, 100]} fontSize={12} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={{ fill: "hsl(var(--primary))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Complete more assessments to see your score trends over time.
                  </p>
                )}

                <div className="flex justify-end">
                  <Button variant="outline" size="sm" onClick={exportReport}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {!hasData && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Complete assessments in each domain to see your score
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ResilienceScore;
