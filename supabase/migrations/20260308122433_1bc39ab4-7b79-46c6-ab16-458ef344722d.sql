-- Add payment tracking columns to user_subscriptions
ALTER TABLE public.user_subscriptions
  ADD COLUMN IF NOT EXISTS paystack_customer_code text,
  ADD COLUMN IF NOT EXISTS paystack_subscription_code text,
  ADD COLUMN IF NOT EXISTS paystack_email_token text,
  ADD COLUMN IF NOT EXISTS subscription_active boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS current_period_end timestamp with time zone,
  ADD COLUMN IF NOT EXISTS last_payment_reference text,
  ADD COLUMN IF NOT EXISTS plan_code text;

-- Create payment_history table for audit trail
CREATE TABLE IF NOT EXISTS public.payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'ZAR',
  reference text NOT NULL UNIQUE,
  paystack_status text NOT NULL,
  plan_code text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON public.payment_history FOR SELECT
  USING (auth.uid() = user_id);

-- Create a function to activate paid subscription (called by webhook)
CREATE OR REPLACE FUNCTION public.activate_paid_subscription(
  _user_id uuid,
  _paystack_customer_code text,
  _paystack_subscription_code text,
  _plan_code text,
  _current_period_end timestamp with time zone
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.user_subscriptions
  SET
    tier = 'pro',
    subscription_active = true,
    paystack_customer_code = _paystack_customer_code,
    paystack_subscription_code = _paystack_subscription_code,
    plan_code = _plan_code,
    current_period_end = _current_period_end,
    updated_at = now()
  WHERE user_id = _user_id;
  RETURN FOUND;
END;
$$;

-- Create a function to deactivate subscription (cancellation/failed payment)
CREATE OR REPLACE FUNCTION public.deactivate_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.user_subscriptions
  SET
    tier = 'free_registered',
    subscription_active = false,
    paystack_subscription_code = NULL,
    updated_at = now()
  WHERE user_id = _user_id;
  RETURN FOUND;
END;
$$;