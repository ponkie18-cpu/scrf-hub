
-- Partners table: up to 20 partners per user
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  relationship_type text NOT NULL DEFAULT 'supplier',
  start_date date,
  contract_value_band text DEFAULT 'not_specified',
  notes text,
  reliability_score integer DEFAULT 50,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own partners" ON public.partners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own partners" ON public.partners FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own partners" ON public.partners FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own partners" ON public.partners FOR DELETE USING (auth.uid() = user_id);

-- Partner interactions table
CREATE TABLE public.partner_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  interaction_date date NOT NULL DEFAULT CURRENT_DATE,
  on_time text NOT NULL DEFAULT 'yes',
  commitments_honoured text NOT NULL DEFAULT 'yes',
  communication_score integer NOT NULL DEFAULT 3,
  incident_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interactions" ON public.partner_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interactions" ON public.partner_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own interactions" ON public.partner_interactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own interactions" ON public.partner_interactions FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for partner tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.partners;
ALTER PUBLICATION supabase_realtime ADD TABLE public.partner_interactions;
