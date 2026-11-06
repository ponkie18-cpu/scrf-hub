import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { EvalRun, scoreColor, scoreBg, scoreLabel } from "./useEvalData";

function CircularGauge({ label, score, maxScore = 5 }: { label: string; score: number; maxScore?: number }) {
  const pct = Math.min((score / maxScore) * 100, 100);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;
  const color = score >= 4.5 ? "#16a34a" : score >= 3.5 ? "#0d9488" : score >= 2.5 ? "#d97706" : "#dc2626";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${scoreColor(score)}`}>{score?.toFixed(1) || "—"}</span>
        </div>
      </div>
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <Badge variant="outline" className={`text-[10px] ${scoreBg(score)}`}>{scoreLabel(score)}</Badge>
    </div>
  );
}

export default function HeadlineScorecard({ latestRun, previousRun }: { latestRun?: EvalRun; previousRun?: EvalRun }) {
  if (!latestRun) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No evaluation runs yet. Click "Run Evaluation" to generate your first scores.
        </CardContent>
      </Card>
    );
  }

  const overall = latestRun.avg_overall || 0;
  const prevOverall = previousRun?.avg_overall || 0;
  const trend = prevOverall ? overall - prevOverall : 0;
  const passed = overall >= (latestRun.pass_threshold || 3.5) && (latestRun.critical_flags || 0) === 0;

  return (
    <div className="space-y-4">
      {/* Pass/Fail Banner */}
      <div className={`rounded-lg px-6 py-3 flex items-center gap-3 ${passed ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
        <div className={`h-3 w-3 rounded-full ${passed ? "bg-green-500" : "bg-red-500"} animate-pulse`} />
        <p className={`font-semibold ${passed ? "text-green-800" : "text-red-800"}`}>
          {passed ? "Agent performing within standards" : "AGENT BELOW THRESHOLD — REVIEW BEFORE NEXT DEPLOYMENT"}
        </p>
        {latestRun.critical_flags > 0 && (
          <Badge variant="destructive" className="ml-auto">{latestRun.critical_flags} critical flags</Badge>
        )}
      </div>

      {/* Gauges */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            <CircularGauge label="Grounding" score={latestRun.avg_grounding || 0} />
            <CircularGauge label="Accuracy" score={latestRun.avg_accuracy || 0} />
            <CircularGauge label="Scope" score={latestRun.avg_scope || 0} />
            <CircularGauge label="Clarity" score={latestRun.avg_clarity || 0} />
            <CircularGauge label="SA Context" score={latestRun.avg_sa_context || 0} />
          </div>

          {/* Overall Score */}
          <div className="mt-6 flex items-center justify-center gap-4 border-t pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
              <p className={`text-5xl font-bold ${scoreColor(overall)}`}>{overall.toFixed(1)}</p>
              <p className="text-sm text-muted-foreground">/5.0</p>
            </div>
            {trend !== 0 && (
              <div className={`flex items-center gap-1 ${trend > 0 ? "text-green-600" : "text-red-600"}`}>
                {trend > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                <span className="text-lg font-semibold">{trend > 0 ? "+" : ""}{trend.toFixed(2)}</span>
                <span className="text-xs text-muted-foreground">vs prev</span>
              </div>
            )}
            {trend === 0 && previousRun && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Minus className="h-5 w-5" /> <span className="text-sm">No change</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
