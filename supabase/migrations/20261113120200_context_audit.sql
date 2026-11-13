BEGIN;
CREATE TABLE public.agent_context_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  company_id uuid REFERENCES public.companies(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  context_schema_version text NOT NULL,
  policy_version text NOT NULL,
  prompt_version text NOT NULL DEFAULT 'semantic-v1',
  scoring_version text NOT NULL,
  configuration_hash text NOT NULL,
  selected_evidence_refs jsonb NOT NULL DEFAULT '[]',
  source_statuses jsonb NOT NULL DEFAULT '{}',
  domain_coverage jsonb,
  context_token_count integer,
  fetch_latency_ms integer NOT NULL CHECK (fetch_latency_ms >= 0),
  validation_flags jsonb NOT NULL DEFAULT '[]',
  CHECK (jsonb_typeof(selected_evidence_refs) = 'array'),
  CHECK (jsonb_typeof(source_statuses) = 'object')
);
ALTER TABLE public.agent_context_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and admins inspect context metadata" ON public.agent_context_events
FOR SELECT TO authenticated USING (
  expires_at > now() AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
);
-- Inserts are service-side only. Physical expiry cleanup must be configured by
-- the operator; expires_at and this index do not automatically delete rows.
CREATE INDEX agent_context_events_owner_idx ON public.agent_context_events(user_id, created_at DESC);
CREATE INDEX agent_context_events_expiry_idx ON public.agent_context_events(expires_at);
COMMIT;