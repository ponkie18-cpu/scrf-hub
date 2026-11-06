-- Create system_prompt_updates table for 4-eyes approval workflow
CREATE TABLE IF NOT EXISTS public.system_prompt_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  correction_id uuid REFERENCES public.knowledge_corrections(id) ON DELETE CASCADE NOT NULL,
  proposed_addition text NOT NULL,
  current_knowledge_snapshot text,
  submitted_by text NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  approved_by text,
  approved_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason text
);

ALTER TABLE public.system_prompt_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read system_prompt_updates" ON public.system_prompt_updates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert system_prompt_updates" ON public.system_prompt_updates
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update system_prompt_updates" ON public.system_prompt_updates
  FOR UPDATE TO authenticated USING (true);

-- Create validation_metrics table for monthly reports
CREATE TABLE IF NOT EXISTS public.validation_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_month date NOT NULL,
  domain text NOT NULL,
  avg_accuracy_score numeric(3,2),
  avg_compliance_score numeric(3,2),
  avg_completeness_score numeric(3,2),
  avg_accessibility_score numeric(3,2),
  total_reviews integer DEFAULT 0,
  harmful_count integer DEFAULT 0,
  misleading_count integer DEFAULT 0,
  corrections_applied integer DEFAULT 0,
  corrections_pending integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (report_month, domain)
);

ALTER TABLE public.validation_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read validation_metrics" ON public.validation_metrics
  FOR SELECT TO authenticated USING (true);