-- ============================================
-- BILLING SCHEMA: subscriptions, billing_events, billing_failure_retries
-- ============================================

-- 1. Subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan_type text NOT NULL DEFAULT 'free',
  trial_start_date timestamptz,
  trial_end_date timestamptz,
  subscription_start_date timestamptz,
  subscription_end_date timestamptz,
  paystack_customer_code text,
  paystack_subscription_code text,
  billing_interval text,
  monthly_amount_rands integer,
  last_payment_date timestamptz,
  next_billing_date timestamptz,
  payment_failure_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Validation trigger instead of CHECK constraints
CREATE OR REPLACE FUNCTION public.validate_subscription_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.plan_type NOT IN ('free', 'trial', 'pro', 'cancelled', 'expired') THEN
    RAISE EXCEPTION 'Invalid plan_type: %', NEW.plan_type;
  END IF;
  IF NEW.billing_interval IS NOT NULL AND NEW.billing_interval NOT IN ('monthly', 'annual') THEN
    RAISE EXCEPTION 'Invalid billing_interval: %', NEW.billing_interval;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_subscription
  BEFORE INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.validate_subscription_fields();

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- 2. Billing events table
CREATE TABLE IF NOT EXISTS public.billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  event_data jsonb,
  paystack_reference text,
  amount_rands integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own billing events"
  ON public.billing_events FOR SELECT
  USING (auth.uid() = user_id);

-- No client INSERT/UPDATE/DELETE — only service role writes

-- 3. Billing failure retries table
CREATE TABLE IF NOT EXISTS public.billing_failure_retries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL,
  attempted_at timestamptz DEFAULT now(),
  failure_reason text,
  next_retry_at timestamptz,
  resolved boolean DEFAULT false
);

ALTER TABLE public.billing_failure_retries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own failure retries"
  ON public.billing_failure_retries FOR SELECT
  USING (auth.uid() = user_id);

-- No client INSERT/UPDATE/DELETE — only service role writes

-- 4. Auto-create subscription record on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  
  -- Create legacy subscription record
  INSERT INTO public.user_subscriptions (user_id, tier)
  VALUES (new.id, 'free_registered');

  -- Create new billing subscription record
  INSERT INTO public.subscriptions (user_id, plan_type)
  VALUES (new.id, 'free');
  
  RETURN new;
END;
$$;

-- 5. Enable realtime for subscriptions (for live UI updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;