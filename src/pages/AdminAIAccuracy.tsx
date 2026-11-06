import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, ShieldCheck, AlertTriangle, Clock, Coins, ThumbsUp,
  ArrowLeft, Zap, Search, Trophy, Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AccuracyLog {
  context_injection_success: boolean;
  context_fields_fetched: number;
  context_fields_total: number;
  context_fetch_latency_ms: number | null;
  validation_flags: any[];
  response_latency_ms: number | null;
  total_tokens: number | null;
  user_rating: number | null;
  created_at: string;
  model_used: string | null;
  query_type: string | null;
  grounding_used: boolean | null;
}

interface Stats {
  totalCalls: number;
  fullContext: number;
  partialContext: number;
  noContext: number;
  hallucinationCount: number;
  scopeViolationCount: number;
  genericCount: number;
  avgContextLatencyMs: number;
  avgResponseMs: number;
  p95ResponseMs: number;
  avgTokens: number;
  totalTokensToday: number;
  thumbsUp: number;
  thumbsDown: number;
  // Model breakdown
  flashCalls: number;
  proCalls: number;
  flashTokens: number;
  proTokens: number;
  // Grounding
  groundingActivationsToday: number;
  groundingActivations30d: number;
  // Quality streak
  qualityStreakDays: number;
  // Cost
  dailyCostFlashUsd: number;
  dailyCostProUsd: number;
}

function computeStats(logs: AccuracyLog[]): Stats {
  const total = logs.length;
  const empty: Stats = {
    totalCalls: 0, fullContext: 0, partialContext: 0, noContext: 0,
    hallucinationCount: 0, scopeViolationCount: 0, genericCount: 0,
    avgContextLatencyMs: 0, avgResponseMs: 0, p95ResponseMs: 0,
    avgTokens: 0, totalTokensToday: 0, thumbsUp: 0, thumbsDown: 0,
    flashCalls: 0, proCalls: 0, flashTokens: 0, proTokens: 0,
    groundingActivationsToday: 0, groundingActivations30d: 0,
    qualityStreakDays: 0, dailyCostFlashUsd: 0, dailyCostProUsd: 0,
  };
  if (total === 0) return empty;

  let fullContext = 0, partialContext = 0, noContext = 0;
  let hallucinationCount = 0, scopeViolationCount = 0, genericCount = 0;
  let thumbsUp = 0, thumbsDown = 0;
  let flashCalls = 0, proCalls = 0, flashTokens = 0, proTokens = 0;
  let groundingActivationsToday = 0, groundingActivations30d = 0;
  const latencies: number[] = [];
  const contextLatencies: number[] = [];
  let totalTokens = 0, tokenCount = 0, totalTokensToday = 0;
  let flashTokensToday = 0, proTokensToday = 0;

  const today = new Date().toDateString();

  // Quality streak: count consecutive days from today with zero HALLUCINATION + SCOPE_VIOLATION
  const dayFlags = new Map<string, boolean>(); // dateStr -> hadCriticalFlag

  for (const log of logs) {
    const logDate = new Date(log.created_at).toDateString();

    // Context injection
    if (log.context_fields_fetched >= log.context_fields_total) fullContext++;
    else if (log.context_fields_fetched === 0) noContext++;
    else partialContext++;

    // Validation flags
    const flags = Array.isArray(log.validation_flags) ? log.validation_flags : [];
    let hasCritical = false;
    for (const f of flags) {
      if (f?.type === "HALLUCINATION") { hallucinationCount++; hasCritical = true; }
      if (f?.type === "SCOPE_VIOLATION") { scopeViolationCount++; hasCritical = true; }
      if (f?.type === "GENERIC_RESPONSE") genericCount++;
    }
    if (hasCritical) dayFlags.set(logDate, true);
    else if (!dayFlags.has(logDate)) dayFlags.set(logDate, false);

    // Latency
    if (log.response_latency_ms != null) latencies.push(log.response_latency_ms);
    if (log.context_fetch_latency_ms != null) contextLatencies.push(log.context_fetch_latency_ms);

    // Tokens & model breakdown
    const isProModel = (log.model_used || "").includes("pro");
    if (isProModel) proCalls++;
    else flashCalls++;

    if (log.total_tokens != null) {
      totalTokens += log.total_tokens;
      tokenCount++;
      if (isProModel) proTokens += log.total_tokens;
      else flashTokens += log.total_tokens;

      if (logDate === today) {
        totalTokensToday += log.total_tokens;
        if (isProModel) proTokensToday += log.total_tokens;
        else flashTokensToday += log.total_tokens;
      }
    }

    // Grounding
    if (log.grounding_used) {
      groundingActivations30d++;
      if (logDate === today) groundingActivationsToday++;
    }

    // Ratings
    if (log.user_rating === 1) thumbsUp++;
    if (log.user_rating === -1) thumbsDown++;
  }

  // Quality streak
  let qualityStreakDays = 0;
  const d = new Date();
  for (let i = 0; i < 90; i++) {
    const ds = d.toDateString();
    if (dayFlags.has(ds) && dayFlags.get(ds)) break;
    if (dayFlags.has(ds)) qualityStreakDays++;
    d.setDate(d.getDate() - 1);
  }

  latencies.sort((a, b) => a - b);
  const avgResponseMs = latencies.length > 0
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
  const p95ResponseMs = latencies.length > 0
    ? latencies[Math.floor(latencies.length * 0.95)] || latencies[latencies.length - 1] : 0;
  const avgContextLatencyMs = contextLatencies.length > 0
    ? Math.round(contextLatencies.reduce((a, b) => a + b, 0) / contextLatencies.length) : 0;

  // Cost: Flash ~$0.30/1M output, Pro ~$5/1M output (blended input+output estimate)
  const dailyCostFlashUsd = (flashTokensToday / 1_000_000) * 0.30;
  const dailyCostProUsd = (proTokensToday / 1_000_000) * 5.00;

  return {
    totalCalls: total, fullContext, partialContext, noContext,
    hallucinationCount, scopeViolationCount, genericCount,
    avgContextLatencyMs, avgResponseMs, p95ResponseMs,
    avgTokens: tokenCount > 0 ? Math.round(totalTokens / tokenCount) : 0,
    totalTokensToday, thumbsUp, thumbsDown,
    flashCalls, proCalls, flashTokens, proTokens,
    groundingActivationsToday, groundingActivations30d,
    qualityStreakDays,
    dailyCostFlashUsd, dailyCostProUsd,
  };
}

