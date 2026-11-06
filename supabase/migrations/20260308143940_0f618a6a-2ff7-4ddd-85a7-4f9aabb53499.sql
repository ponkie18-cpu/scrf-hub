
-- Validation Questions
CREATE TABLE public.validation_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL CHECK (domain IN ('tax_sars','popia','cipc_companies_act','labour_bcea','fais_financial')),
  question_text text NOT NULL,
  question_context text,
  expected_topic_coverage text,
  difficulty text CHECK (difficulty IN ('basic','intermediate','advanced')),
  sa_law_references text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

ALTER TABLE public.validation_questions ENABLE ROW LEVEL SECURITY;

-- Only service role (admin edge functions) can manage
CREATE POLICY "Service role full access on validation_questions" ON public.validation_questions
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "Authenticated read validation_questions" ON public.validation_questions
  FOR SELECT TO authenticated USING (true);

-- Validation Responses
CREATE TABLE public.validation_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES public.validation_questions(id) ON DELETE CASCADE NOT NULL,
  agent_response text NOT NULL,
  agent_model_version text,
  response_generated_at timestamptz DEFAULT now(),
  user_context_used jsonb
);

ALTER TABLE public.validation_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read validation_responses" ON public.validation_responses
  FOR SELECT TO authenticated USING (true);

-- Expert Reviews
CREATE TABLE public.expert_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid REFERENCES public.validation_responses(id) ON DELETE CASCADE NOT NULL,
  reviewer_name text NOT NULL,
  reviewer_qualification text NOT NULL,
  reviewer_domain text NOT NULL,
  accuracy_score integer CHECK (accuracy_score BETWEEN 1 AND 5),
  sa_compliance_score integer CHECK (sa_compliance_score BETWEEN 1 AND 5),
  completeness_score integer CHECK (completeness_score BETWEEN 1 AND 5),
  sme_accessibility_score integer CHECK (sme_accessibility_score BETWEEN 1 AND 5),
  is_advice_harmful boolean DEFAULT false,
  is_advice_misleading boolean DEFAULT false,
  is_advice_incomplete boolean DEFAULT false,
  specific_errors text,
  missing_content text,
  correct_answer_summary text,
  sa_references_to_add text[] DEFAULT '{}',
  reviewed_at timestamptz DEFAULT now(),
  review_status text DEFAULT 'pending' CHECK (review_status IN ('pending','reviewed','correction_applied','disputed'))
);

ALTER TABLE public.expert_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read expert_reviews" ON public.expert_reviews
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert expert_reviews" ON public.expert_reviews
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update expert_reviews" ON public.expert_reviews
  FOR UPDATE TO authenticated USING (true);

-- Knowledge Corrections
CREATE TABLE public.knowledge_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES public.expert_reviews(id) ON DELETE CASCADE NOT NULL,
  domain text NOT NULL,
  correction_type text CHECK (correction_type IN ('factual_error','missing_context','outdated_law','incorrect_threshold','wrong_entity_type','misleading_framing')),
  original_agent_statement text NOT NULL,
  corrected_statement text NOT NULL,
  supporting_reference text,
  severity text CHECK (severity IN ('critical','high','medium','low')),
  applied_to_system_prompt boolean DEFAULT false,
  applied_at timestamptz,
  applied_by text
);

ALTER TABLE public.knowledge_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read knowledge_corrections" ON public.knowledge_corrections
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated insert knowledge_corrections" ON public.knowledge_corrections
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated update knowledge_corrections" ON public.knowledge_corrections
  FOR UPDATE TO authenticated USING (true);

-- Applied corrections knowledge base (used by agent)
CREATE TABLE public.agent_knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  correction_id uuid REFERENCES public.knowledge_corrections(id),
  domain text NOT NULL,
  corrected_statement text NOT NULL,
  supporting_reference text,
  applied_at timestamptz DEFAULT now(),
  applied_by text
);

ALTER TABLE public.agent_knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read agent_knowledge_base" ON public.agent_knowledge_base
  FOR SELECT TO authenticated USING (true);
