
-- Add profiling columns to companies table
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS revenue_band text DEFAULT 'not_specified',
  ADD COLUMN IF NOT EXISTS years_operating integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS legal_structure text DEFAULT 'not_specified',
  ADD COLUMN IF NOT EXISTS operating_regions text[] DEFAULT '{}';

-- Add profiling columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS risk_maturity_score integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS top_concerns text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS goals text DEFAULT '';
