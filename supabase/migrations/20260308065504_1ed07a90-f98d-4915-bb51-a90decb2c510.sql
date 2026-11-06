CREATE TABLE public.agent_briefings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  briefing_text text NOT NULL,
  domain_scores jsonb,
  overdue_actions integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.agent_briefings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own briefings"
  ON public.agent_briefings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own briefings"
  ON public.agent_briefings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_agent_briefings_user_created 
  ON public.agent_briefings(user_id, created_at DESC);