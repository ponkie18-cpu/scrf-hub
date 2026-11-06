
-- Expert reviewers table
CREATE TABLE public.expert_reviewers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  qualification text NOT NULL,
  regulatory_domain text NOT NULL,
  registration_number text,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.expert_reviewers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read expert_reviewers" ON public.expert_reviewers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert expert_reviewers" ON public.expert_reviewers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update expert_reviewers" ON public.expert_reviewers FOR UPDATE TO authenticated USING (true);

-- Quarterly accuracy reports table
CREATE TABLE public.quarterly_accuracy_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quarter text NOT NULL,
  report_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at timestamptz DEFAULT now(),
  generated_by text
);

ALTER TABLE public.quarterly_accuracy_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read quarterly_accuracy_reports" ON public.quarterly_accuracy_reports FOR SELECT TO authenticated USING (true);

-- Response escalations table for tracking blocked/escalated responses
CREATE TABLE public.response_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid REFERENCES public.validation_responses(id) NOT NULL,
  review_id uuid REFERENCES public.expert_reviews(id) NOT NULL,
  escalation_level text NOT NULL DEFAULT 'high',
  reason text NOT NULL,
  resolved boolean DEFAULT false,
  resolved_by text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.response_escalations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read response_escalations" ON public.response_escalations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert response_escalations" ON public.response_escalations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated update response_escalations" ON public.response_escalations FOR UPDATE TO authenticated USING (true);
