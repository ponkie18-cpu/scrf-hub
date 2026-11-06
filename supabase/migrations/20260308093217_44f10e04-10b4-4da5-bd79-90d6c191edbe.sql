
-- ══════════════════════════════════════════════════════════
-- SECURITY AUDIT: RLS Policy Fixes & Data Governance
-- ══════════════════════════════════════════════════════════

-- 1. Add missing config.toml entries for new functions
-- (handled in config.toml file edit)

-- 2. Create compliance_log table for anonymised deletion records
CREATE TABLE IF NOT EXISTS public.compliance_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  anonymised_ref text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.compliance_log ENABLE ROW LEVEL SECURITY;

-- compliance_log: only service role can insert, select is restricted
CREATE POLICY "Service role only - select" ON public.compliance_log
  FOR SELECT TO authenticated USING (false);

-- 3. Create audit_log table for comprehensive action logging
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" ON public.audit_log
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audit logs" ON public.audit_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 4. Create ai_rate_limits table for server-side rate limiting
CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  call_count integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role should access rate limits (edge functions use service key)
-- No user-facing policies needed

-- Add unique constraint on user_id for upsert
ALTER TABLE public.ai_rate_limits ADD CONSTRAINT ai_rate_limits_user_id_key UNIQUE (user_id);

-- 5. Fix: Add WITH CHECK to feedback INSERT policy (currently missing)
-- feedback table already has insert policy with WITH CHECK true, which is fine for public feedback

-- 6. Ensure regulatory-alert-engine and send-advisor-report functions 
-- are listed in config.toml (done via file edit)
