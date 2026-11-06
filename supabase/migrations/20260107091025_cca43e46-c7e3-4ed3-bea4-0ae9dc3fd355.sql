-- Table for storing user risk assessment scores
CREATE TABLE public.risk_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN ('operational', 'financial', 'compliance', 'strategic')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  assessment_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for user action items/tasks
CREATE TABLE public.action_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN ('operational', 'financial', 'compliance', 'strategic')),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for risk_assessments
CREATE POLICY "Users can view their own assessments"
ON public.risk_assessments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assessments"
ON public.risk_assessments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessments"
ON public.risk_assessments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assessments"
ON public.risk_assessments FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for action_items
CREATE POLICY "Users can view their own action items"
ON public.action_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own action items"
ON public.action_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own action items"
ON public.action_items FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own action items"
ON public.action_items FOR DELETE
USING (auth.uid() = user_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_risk_assessments_updated_at
BEFORE UPDATE ON public.risk_assessments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_action_items_updated_at
BEFORE UPDATE ON public.action_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();