
-- Create agent accuracy logs table
CREATE TABLE public.agent_accuracy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID,
  context_injection_success BOOLEAN DEFAULT true,
  context_fields_fetched INTEGER DEFAULT 0,
  context_fields_total INTEGER DEFAULT 6,
  context_fetch_latency_ms INTEGER,
  validation_flags JSONB DEFAULT '[]'::jsonb,
  response_latency_ms INTEGER,
  total_tokens INTEGER DEFAULT 0,
  user_rating INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_accuracy_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own logs
CREATE POLICY "Users can view own accuracy logs"
  ON public.agent_accuracy_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all logs
CREATE POLICY "Admins can view all accuracy logs"
  ON public.agent_accuracy_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert own logs (for rating updates)
CREATE POLICY "Users can insert own accuracy logs"
  ON public.agent_accuracy_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own rating
CREATE POLICY "Users can update own rating"
  ON public.agent_accuracy_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for dashboard queries
CREATE INDEX idx_agent_accuracy_logs_created ON public.agent_accuracy_logs (created_at DESC);
CREATE INDEX idx_agent_accuracy_logs_user ON public.agent_accuracy_logs (user_id);