function MetricRow({ label, value, target, unit = "ms", lowerIsBetter = true }: {
  label: string; value: number; target: number; unit?: string; lowerIsBetter?: boolean;
}) {
  const ok = lowerIsBetter ? value <= target : value >= target;
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {value.toLocaleString()}{unit}
        </span>
        <span className="text-xs text-muted-foreground">target: {target.toLocaleString()}{unit}</span>
      </div>
    </div>
  );
}

export default function AdminAIAccuracy() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/auth"); return; }

    (async () => {
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const hasAdmin = roles?.some((r: any) => r.role === "admin");
      if (!hasAdmin) { navigate("/dashboard"); return; }
      setIsAdmin(true);

      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data: logs } = await supabase
        .from("agent_accuracy_logs" as any)
        .select("*")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: false })
        .limit(1000);

      setStats(computeStats((logs as unknown as AccuracyLog[]) || []));
      setLoading(false);
    })();
  }, [user, authLoading, navigate]);

  if (authLoading || loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  const contextRate = stats.totalCalls > 0
    ? Math.round((stats.fullContext / stats.totalCalls) * 100) : 100;
  const satisfactionRate = (stats.thumbsUp + stats.thumbsDown) > 0
    ? Math.round((stats.thumbsUp / (stats.thumbsUp + stats.thumbsDown)) * 100) : 0;

  const ZAR_PER_USD = 18.5;
  const dailyCostZar = (stats.dailyCostFlashUsd + stats.dailyCostProUsd) * ZAR_PER_USD;
  const monthlyProjectionZar = dailyCostZar * 30;

  const flashPct = stats.totalCalls > 0 ? Math.round((stats.flashCalls / stats.totalCalls) * 100) : 0;
  const proPct = 100 - flashPct;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">AI Accuracy Monitor</h1>
            <p className="text-sm text-muted-foreground">
              Last 30 days · {stats.totalCalls.toLocaleString()} agent calls
            </p>
          </div>
        </div>

        {/* Top KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-primary/30">
            <CardContent className="pt-4 text-center">
              <Trophy className="h-5 w-5 mx-auto text-amber-500 mb-1" />
              <p className="text-3xl font-bold">{stats.qualityStreakDays}</p>
              <p className="text-xs text-muted-foreground">Clean Days Streak</p>
              <p className="text-[10px] text-muted-foreground mt-1">0 hallucinations + 0 scope violations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <ShieldCheck className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-3xl font-bold">{contextRate}%</p>
              <p className="text-xs text-muted-foreground">Context Injection</p>
              <Badge variant={contextRate >= 98 ? "default" : "destructive"} className="text-[10px] mt-1">
                {contextRate >= 98 ? "✓ Target" : "⚠ Below 98%"}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Clock className="h-5 w-5 mx-auto text-blue-500 mb-1" />
              <p className="text-3xl font-bold">{stats.avgContextLatencyMs}</p>
              <p className="text-xs text-muted-foreground">Avg Context Fetch (ms)</p>
              <Badge variant={stats.avgContextLatencyMs <= 400 ? "default" : "destructive"} className="text-[10px] mt-1">
                {stats.avgContextLatencyMs <= 400 ? "✓ < 400ms" : "⚠ Slow"}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Coins className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
              <p className="text-3xl font-bold">R{dailyCostZar.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Today's AI Cost</p>
              <p className="text-[10px] text-muted-foreground mt-1">~R{monthlyProjectionZar.toFixed(0)}/mo projected</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Model Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                Model Usage (30d)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Flash (fast/cheap)</span>
                  <span className="text-sm font-bold">{stats.flashCalls} ({flashPct}%)</span>
                </div>
                <Progress value={flashPct} className="h-2" />
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pro (deep reasoning)</span>
                  <span className="text-sm font-bold">{stats.proCalls} ({proPct}%)</span>
                </div>
                <Progress value={proPct} className="h-2" />
              </div>
              <div className="border-t border-border/50 pt-2 space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Flash tokens (30d)</span>
                  <span>{stats.flashTokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pro tokens (30d)</span>
                  <span>{stats.proTokens.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cost Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Coins className="h-4 w-4 text-yellow-500" />
                Cost by Model (Today)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Flash cost</span>
                <span className="text-sm font-semibold">R{(stats.dailyCostFlashUsd * ZAR_PER_USD).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Pro cost</span>
                <span className="text-sm font-semibold">R{(stats.dailyCostProUsd * ZAR_PER_USD).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Daily total</span>
                <span className="text-sm font-bold">R{dailyCostZar.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Monthly projection</span>
                <span className="text-sm font-bold text-primary">R{monthlyProjectionZar.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground pt-1">
                Flash: ~$0.30/1M tokens · Pro: ~$5.00/1M tokens · Rate: R{ZAR_PER_USD}/USD
              </p>
            </CardContent>
          </Card>

          {/* Grounding Activations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Search className="h-4 w-4 text-emerald-500" />
                Web Grounding (Pro)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Today</span>
                <span className="text-lg font-bold">{stats.groundingActivationsToday}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Last 30 days</span>
                <span className="text-lg font-bold">{stats.groundingActivations30d}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Activated for compliance queries (POPIA, CIPC, B-BBEE, etc.) on Pro tier only.
              </p>
            </CardContent>
          </Card>

          {/* Validation Flags */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Validation Flags (30d)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <span className="text-sm">Hallucinations</span>
                  <span className={`text-lg font-bold ${stats.hallucinationCount > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                    {stats.hallucinationCount}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-950/20">
                  <span className="text-sm">Scope Violations</span>
                  <span className={`text-lg font-bold ${stats.scopeViolationCount > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                    {stats.scopeViolationCount}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                  <span className="text-sm">Generic Responses</span>
                  <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{stats.genericCount}</span>
                </div>
              </div>
              {(stats.hallucinationCount > 0 || stats.scopeViolationCount > 0) && (
                <Badge variant="destructive" className="w-full justify-center">
                  ⚠ Immediate Review Required
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Response Latency */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                Response Latency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MetricRow label="Avg context fetch" value={stats.avgContextLatencyMs} target={400} />
              <MetricRow label="Avg total response" value={stats.avgResponseMs} target={6000} />
              <MetricRow label="p95 latency" value={stats.p95ResponseMs} target={10000} />
            </CardContent>
          </Card>

          {/* User Satisfaction */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ThumbsUp className="h-4 w-4 text-green-500" />
                User Satisfaction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">
                  {satisfactionRate > 0 ? `${satisfactionRate}%` : "—"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {stats.thumbsUp} 👍 · {stats.thumbsDown} 👎
                </span>
              </div>
              {(stats.thumbsUp + stats.thumbsDown) > 0 && (
                <Progress value={satisfactionRate} className="h-2" />
              )}
              <div className="flex items-center justify-between py-2 border-t border-border/50 text-xs text-muted-foreground">
                <span>Avg tokens/response</span>
                <span className="font-medium">{stats.avgTokens.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health Summary */}
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">System Health Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div className="flex items-center gap-2">
                {contextRate >= 98 ? "🟢" : contextRate >= 90 ? "🟡" : "🔴"}
                <span>Context grounding</span>
              </div>
              <div className="flex items-center gap-2">
                {stats.hallucinationCount === 0 && stats.scopeViolationCount === 0 ? "🟢" : "🔴"}
                <span>Content safety</span>
              </div>
              <div className="flex items-center gap-2">
                {stats.avgResponseMs <= 6000 ? "🟢" : stats.avgResponseMs <= 10000 ? "🟡" : "🔴"}
                <span>Response speed</span>
              </div>
              <div className="flex items-center gap-2">
                {stats.avgContextLatencyMs <= 400 ? "🟢" : "🟡"}
                <span>Context latency</span>
              </div>
              <div className="flex items-center gap-2">
                {satisfactionRate >= 80 || (stats.thumbsUp + stats.thumbsDown === 0) ? "🟢" : satisfactionRate >= 60 ? "🟡" : "🔴"}
                <span>User satisfaction</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
