
-- 1. Eval questions (must exist before agent_evaluations FK)
CREATE TABLE public.eval_questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category        text NOT NULL,
  question_text   text NOT NULL,
  expected_behaviour text NOT NULL,
  red_flags       text[] DEFAULT '{}',
  difficulty      text DEFAULT 'basic',
  domain          text,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.eval_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view eval_questions"
  ON public.eval_questions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage eval_questions"
  ON public.eval_questions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Eval runs
CREATE TABLE public.eval_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type        text,
  triggered_by    text,
  total_questions integer,
  avg_overall     numeric,
  avg_grounding   numeric,
  avg_accuracy    numeric,
  avg_scope       numeric,
  avg_clarity     numeric,
  avg_sa_context  numeric,
  critical_flags  integer DEFAULT 0,
  pass_threshold  numeric DEFAULT 3.5,
  passed          boolean,
  started_at      timestamptz DEFAULT now(),
  completed_at    timestamptz
);

ALTER TABLE public.eval_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view eval_runs"
  ON public.eval_runs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Agent evaluations
CREATE TABLE public.agent_evaluations (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  eval_run_id           uuid NOT NULL REFERENCES public.eval_runs(id) ON DELETE CASCADE,
  question_id           uuid REFERENCES public.eval_questions(id),
  question_text         text NOT NULL,
  eval_category         text NOT NULL,
  user_context_used     jsonb,
  agent_response        text NOT NULL,
  gemini_model_used     text,
  response_latency_ms   integer,
  tokens_used           integer,
  grounding_score       integer,
  accuracy_score        integer,
  scope_score           integer,
  clarity_score         integer,
  sa_context_score      integer,
  overall_score         numeric GENERATED ALWAYS AS (
    (COALESCE(grounding_score,0) + COALESCE(accuracy_score,0) + COALESCE(scope_score,0) + COALESCE(clarity_score,0) + COALESCE(sa_context_score,0)) / 5.0
  ) STORED,
  hallucination_detected boolean DEFAULT false,
  scope_violation        boolean DEFAULT false,
  generic_response       boolean DEFAULT false,
  incorrect_sa_law       boolean DEFAULT false,
  evaluator_type         text DEFAULT 'automated',
  evaluator_notes        text,
  evaluated_at           timestamptz DEFAULT now()
);

ALTER TABLE public.agent_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view agent_evaluations"
  ON public.agent_evaluations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Eval baselines
CREATE TABLE public.eval_baselines (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id       uuid REFERENCES public.eval_questions(id) ON DELETE CASCADE,
  baseline_response text NOT NULL,
  baseline_score    numeric,
  authored_by       text,
  domain_expert     text,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE public.eval_baselines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view eval_baselines"
  ON public.eval_baselines FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage eval_baselines"
  ON public.eval_baselines FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX idx_agent_evaluations_run_id ON public.agent_evaluations(eval_run_id);
CREATE INDEX idx_agent_evaluations_question_id ON public.agent_evaluations(question_id);
CREATE INDEX idx_eval_runs_started_at ON public.eval_runs(started_at DESC);
CREATE INDEX idx_eval_questions_category ON public.eval_questions(category);
CREATE INDEX idx_eval_questions_domain ON public.eval_questions(domain);
