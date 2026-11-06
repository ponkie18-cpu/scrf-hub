ALTER TABLE public.agent_accuracy_logs
  ADD COLUMN IF NOT EXISTS model_used text DEFAULT 'google/gemini-3-flash-preview',
  ADD COLUMN IF NOT EXISTS query_type text DEFAULT 'simple_question',
  ADD COLUMN IF NOT EXISTS grounding_used boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS context_fetch_latency_ms integer;