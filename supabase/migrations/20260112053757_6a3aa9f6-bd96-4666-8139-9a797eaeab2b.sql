-- Create subscription tier enum
CREATE TYPE public.subscription_tier AS ENUM ('anonymous', 'free_registered', 'pro');

-- Create user_subscriptions table to track tier and trial status
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  tier subscription_tier NOT NULL DEFAULT 'free_registered',
  trial_started_at TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  saves_used INTEGER NOT NULL DEFAULT 0,
  max_saves INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view their own subscription"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own subscription (for incrementing saves_used)
CREATE POLICY "Users can update their own subscription"
ON public.user_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert subscriptions (handled by trigger)
CREATE POLICY "Users can insert their own subscription"
ON public.user_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create security definer function to check user tier
CREATE OR REPLACE FUNCTION public.get_user_tier(_user_id UUID)
RETURNS subscription_tier
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT 
      CASE 
        WHEN tier = 'pro' THEN 'pro'::subscription_tier
        WHEN tier = 'free_registered' AND trial_ends_at IS NOT NULL AND trial_ends_at > now() THEN 'pro'::subscription_tier
        ELSE tier
      END
    FROM public.user_subscriptions 
    WHERE user_id = _user_id),
    'anonymous'::subscription_tier
  )
$$;

-- Create function to check if user can save (has saves remaining)
CREATE OR REPLACE FUNCTION public.can_user_save(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT 
      CASE 
        WHEN tier = 'pro' THEN true
        WHEN tier = 'free_registered' AND trial_ends_at IS NOT NULL AND trial_ends_at > now() THEN true
        WHEN saves_used < max_saves THEN true
        ELSE false
      END
    FROM public.user_subscriptions 
    WHERE user_id = _user_id),
    false
  )
$$;

-- Create function to increment saves used
CREATE OR REPLACE FUNCTION public.increment_saves_used(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_subscriptions 
  SET saves_used = saves_used + 1, updated_at = now()
  WHERE user_id = _user_id 
    AND saves_used < max_saves 
    AND tier != 'pro'
    AND (trial_ends_at IS NULL OR trial_ends_at <= now());
  RETURN FOUND;
END;
$$;

-- Create function to start a pro trial
CREATE OR REPLACE FUNCTION public.start_pro_trial(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_subscriptions 
  SET 
    trial_started_at = now(),
    trial_ends_at = now() + INTERVAL '30 days',
    updated_at = now()
  WHERE user_id = _user_id 
    AND trial_started_at IS NULL;
  RETURN FOUND;
END;
$$;

-- Modify handle_new_user to also create subscription record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  
  -- Create subscription record for the user
  INSERT INTO public.user_subscriptions (user_id, tier)
  VALUES (new.id, 'free_registered');
  
  RETURN new;
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();