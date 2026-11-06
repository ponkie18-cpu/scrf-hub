-- Create companies table for multi-tenant support
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  industry TEXT NOT NULL DEFAULT 'general',
  size TEXT NOT NULL DEFAULT '1-10',
  country TEXT DEFAULT 'UK',
  region TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  subscription_features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table linking users to companies
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'owner',
  notification_email BOOLEAN DEFAULT true,
  notification_push BOOLEAN DEFAULT false,
  digest_frequency TEXT DEFAULT 'weekly',
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tool_definitions table
CREATE TABLE public.tool_definitions (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  domain TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'assessment',
  icon TEXT,
  estimated_time INTEGER DEFAULT 10,
  complexity TEXT DEFAULT 'simple',
  inputs JSONB DEFAULT '[]'::jsonb,
  outputs JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scoring_config table for configurable algorithm
CREATE TABLE public.scoring_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  domain_weights JSONB NOT NULL DEFAULT '{"operational": 0.25, "financial": 0.25, "compliance": 0.25, "strategic": 0.25}'::jsonb,
  industry_multipliers JSONB DEFAULT '{}'::jsonb,
  category_weights JSONB DEFAULT '{}'::jsonb,
  recency_bias NUMERIC DEFAULT 0.7,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  action_url TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alerts table for regulatory and system alerts
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'regulatory',
  title TEXT NOT NULL,
  message TEXT,
  priority TEXT DEFAULT 'medium',
  domain TEXT,
  dismissed BOOLEAN DEFAULT false,
  snoozed_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoring_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Users can view their company" ON public.companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Company owners can update their company" ON public.companies
  FOR UPDATE USING (
    id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
  );

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Tool definitions are public read
CREATE POLICY "Anyone can view tool definitions" ON public.tool_definitions
  FOR SELECT USING (true);

-- Scoring config policies
CREATE POLICY "Users can view their company scoring config" ON public.scoring_config
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR company_id IS NULL
  );

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Alerts policies
CREATE POLICY "Users can view their company alerts" ON public.alerts
  FOR SELECT USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
    OR company_id IS NULL
  );

CREATE POLICY "Users can update their company alerts" ON public.alerts
  FOR UPDATE USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

-- Add company_id to existing tables
ALTER TABLE public.action_items ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.risk_assessments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.risk_assessments ADD COLUMN IF NOT EXISTS tool_id TEXT;
ALTER TABLE public.risk_assessments ADD COLUMN IF NOT EXISTS insights JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.risk_assessments ADD COLUMN IF NOT EXISTS recommendations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.risk_assessments ADD COLUMN IF NOT EXISTS confidence NUMERIC DEFAULT 1.0;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_company_id UUID;
BEGIN
  -- Create a new company for the user
  INSERT INTO public.companies (name, industry)
  VALUES (
    COALESCE(new.raw_user_meta_data ->> 'company_name', 'My Company'),
    COALESCE(new.raw_user_meta_data ->> 'industry', 'general')
  )
  RETURNING id INTO new_company_id;
  
  -- Create user profile linked to company
  INSERT INTO public.profiles (id, company_id, name, role)
  VALUES (
    new.id,
    new_company_id,
    COALESCE(new.raw_user_meta_data ->> 'name', new.email),
    'owner'
  );
  
  -- Create default scoring config for the company
  INSERT INTO public.scoring_config (company_id)
  VALUES (new_company_id);
  
  RETURN new;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update triggers for updated_at columns
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scoring_config_updated_at
  BEFORE UPDATE ON public.scoring_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.score_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.action_items;

-- Insert default tool definitions
INSERT INTO public.tool_definitions (id, name, description, domain, category, icon, estimated_time, complexity) VALUES
('spof', 'SPOF Finder', 'Identify single points of failure in your operations', 'operational', 'assessment', 'AlertTriangle', 15, 'simple'),
('bia', 'BIA Lite', 'Business impact analysis for critical processes', 'operational', 'planning', 'BarChart3', 20, 'intermediate'),
('process-doc', 'Process Doc Builder', 'Document key business processes', 'operational', 'planning', 'FileText', 30, 'simple'),
('cashflow', 'Cash Flow Stress Test', 'Test cash flow under various scenarios', 'financial', 'assessment', 'TrendingDown', 15, 'intermediate'),
('tax-forecast', 'Tax Liability Forecaster', 'Forecast upcoming tax obligations', 'financial', 'planning', 'Calculator', 10, 'simple'),
('financial-health', 'Financial Health Scorecard', 'Comprehensive financial health check', 'financial', 'assessment', 'Heart', 20, 'intermediate'),
('contract', 'Contract Risk Checker', 'Analyze contracts for risk clauses', 'compliance', 'assessment', 'FileSearch', 15, 'intermediate'),
('regulatory', 'Regulatory Tracker', 'Track regulatory requirements and deadlines', 'compliance', 'monitoring', 'Scale', 10, 'simple'),
('data-protection', 'Data Protection Audit', 'Audit data protection compliance', 'compliance', 'assessment', 'Shield', 25, 'advanced'),
('cyber', 'Cyber Resilience Scorecard', 'Assess cyber security posture', 'strategic', 'assessment', 'Lock', 20, 'intermediate'),
('horizon', 'Horizon Scanner', 'Scan for emerging risks and opportunities', 'strategic', 'monitoring', 'Radar', 15, 'simple'),
('incident', 'Incident Playbook Builder', 'Create incident response playbooks', 'strategic', 'planning', 'BookOpen', 30, 'advanced')
ON CONFLICT (id) DO NOTHING;