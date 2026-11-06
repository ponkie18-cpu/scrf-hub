import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useEvalRuns, useEvalQuestions, useRecentFlags, useAllEvalDetails } from "@/components/eval/useEvalData";
import HeadlineScorecard from "@/components/eval/HeadlineScorecard";
import TrendChart from "@/components/eval/TrendChart";
import CriticalFlags from "@/components/eval/CriticalFlags";
import CategoryBreakdown from "@/components/eval/CategoryBreakdown";
import EvalHistory from "@/components/eval/EvalHistory";
import BaselineComparison from "@/components/eval/BaselineComparison";
import QuestionManagement from "@/components/eval/QuestionManagement";
import RunControls from "@/components/eval/RunControls";
import { useState } from "react";

export default function AdminAIEvaluation() {
  const { user } = useAuth();
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const { data: isAdmin, isLoading: adminLoading } = useQuery({
    queryKey: ["is-admin-eval", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
      return data && data.length > 0;
    },
    enabled: !!user,
  });

  const { data: runs = [], isLoading: runsLoading } = useEvalRuns(30);
  const { data: questions = [] } = useEvalQuestions();
  const { data: recentFlags = [] } = useRecentFlags(24);
  const { data: allEvals = [] } = useAllEvalDetails();

  if (!user) return <Navigate to="/auth" replace />;
  if (adminLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (isAdmin === false) return <Navigate to="/dashboard" replace />;

  const completedRuns = runs.filter((r) => r.completed_at);
  const latestRun = completedRuns[0];
  const previousRun = completedRuns[1];
  const baselineRun = completedRuns[completedRuns.length - 1];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Agent Evaluation Dashboard</h1>
            <p className="text-muted-foreground">Continuous quality monitoring — 5 dimensions × 30 test questions</p>
          </div>
        </div>

        {runsLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* PANEL 1 — Headline Scorecard */}
            <HeadlineScorecard latestRun={latestRun} previousRun={previousRun} />

            {/* PANEL 2 — Trend Chart */}
            <TrendChart runs={completedRuns} onRunClick={setSelectedRunId} />

            {/* PANEL 3 — Critical Flags */}
            <CriticalFlags flags={recentFlags} />

            {/* PANEL 4 — Category Breakdown */}
            <CategoryBreakdown evaluations={allEvals} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* PANEL 6 — Baseline Comparison */}
              <BaselineComparison latestRun={latestRun} baselineRun={baselineRun} />

              {/* PANEL 8 — Run Controls */}
              <RunControls />
            </div>

            {/* PANEL 5 — Evaluation History */}
            <EvalHistory runs={runs} />

            {/* PANEL 7 — Question Management */}
            <QuestionManagement questions={questions} />
          </>
        )}
      </div>
    </div>
  );
}
