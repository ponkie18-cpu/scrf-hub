import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip,
} from "recharts";
import { Radar as RadarIcon, Compass } from "lucide-react";

interface ResilienceRadarProps {
  domainScores: Record<string, number | null>;
}

const domainLabels: Record<string, string> = {
  operational: "Operational",
  financial: "Financial",
  compliance: "Compliance",
  strategic: "Strategic",
};

const domainLinks: Record<string, string> = {
  operational: "/operational-risk",
  financial: "/financial-risk",
  compliance: "/compliance-risk",
  strategic: "/strategic-cyber-risk",
};

export default function ResilienceRadar({ domainScores }: ResilienceRadarProps) {
  const data = Object.entries(domainLabels).map(([key, label]) => ({
    domain: label,
    score: domainScores[key] ?? 0,
    fullMark: 100,
  }));

  const hasData = Object.values(domainScores).some(s => s !== null);
  const assessedCount = Object.values(domainScores).filter(s => s !== null).length;
  const unassessedDomains = Object.entries(domainScores)
    .filter(([, v]) => v === null)
    .map(([k]) => k);

  const weakest = hasData
    ? Object.entries(domainScores).reduce((min, [k, v]) =>
        v !== null && (min.score === null || v < (min.score ?? 100))
          ? { key: k, score: v }
          : min,
      { key: "", score: null as number | null })
    : null;

  // Build accessible summary text for screen readers
  const accessibleSummary = hasData
    ? `Resilience Radar: ${Object.entries(domainScores)
        .map(([k, v]) => `${domainLabels[k]} ${v !== null ? v + " out of 100" : "not assessed"}`)
        .join(", ")}`
    : "Resilience Radar: No assessments completed yet.";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <RadarIcon className="h-4 w-4 text-primary" aria-hidden="true" />
          Resilience Radar
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Accessible text alternative for the chart */}
        <div className="sr-only" role="status" aria-live="polite">
          {accessibleSummary}
        </div>

        {hasData ? (
          <>
            <div className="h-52" aria-hidden="true">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="domain" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      fontSize: 12,
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Partial data guidance */}
            {assessedCount > 0 && assessedCount < 4 && (
              <div className="mt-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-primary">Partial view:</strong> You've assessed{" "}
                  {assessedCount} of 4 domains.{" "}
                  {unassessedDomains.length > 0 && (
                    <>
                      Start{" "}
                      {unassessedDomains.map((d, i) => (
                        <span key={d}>
                          {i > 0 && (i === unassessedDomains.length - 1 ? " or " : ", ")}
                          <Link to={domainLinks[d]} className="text-primary underline underline-offset-2 hover:text-primary/80">
                            {domainLabels[d]}
                          </Link>
                        </span>
                      ))}{" "}
                      for a full resilience picture.
                    </>
                  )}
                </p>
              </div>
            )}

            {weakest?.key && assessedCount === 4 && (
              <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-amber-700">Focus area:</strong>{" "}
                  {domainLabels[weakest.key]} ({weakest.score}/100) — improve this domain to raise your overall resilience.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="h-52 flex flex-col items-center justify-center text-center px-4 gap-3">
            <Compass className="h-10 w-10 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-medium text-foreground">Start your first assessment</p>
              <p className="text-xs text-muted-foreground mt-1">
                Complete a risk domain tool to see your resilience radar come to life.
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/operational-risk">Complete your first tool →</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
