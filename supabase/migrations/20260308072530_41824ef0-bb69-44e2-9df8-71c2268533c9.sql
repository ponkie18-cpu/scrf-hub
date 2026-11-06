
-- regulatory_updates reference table (seeded manually)
CREATE TABLE public.regulatory_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  impact text NOT NULL DEFAULT 'medium',
  effective_date date,
  industries text[] NOT NULL DEFAULT '{}',
  jurisdictions text[] NOT NULL DEFAULT '{}',
  source_url text,
  ai_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.regulatory_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read regulatory updates"
  ON public.regulatory_updates FOR SELECT TO authenticated USING (true);

-- Add industry_code and jurisdiction to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS industry_code text DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS jurisdiction text DEFAULT 'national';

-- audit_trail table for mark-as-reviewed logging
CREATE TABLE public.audit_trail (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own audit entries"
  ON public.audit_trail FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own audit entries"
  ON public.audit_trail FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Enable INSERT on notifications for service role (already blocked for users via RLS)
-- We need a function to insert notifications from edge functions
CREATE OR REPLACE FUNCTION public.insert_regulatory_notification(
  _user_id uuid,
  _title text,
  _message text,
  _urgency text DEFAULT 'medium',
  _action_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, action_url)
  VALUES (_user_id, 'regulatory_alert', _title, _message, _action_url)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;
