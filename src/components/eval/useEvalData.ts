import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Type helpers for eval tables (not yet in generated types)
export type EvalRun = {
  id: string;
  run_type: string;
  triggered_by: string;
  total_questions: number;
  avg_overall: number;
  avg_grounding: number;
  avg_accuracy: number;
  avg_scope: number;
  avg_clarity: number;
  avg_sa_context: number;
  critical_flags: number;
  pass_threshold: number;
  passed: boolean | null;
  started_at: string;
  completed_at: string | null;
};

export type EvalDetail = {
  id: string;
  eval_run_id: string;
  question_text: string;
  eval_category: string;
  agent_response: string;
  gemini_model_used: string;
  response_latency_ms: number;
  tokens_used: number;
  grounding_score: number;
  accuracy_score: number;
  scope_score: number;
  clarity_score: number;
  sa_context_score: number;
  overall_score: number;
  hallucination_detected: boolean;
  scope_violation: boolean;
  generic_response: boolean;
  incorrect_sa_law: boolean;
  evaluator_type: string;
  evaluator_notes: string;
  evaluated_at: string;
};

export type EvalQuestion = {
  id: string;
  category: string;
  question_text: string;
  expected_behaviour: string;
  red_flags: string[];
  difficulty: string;
  domain: string;
  is_active: boolean;
  created_at: string;
};

const sb = supabase as any;

export function useEvalRuns(limit = 30) {
  return useQuery<EvalRun[]>({
    queryKey: ["eval-runs", limit],
    queryFn: async () => {
      const { data } = await sb.from("eval_runs").select("*").order("started_at", { ascending: false }).limit(limit);
      return data || [];
    },
  });
}

export function useEvalDetails(runId: string | null) {
  return useQuery<EvalDetail[]>({
    queryKey: ["eval-details", runId],
    queryFn: async () => {
      if (!runId) return [];
      const { data } = await sb.from("agent_evaluations").select("*").eq("eval_run_id", runId).order("eval_category");
      return data || [];
    },
    enabled: !!runId,
  });
}

export function useEvalQuestions() {
  return useQuery<EvalQuestion[]>({
    queryKey: ["eval-questions-all"],
    queryFn: async () => {
      const { data } = await sb.from("eval_questions").select("*").order("category");
      return data || [];
    },
  });
}

export function useRecentFlags(hours = 24) {
  return useQuery<EvalDetail[]>({
    queryKey: ["eval-flags-recent", hours],
    queryFn: async () => {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      const { data } = await sb
        .from("agent_evaluations")
        .select("*")
        .gte("evaluated_at", since)
        .or("hallucination_detected.eq.true,scope_violation.eq.true")
        .order("evaluated_at", { ascending: false });
      return data || [];
    },
  });
}

export function useAllEvalDetails() {
  return useQuery<EvalDetail[]>({
    queryKey: ["eval-details-all"],
    queryFn: async () => {
      const { data } = await sb.from("agent_evaluations").select("*").order("evaluated_at", { ascending: false }).limit(500);
      return data || [];
    },
  });
}

export function scoreColor(score: number): string {
  if (score >= 4.5) return "text-green-600";
  if (score >= 3.5) return "text-teal-600";
  if (score >= 2.5) return "text-amber-600";
  return "text-red-600";
}

export function scoreBg(score: number): string {
  if (score >= 4.5) return "bg-green-100 border-green-300";
  if (score >= 3.5) return "bg-teal-50 border-teal-300";
  if (score >= 2.5) return "bg-amber-50 border-amber-300";
  return "bg-red-50 border-red-300";
}

export function scoreLabel(score: number): string {
  if (score >= 4.5) return "Excellent";
  if (score >= 3.5) return "Good";
  if (score >= 2.5) return "Warning";
  return "Critical";
}
