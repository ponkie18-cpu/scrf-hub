-- Table for storing score history for trend tracking
CREATE TABLE public.score_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN ('operational', 'financial', 'compliance', 'strategic', 'overall')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for user preferences (quick tools, onboarding status)
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  quick_tools JSONB DEFAULT '["spof", "cashflow", "contract", "cyber", "regulatory", "bia"]',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for score_history
CREATE POLICY "Users can view their own score history"
ON public.score_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own score history"
ON public.score_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences"
ON public.user_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences"
ON public.user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.user_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for preferences timestamp
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster score history queries
CREATE INDEX idx_score_history_user_domain ON public.score_history(user_id, domain, recorded_at DESC);